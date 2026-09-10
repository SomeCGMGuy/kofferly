import {
  getAll, getByIndex, put, del, clearTripData, getSetting, setSetting
} from "./db.js";
import { DEFAULT_PACKING } from "./defaults.js";
import { refreshDestinationImage, getDestinationImage, imageObjectUrl } from "./images.js";
import { refreshWeather, getWeather, weatherIcon } from "./weather.js";
import { buildReminder, daysUntil } from "./reminders.js";
import {
  generatePackingRecommendations, recommendationHeadline, tripLength
} from "./packing.js";

const view = document.querySelector("#view");
const tripDialog = document.querySelector("#tripDialog");
const tripForm = document.querySelector("#tripForm");
const confirmDialog = document.querySelector("#confirmDialog");
const networkBadge = document.querySelector("#networkBadge");

const LEGACY_DEFAULT_NAMES = new Set(DEFAULT_PACKING.map(item => item.name));

let state = {
  route: "home",
  trips: [],
  currentTrip: null,
  items: [],
  image: null,
  imageUrl: null,
  weather: null,
  weatherError: "",
  settings: {
    autoImage: true,
    autoWeather: true
  }
};

const uid = () => crypto.randomUUID();

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function visibleWeatherLocation(value = "") {
  return String(value)
    .split(/\r?\n/)
    .filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith("@profile:") && !trimmed.startsWith("@activities:");
    })
    .join("\n")
    .trim();
}

function formatDate(dateString, options = { day:"2-digit", month:"long", year:"numeric" }) {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("de-DE", options).format(new Date(`${dateString}T12:00:00`));
}

function formatRelative(days) {
  if (days === 0) return "Heute geht's los";
  if (days === 1) return "Morgen geht's los";
  if (days > 1) return `Noch ${days} Tage`;
  return `${Math.abs(days)} Tage seit Abreise`;
}

function packingIsReadOnly(trip = state.currentTrip) {
  return Boolean(trip) && daysUntil(trip.date) < 0;
}

function effectiveItemValue(item, field) {
  const manualKey = `manual${field[0].toUpperCase()}${field.slice(1)}`;
  return Object.prototype.hasOwnProperty.call(item || {}, manualKey) ? item[manualKey] : item?.[field];
}

function itemName(item) {
  return effectiveItemValue(item, "name") || item?.name || "";
}

function itemImportant(item) {
  return Boolean(effectiveItemValue(item, "important"));
}

function toast(message) {
  document.querySelector(".toast")?.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), 3000);
}

function updateNetworkBadge() {
  const online = navigator.onLine;
  networkBadge.textContent = online ? "Online · offline bereit" : "Offline-Modus";
  networkBadge.classList.toggle("offline", !online);
}

function setRoute(route) {
  state.route = route;
  document.querySelectorAll(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.route === route));
  render();
}

async function loadState() {
  state.trips = (await getAll("trips")).sort((a,b) => a.date.localeCompare(b.date));
  state.settings.autoImage = await getSetting("autoImage", true);
  state.settings.autoWeather = await getSetting("autoWeather", true);

  const selected = await getSetting("currentTripId", null);
  let current = state.trips.find(t => t.id === selected);

  if (!current) {
    const today = new Date();
    current = state.trips.find(t => new Date(`${t.date}T23:59:59`) >= today) || state.trips.at(-1) || null;
  }

  await selectTrip(current?.id || null, false);
}

async function selectTrip(id, rerender = true) {
  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.imageUrl = null;
  state.weatherError = "";

  state.currentTrip = state.trips.find(t => t.id === id) || null;
  if (state.currentTrip) {
    await setSetting("currentTripId", state.currentTrip.id);
    state.items = (await getByIndex("packItems", "tripId", state.currentTrip.id)).filter(item => !item.dismissed);
    state.image = await getDestinationImage(state.currentTrip.id);
    state.imageUrl = imageObjectUrl(state.image);
    state.weather = await getWeather(state.currentTrip.id);
    if (!packingIsReadOnly()) await syncGeneratedPacking(false);
  } else {
    state.items = [];
    state.image = null;
    state.weather = null;
  }
  if (rerender) render();
}

function isLegacyGenerated(item) {
  return !item.source && !item.key && LEGACY_DEFAULT_NAMES.has(item.name);
}

async function syncGeneratedPacking(showToast = true) {
  if (!state.currentTrip || packingIsReadOnly()) return;

  const generated = generatePackingRecommendations(state.currentTrip, state.weather);
  const generatedKeys = new Set(generated.map(item => item.key));
  const storedItems = await getByIndex("packItems", "tripId", state.currentTrip.id);
  const managedExisting = storedItems.filter(item => item.source === "generated" || isLegacyGenerated(item));
  const custom = storedItems.filter(item => !item.dismissed && item.source !== "generated" && !isLegacyGenerated(item));

  const byKey = new Map(managedExisting.filter(i => i.key).map(i => [i.key, i]));
  const byName = new Map(managedExisting.map(i => [i.name, i]));
  const nextManaged = [];

  for (const recommendation of generated) {
    const existing = byKey.get(recommendation.key) || byName.get(recommendation.name);
    const row = {
      ...(existing || {}),
      ...recommendation,
      id: existing?.id || uid(),
      tripId: state.currentTrip.id,
      checked: existing?.checked ?? false,
      createdAt: existing?.createdAt || new Date().toISOString()
    };
    await put("packItems", row);
    if (!row.dismissed) nextManaged.push(row);
  }

  for (const old of managedExisting) {
    const keyStillUsed = old.key && generatedKeys.has(old.key);
    const nameStillUsed = generated.some(item => item.name === old.name);
    if (!old.dismissed && !keyStillUsed && !nameStillUsed) await del("packItems", old.id);
  }

  state.items = [...nextManaged, ...custom];
  if (showToast) toast("Packempfehlung aktualisiert");
}

async function createTrip(formData) {
  const trip = {
    id: uid(),
    destination: formData.get("destination").trim(),
    weatherLocation: formData.get("weatherLocation")?.trim() || "",
    date: formData.get("date"),
    endDate: formData.get("endDate") || "",
    note: formData.get("note")?.trim() || "",
    createdAt: new Date().toISOString()
  };

  await put("trips", trip);
  for (const item of generatePackingRecommendations(trip, null)) {
    await put("packItems", {
      id: uid(),
      tripId: trip.id,
      ...item,
      checked: false,
      createdAt: new Date().toISOString()
    });
  }

  state.trips.push(trip);
  state.trips.sort((a,b) => a.date.localeCompare(b.date));
  await selectTrip(trip.id, false);

  tripDialog.close();
  tripForm.reset();
  state.route = "home";
  document.querySelectorAll(".nav-item").forEach(btn => btn.classList.toggle("active", btn.dataset.route === "home"));
  render();
  toast("Reise angelegt · Packliste berechnet");

  if (navigator.onLine) {
    if (state.settings.autoImage) refreshImage(false);
    if (state.settings.autoWeather) refreshWeatherData(false);
  }
}

async function refreshImage(showToast = true) {
  if (!state.currentTrip || !navigator.onLine) {
    if (showToast) toast("Für ein neues Zielbild brauchst du kurz Internet.");
    return;
  }

  const targetTripId = state.currentTrip.id;
  const button = document.querySelector("[data-action='refresh-image']");
  button?.setAttribute("disabled", "");

  try {
    const row = await refreshDestinationImage(targetTripId, state.currentTrip.destination);
    if (state.currentTrip?.id !== targetTripId) return;
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    state.image = row;
    state.imageUrl = imageObjectUrl(row);
    render();
    if (showToast) toast("Neues Reisezielbild gespeichert");
  } catch (err) {
    console.error(err);
    if (showToast) toast("Kein passendes Bild gefunden.");
  } finally {
    button?.removeAttribute("disabled");
  }
}

async function refreshWeatherData(showToast = true) {
  if (!state.currentTrip || !navigator.onLine) {
    state.weatherError = !navigator.onLine ? "Du bist offline. Der zuletzt gespeicherte Wetterstand bleibt verfügbar." : "";
    if (showToast) toast("Wetter kann nur online aktualisiert werden.");
    render();
    return;
  }

  const targetTripId = state.currentTrip.id;
  state.weatherError = "";
  const button = document.querySelector("[data-action='refresh-weather']");
  button?.setAttribute("disabled", "");

  try {
    const row = await refreshWeather(state.currentTrip);
    if (state.currentTrip?.id !== targetTripId) return;
    state.weather = row;
    const readOnly = packingIsReadOnly();
    if (!readOnly) await syncGeneratedPacking(false);
    render();
    if (showToast) toast(readOnly ? "Wetter aktualisiert" : "Wetter aktualisiert · Packliste angepasst");
  } catch (err) {
    console.error(err);
    state.weatherError = err?.message || "Wetter konnte nicht aktualisiert werden.";
    render();
    if (showToast) toast("Wetterort prüfen – Details stehen in der Wetterkarte.");
  } finally {
    button?.removeAttribute("disabled");
  }
}

function packingStats() {
  const total = state.items.length;
  const done = state.items.filter(i => i.checked).length;
  return { total, done, percent: total ? Math.round(done / total * 100) : 0 };
}

function weatherForTrip() {
  if (!state.weather || !state.currentTrip) return [];
  const dep = state.currentTrip.date;
  const end = state.currentTrip.endDate || state.currentTrip.date;
  return state.weather.days.filter(d => d.date >= dep && d.date <= end).slice(0,4);
}

function forecastAvailabilityText() {
  if (!state.weather?.days?.length || !state.currentTrip) return "";
  const first = state.weather.days[0].date;
  const last = state.weather.days.at(-1).date;
  if (state.currentTrip.date > last) {
    return `Die Reise liegt noch außerhalb der aktuellen Vorhersage. Der Wetterdienst reicht momentan bis ${formatDate(last)}.`;
  }
  if ((state.currentTrip.endDate || state.currentTrip.date) < first) {
    return "Der Reisezeitraum liegt vor dem aktuell verfügbaren Vorhersagefenster.";
  }
  return "";
}

function recommendationItems() {
  const wanted = ["underwear", "socks", "tops", "meds"];
  return wanted.map(key => state.items.find(i => i.key === key)).filter(Boolean);
}

function quantityText(item) {
  const quantity = effectiveItemValue(item, "quantity");
  const unit = effectiveItemValue(item, "unit") || "";
  if (quantity == null || quantity === "") return "";
  return `${quantity} ${unit}`.trim();
}

function renderHome() {
  if (!state.currentTrip) return renderEmpty();

  const trip = state.currentTrip;
  const days = daysUntil(trip.date);
  const packingReadOnly = packingIsReadOnly(trip);
  const stats = packingStats();
  const reminder = buildReminder(trip, state.items);
  const weatherDays = weatherForTrip();
  const forecastNote = forecastAvailabilityText();
  const recItems = recommendationItems();

  const heroImage = state.imageUrl
    ? `<img src="${state.imageUrl}" alt="Reiseziel ${escapeHtml(trip.destination)}" />`
    : "";

  const attribution = state.image
    ? `<div class="hero-attribution" title="${escapeHtml([state.image.title, state.image.author, state.image.license].filter(Boolean).join(" · "))}">
         ${escapeHtml(state.image.license ? `Bild · ${state.image.license}` : "Reisezielbild")}
       </div>`
    : "";

  view.innerHTML = `
    <section class="hero card">
      <div class="hero-media">${heroImage}</div>
      ${attribution}
      <div class="hero-content">
        <div class="hero-meta">
          <span class="pill">${escapeHtml(formatRelative(days))}</span>
          <span class="pill">${escapeHtml(formatDate(trip.date, {day:"2-digit",month:"short"}))}${trip.endDate ? ` – ${escapeHtml(formatDate(trip.endDate,{day:"2-digit",month:"short"}))}` : ""}</span>
        </div>
        <h1>${escapeHtml(trip.destination)}</h1>
        <p>${trip.note ? escapeHtml(trip.note) : "Besser packen. Entspannter reisen."}</p>
        <div class="quick-actions">
          <button class="button primary" data-route="packing">${packingReadOnly ? "Packliste ansehen" : "Packliste öffnen"}</button>
          <button class="button secondary" data-action="refresh-image">Anderes Bild</button>
        </div>
      </div>
    </section>

    <div class="dashboard-grid">
      <div class="stack">
        <section class="info-card reminder ${reminder.level}">
          <div class="reminder-row">
            <div class="reminder-icon">${reminder.icon}</div>
            <div>
              <p class="eyebrow">Kofferly erinnert dich</p>
              <h2>${escapeHtml(reminder.title)}</h2>
              <p>${escapeHtml(reminder.text)}</p>
            </div>
          </div>
        </section>

        ${packingReadOnly ? "" : `
        <section class="info-card card">
          <p class="eyebrow">Deine Packempfehlung</p>
          <h2>${escapeHtml(recommendationHeadline(trip, state.weather))}</h2>
          <p class="muted">Mengen werden aus Reisedauer, Zieltyp und – sobald verfügbar – dem Wetter berechnet.</p>
          <div class="pack-summary-grid">
            ${recItems.map(item => `
              <div class="pack-summary-chip">
                <strong>${escapeHtml(quantityText(item))}</strong>
                <small>${escapeHtml(itemName(item))}</small>
              </div>
            `).join("")}
          </div>
          <div class="quick-actions">
            <button class="button secondary" data-route="packing">Alle Empfehlungen ansehen</button>
          </div>
        </section>

        <section class="info-card card">
          <div class="progress-row">
            <div>
              <p class="eyebrow">Packfortschritt</p>
              <h2>${stats.done} von ${stats.total} erledigt</h2>
            </div>
            <div class="stat">${stats.percent}%</div>
          </div>
          <div class="progress" aria-label="${stats.percent}% gepackt"><span style="width:${stats.percent}%"></span></div>
          <div class="quick-actions">
            <button class="button secondary" data-route="packing">Weiterpacken</button>
          </div>
        </section>`}
      </div>

      <div class="stack">
        <section class="info-card card">
          <div class="progress-row">
            <div>
              <p class="eyebrow">Wetter am Ziel</p>
              <h2>${state.weather ? escapeHtml(state.weather.place) : "Noch nicht geladen"}</h2>
            </div>
            <button class="button small secondary" data-action="refresh-weather" ${navigator.onLine ? "" : "disabled"}>Aktualisieren</button>
          </div>

          ${weatherDays.length ? `
            <div class="weather-strip">
              ${weatherDays.map(d => `
                <div class="weather-day">
                  <span class="weather-icon">${weatherIcon(d.code)}</span>
                  <small>${escapeHtml(formatDate(d.date,{weekday:"short"}))}</small>
                  <strong>${Math.round(d.max)}°</strong>
                  <small>${Math.round(d.min)}° · ${d.rain ?? 0}% Regen</small>
                </div>
              `).join("")}
            </div>
          ` : `<p class="muted">${forecastNote ? escapeHtml(forecastNote) : "Wenn du kurz online bist, speichert Kofferly die Vorhersage lokal für unterwegs."}</p>`}

          ${state.weather?.fetchedAt ? `<p class="muted" style="margin-top:10px;font-size:.75rem">${navigator.onLine ? "Online aktualisierbar" : "Offline aus dem letzten Stand"} · Stand ${new Date(state.weather.fetchedAt).toLocaleString("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</p>` : ""}

          ${state.weatherError ? `<div class="weather-error">${escapeHtml(state.weatherError)}</div>` : ""}

          <form id="weatherLocationForm" class="weather-location-form">
            <input name="weatherLocation" value="${escapeHtml(visibleWeatherLocation(trip.weatherLocation || ""))}" placeholder="Wetterort präzisieren, z. B. Dorf Tirol" aria-label="Wetterort">
            <button class="button small ghost">Wetterort speichern</button>
          </form>
        </section>

        <section class="info-card card">
          <p class="eyebrow">Reise</p>
          <h2>${escapeHtml(formatDate(trip.date))}</h2>
          <p class="muted">${trip.endDate ? `Rückreise: ${escapeHtml(formatDate(trip.endDate))}` : "Noch keine Rückreise hinterlegt."}</p>
          <div class="quick-actions">
            <button class="button ghost" data-route="trips">Reisen verwalten</button>
          </div>
        </section>
      </div>
    </div>
  `;
}

function groupItems(items) {
  return items.reduce((map, item) => {
    if (!map.has(item.category)) map.set(item.category, []);
    map.get(item.category).push(item);
    return map;
  }, new Map());
}

function renderPacking() {
  if (!state.currentTrip) return renderEmpty();

  const groups = groupItems(state.items);
  const { days, nights } = tripLength(state.currentTrip);
  const recItems = recommendationItems();
  const readOnly = packingIsReadOnly();

  if (readOnly) {
    view.innerHTML = `
      <div class="section-head">
        <div>
          <p class="eyebrow">${escapeHtml(state.currentTrip.destination)}</p>
          <h1>Packliste</h1>
        </div>
      </div>

      <section class="pack-summary card">
        <p class="eyebrow">Reise läuft</p>
        <h2 style="margin:0">Packphase abgeschlossen</h2>
        <p class="muted">Die Packliste dieser Reise wird nicht mehr angepasst. Du kannst den letzten Stand weiterhin ansehen.</p>
      </section>

      <div class="list">
        ${[...groups.entries()].map(([category, items]) => `
          <section class="category card">
            <div class="category-head">
              <div class="category-title">
                <strong>${escapeHtml(category)}</strong>
                <span class="category-progress">${items.filter(i => i.checked).length}/${items.length}</span>
              </div>
            </div>
            <div class="pack-items">
              ${items.map(item => `
                <div class="pack-item ${item.checked ? "checked" : ""}">
                  <span class="item-copy">
                    <span class="item-name">${escapeHtml(itemName(item))}</span>
                    ${item.reason ? `<span class="item-reason">${escapeHtml(item.reason)}</span>` : ""}
                    ${item.note ? `<span class="item-note">${escapeHtml(item.note)}</span>` : ""}
                  </span>
                  <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end">
                    ${quantityText(item) ? `<span class="quantity-badge">${escapeHtml(quantityText(item))}</span>` : ""}
                    ${itemImportant(item) ? `<span class="important-badge">wichtig</span>` : ""}
                  </span>
                </div>
              `).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    `;
    return;
  }

  view.innerHTML = `
    <div class="section-head">
      <div>
        <p class="eyebrow">${escapeHtml(state.currentTrip.destination)}</p>
        <h1>Packliste</h1>
      </div>
      <button class="button secondary" data-action="regenerate-packing">Empfehlungen aktualisieren</button>
    </div>

    <section class="pack-summary card">
      <p class="eyebrow">Berechnet für deine Reise</p>
      <h2 style="margin:0">${days} Tage${nights ? ` / ${nights} Nächte` : ""}</h2>
      <p class="muted">Kofferly rechnet Mengen mit Reserve und ergänzt wetter- bzw. zielabhängige Dinge automatisch.</p>
      <div class="pack-summary-grid">
        ${recItems.map(item => `
          <div class="pack-summary-chip"><strong>${escapeHtml(quantityText(item))}</strong><small>${escapeHtml(itemName(item))}</small></div>
        `).join("")}
      </div>
    </section>

    <div class="list">
      ${[...groups.entries()].map(([category, items]) => {
        const done = items.filter(i => i.checked).length;
        return `
          <section class="category card">
            <div class="category-head">
              <div class="category-title">
                <strong>${escapeHtml(category)}</strong>
                <span class="category-progress">${done}/${items.length}</span>
              </div>
              <button class="button small ghost" data-action="check-category" data-category="${escapeHtml(category)}">
                ${done === items.length ? "Zurücksetzen" : "Alle abhaken"}
              </button>
            </div>
            <div class="pack-items">
              ${items.map(item => `
                <div class="pack-item ${item.checked ? "checked" : ""}">
                  <input type="checkbox" ${item.checked ? "checked" : ""} data-action="toggle-item" data-id="${item.id}" aria-label="${escapeHtml(itemName(item))}">
                  <span class="item-copy">
                    <span class="item-name">${escapeHtml(itemName(item))}</span>
                    ${item.reason ? `<span class="item-reason">${escapeHtml(item.reason)}</span>` : ""}
                  </span>
                  <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end">
                    ${quantityText(item) ? `<span class="quantity-badge">${escapeHtml(quantityText(item))}</span>` : ""}
                    ${itemImportant(item) ? `<span class="important-badge">wichtig</span>` : ""}
                    <button class="item-delete" data-action="delete-item" data-id="${item.id}" aria-label="Eintrag löschen">×</button>
                  </span>
                </div>
              `).join("")}
            </div>
          </section>
        `;
      }).join("")}
    </div>

    <section class="card" style="margin-top:14px;padding:16px">
      <p class="eyebrow">Eintrag ergänzen</p>
      <form class="inline-form" id="addItemForm">
        <input name="name" required placeholder="z. B. Sonnenbrille" />
        <select name="category" aria-label="Kategorie">
          ${[...groups.keys()].map(c => `<option>${escapeHtml(c)}</option>`).join("")}
          <option>Sonstiges</option>
        </select>
        <label style="display:flex;align-items:center;gap:8px;font-weight:700">
          <input type="checkbox" name="important" style="width:auto"> wichtig
        </label>
        <button class="button primary">Hinzufügen</button>
      </form>
    </section>
  `;
}

function renderTrips() {
  view.innerHTML = `
    <div class="section-head">
      <div>
        <p class="eyebrow">Kofferly</p>
        <h1>Reisen</h1>
      </div>
      <button class="button primary" data-action="new-trip">Neue Reise</button>
    </div>

    <div class="list">
      ${state.trips.length ? state.trips.map(trip => `
        <article class="trip-card card">
          <div class="trip-thumb" data-trip-thumb="${trip.id}">🧳</div>
          <div>
            <h3>${escapeHtml(trip.destination)}</h3>
            <p>${escapeHtml(formatDate(trip.date))}</p>
            <p class="muted">${escapeHtml(formatRelative(daysUntil(trip.date)))}</p>
          </div>
          <div class="trip-actions">
            <button class="button small ${state.currentTrip?.id === trip.id ? "secondary" : "ghost"}" data-action="select-trip" data-id="${trip.id}">
              ${state.currentTrip?.id === trip.id ? "Aktiv" : "Öffnen"}
            </button>
            <button class="button small ghost" data-action="delete-trip" data-id="${trip.id}">Löschen</button>
          </div>
        </article>
      `).join("") : `<section class="card info-card"><p>Noch keine Reisen gespeichert.</p></section>`}
    </div>
  `;

  state.trips.forEach(async trip => {
    const row = await getDestinationImage(trip.id);
    if (!row?.blob) return;
    const holder = document.querySelector(`[data-trip-thumb="${trip.id}"]`);
    if (!holder) return;
    const url = URL.createObjectURL(row.blob);
    holder.innerHTML = `<img src="${url}" alt="">`;
  });
}

function renderSettings() {
  view.innerHTML = `
    <div class="section-head">
      <div>
        <p class="eyebrow">Kofferly</p>
        <h1>Einstellungen</h1>
      </div>
    </div>

    <div class="settings-grid">
      <section class="setting-row card">
        <div>
          <h3>Reisezielbild automatisch laden</h3>
          <p class="muted">Nur wenn Internet vorhanden ist. Das fertige Bild wird als Blob in IndexedDB gespeichert.</p>
        </div>
        <label class="switch">
          <input type="checkbox" data-setting="autoImage" ${state.settings.autoImage ? "checked" : ""}>
          <span></span>
        </label>
      </section>

      <section class="setting-row card">
        <div>
          <h3>Wetter automatisch aktualisieren</h3>
          <p class="muted">Die Vorhersage wird online geladen, lokal gespeichert und fließt in die Packempfehlung ein.</p>
        </div>
        <label class="switch">
          <input type="checkbox" data-setting="autoWeather" ${state.settings.autoWeather ? "checked" : ""}>
          <span></span>
        </label>
      </section>

      <section class="info-card card">
        <p class="eyebrow">Intelligente Packliste</p>
        <h2>Mengen statt bloßer Stichwörter</h2>
        <p class="muted">Kofferly berechnet Kleidung und Reserven aus der Reisedauer. Wetter und typische Eigenschaften des Reiseziels ergänzen z. B. Regenjacke, Fleece, Badebekleidung oder Insektenschutz.</p>
      </section>

      <section class="info-card card">
        <p class="eyebrow">Offline-Konzept</p>
        <h2>Kein Server für deine Reisedaten</h2>
        <p class="muted">Reisen, Packlisten, Bilder und Wetter-Cache liegen lokal im Browser. Netzwerk wird nur für neue Zielbilder und Wetteraktualisierung benötigt.</p>
        <div class="notice" style="margin-top:14px">Erinnerungen erscheinen beim Öffnen der App. Ohne Push-Server kann Android eine geschlossene PWA nicht zuverlässig zu einem bestimmten Zeitpunkt wecken.</div>
      </section>

      <section class="info-card card">
        <p class="eyebrow">Datenquellen</p>
        <h2>Open-Meteo & Wikimedia Commons</h2>
        <p class="muted">Open-Meteo liefert die Wettervorhersage. Wikimedia Commons liefert Reisezielbilder; Lizenz- und Quelleninformationen werden zusammen mit dem Bild gespeichert.</p>
      </section>
    </div>
  `;
}

function renderEmpty() {
  const tpl = document.querySelector("#emptyTemplate");
  view.replaceChildren(tpl.content.cloneNode(true));
}

function render() {
  if (state.route === "home") renderHome();
  if (state.route === "packing") renderPacking();
  if (state.route === "trips") renderTrips();
  if (state.route === "settings") renderSettings();
}

function openTripDialog() {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  document.querySelector("#tripDate").value = today.toISOString().slice(0,10);
  tripDialog.showModal();
  setTimeout(() => document.querySelector("#tripDestination").focus(), 50);
}

async function confirmDelete(title, text) {
  document.querySelector("#confirmTitle").textContent = title;
  document.querySelector("#confirmText").textContent = text;
  confirmDialog.showModal();
  return new Promise(resolve => {
    const handler = () => {
      confirmDialog.removeEventListener("close", handler);
      resolve(confirmDialog.returnValue === "confirm");
    };
    confirmDialog.addEventListener("close", handler);
  });
}

document.addEventListener("click", async event => {
  const target = event.target.closest("[data-route],[data-action]");
  if (!target) return;

  if (target.dataset.route) {
    setRoute(target.dataset.route);
    return;
  }

  const action = target.dataset.action;

  if (action === "new-trip") openTripDialog();
  if (action === "refresh-image") refreshImage();
  if (action === "refresh-weather") refreshWeatherData();

  if (action === "regenerate-packing") {
    if (packingIsReadOnly()) return;
    await syncGeneratedPacking(true);
    renderPacking();
  }

  if (action === "select-trip") {
    await selectTrip(target.dataset.id, false);
    setRoute("home");
  }

  if (action === "toggle-item") {
    if (packingIsReadOnly()) return;
    const item = state.items.find(i => i.id === target.dataset.id);
    if (!item) return;
    item.checked = target.checked;
    await put("packItems", item);
    renderPacking();
  }

  if (action === "check-category") {
    if (packingIsReadOnly()) return;
    const items = state.items.filter(i => i.category === target.dataset.category);
    const allDone = items.every(i => i.checked);
    for (const item of items) {
      item.checked = !allDone;
      await put("packItems", item);
    }
    renderPacking();
  }

  if (action === "check-open-important") {
    const important = state.items.filter(i => itemImportant(i) && !i.checked);
    if (!important.length) toast("Keine wichtigen offenen Punkte.");
    else toast(`${important.length} wichtige ${important.length === 1 ? "Sache ist" : "Sachen sind"} noch offen.`);
  }

  if (action === "delete-item") {
    if (packingIsReadOnly()) return;
    const item = state.items.find(i => i.id === target.dataset.id);
    if (!item) return;
    const ok = await confirmDelete("Eintrag löschen?", `„${itemName(item)}“ wird aus dieser Reise entfernt.`);
    if (!ok) return;
    if (item.source === "generated" || isLegacyGenerated(item)) {
      item.dismissed = true;
      await put("packItems", item);
    } else {
      await del("packItems", item.id);
    }
    state.items = state.items.filter(i => i.id !== item.id);
    renderPacking();
  }

  if (action === "delete-trip") {
    const trip = state.trips.find(t => t.id === target.dataset.id);
    if (!trip) return;
    const ok = await confirmDelete("Reise löschen?", `${trip.destination} inklusive Packliste, Bild und Wetter-Cache wird lokal gelöscht.`);
    if (!ok) return;
    await clearTripData(trip.id);
    state.trips = state.trips.filter(t => t.id !== trip.id);
    if (state.currentTrip?.id === trip.id) {
      await selectTrip(state.trips[0]?.id || null, false);
    }
    renderTrips();
  }
});

document.addEventListener("submit", async event => {
  if (event.target.id === "tripForm") {
    event.preventDefault();
    const data = new FormData(event.target);
    if (!data.get("destination") || !data.get("date")) return;
    await createTrip(data);
  }

  if (event.target.id === "addItemForm") {
    event.preventDefault();
    if (packingIsReadOnly()) return;
    const data = new FormData(event.target);
    const item = {
      id: uid(),
      tripId: state.currentTrip.id,
      name: data.get("name").trim(),
      category: data.get("category"),
      important: data.get("important") === "on",
      checked: false,
      quantity: 1,
      unit: "Stück",
      source: "custom",
      createdAt: new Date().toISOString()
    };
    await put("packItems", item);
    state.items.push(item);
    renderPacking();
  }

  if (event.target.id === "weatherLocationForm") {
    event.preventDefault();
    const data = new FormData(event.target);
    state.currentTrip.weatherLocation = data.get("weatherLocation")?.trim() || "";
    await put("trips", state.currentTrip);
    const idx = state.trips.findIndex(t => t.id === state.currentTrip.id);
    if (idx >= 0) state.trips[idx] = state.currentTrip;
    toast("Wetterort gespeichert");
    if (navigator.onLine) await refreshWeatherData(false);
    else renderHome();
  }
});

document.addEventListener("change", async event => {
  const setting = event.target.dataset.setting;
  if (!setting) return;
  state.settings[setting] = event.target.checked;
  await setSetting(setting, event.target.checked);
  toast("Einstellung gespeichert");
});

document.querySelector("#openTripDialog").addEventListener("click", openTripDialog);

window.addEventListener("online", () => {
  updateNetworkBadge();
  toast("Wieder online");
});
window.addEventListener("offline", () => {
  updateNetworkBadge();
  toast("Offline – lokale Daten bleiben verfügbar");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.error));
}

updateNetworkBadge();
await loadState();
render();