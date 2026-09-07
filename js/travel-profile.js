import { get, getSetting, setSetting } from "./db.js";

const view = document.querySelector("#view");
const tripDialog = document.querySelector("#tripDialog");
const profileDialog = document.querySelector("#activityProfileDialog");
const profileForm = document.querySelector("#activityProfileForm");
const profileItems = document.querySelector("#activityProfileItems");
const PROFILE_KEY = "packProfile";
const ACTIVITY_PROFILES_KEY = "activityProfiles";
const PROFILE_MARKER_PREFIX = "@profile:";
const ACTIVITY_MARKER_PREFIX = "@activities:";

const DEFAULT_ACTIVITY_PROFILES = [
  {
    id: "sport-fitness",
    name: "Sport & Fitness",
    description: "Für Training, Fitnessstudio und aktive Urlaubstage.",
    builtin: true,
    items: [
      { category: "Kleidung", name: "Sportbekleidung", quantity: 1, unit: "Set", important: false },
      { category: "Kleidung", name: "Sportschuhe", quantity: 1, unit: "Paar", important: false },
      { category: "Hygiene", name: "Sporthandtuch", quantity: 1, unit: "Stück", important: false }
    ]
  },
  {
    id: "photo-video",
    name: "Foto & Video",
    description: "Für Action-Cam, Smartphone-Fotografie und Reisevideos.",
    builtin: true,
    items: [
      { category: "Technik", name: "Action-Cam", quantity: 1, unit: "Stück", important: false },
      { category: "Technik", name: "Selfiestick / Mini-Stativ", quantity: 1, unit: "Stück", important: false },
      { category: "Technik", name: "Speicherkarte", quantity: 1, unit: "Stück", important: false },
      { category: "Technik", name: "Ersatzakku / Ladezubehör", quantity: 1, unit: "Set", important: false }
    ]
  },
  {
    id: "hiking",
    name: "Wandern",
    description: "Für Tageswanderungen, Berge und längere Touren.",
    builtin: true,
    items: [
      { category: "Kleidung", name: "Wanderschuhe", quantity: 1, unit: "Paar", important: true },
      { category: "Unterwegs", name: "Wanderrucksack", quantity: 1, unit: "Stück", important: false },
      { category: "Unterwegs", name: "Wanderstöcke", quantity: 1, unit: "Paar", important: false },
      { category: "Gesundheit", name: "Blasenpflaster", quantity: 1, unit: "Packung", important: false }
    ]
  },
  {
    id: "beach-swim",
    name: "Strand & Baden",
    description: "Für Strandtage, Pool und Badeurlaub.",
    builtin: true,
    items: [
      { category: "Kleidung", name: "Badeschuhe", quantity: 1, unit: "Paar", important: false },
      { category: "Unterwegs", name: "Strandtasche", quantity: 1, unit: "Stück", important: false },
      { category: "Unterwegs", name: "Mikrofaserhandtuch", quantity: 1, unit: "Stück", important: false }
    ]
  }
];

let scheduled = false;
let profileCardMounting = false;
let activityCatalog = [];
let editorMode = "new";
const tripSelectedActivityIds = new Set();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function isSettingsView() {
  return view?.querySelector(".section-head h1")?.textContent?.trim() === "Einstellungen";
}

function isHomeView() {
  return Boolean(view?.querySelector(".hero"));
}

function stripSystemMarkers(value = "") {
  return String(value)
    .split(/\r?\n/)
    .filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith(PROFILE_MARKER_PREFIX) && !trimmed.startsWith(ACTIVITY_MARKER_PREFIX);
    })
    .join("\n")
    .trim();
}

function systemMarkers(value = "") {
  return String(value)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith(PROFILE_MARKER_PREFIX) || line.startsWith(ACTIVITY_MARKER_PREFIX));
}

function withTripMarkers(value, profile, activities) {
  const clean = stripSystemMarkers(value);
  const markers = [];
  if (profile && profile !== "neutral") markers.push(`${PROFILE_MARKER_PREFIX}${profile}`);
  if (activities.length) {
    const snapshot = activities.map(profileItem => ({
      id: profileItem.id,
      name: profileItem.name,
      items: profileItem.items
    }));
    markers.push(`${ACTIVITY_MARKER_PREFIX}${encodeURIComponent(JSON.stringify(snapshot))}`);
  }
  return [clean, ...markers].filter(Boolean).join("\n");
}

function normalizeProfile(profile) {
  return {
    id: String(profile?.id || crypto.randomUUID()),
    name: String(profile?.name || "Neues Profil").trim(),
    description: String(profile?.description || "").trim(),
    builtin: Boolean(profile?.builtin),
    items: Array.isArray(profile?.items) ? profile.items.map(item => ({
      category: String(item?.category || "Sonstiges").trim() || "Sonstiges",
      name: String(item?.name || "").trim(),
      quantity: Math.max(1, Number(item?.quantity) || 1),
      unit: String(item?.unit || "Stück").trim() || "Stück",
      important: Boolean(item?.important)
    })).filter(item => item.name) : []
  };
}

async function loadActivityCatalog() {
  const stored = await getSetting(ACTIVITY_PROFILES_KEY, null);
  activityCatalog = Array.isArray(stored) && stored.length
    ? stored.map(normalizeProfile)
    : clone(DEFAULT_ACTIVITY_PROFILES);
  return activityCatalog;
}

async function saveActivityCatalog() {
  await setSetting(ACTIVITY_PROFILES_KEY, activityCatalog.map(normalizeProfile));
}

function profileMatches(profile, query) {
  const needle = query.trim().toLocaleLowerCase("de-DE");
  if (!needle) return true;
  const haystack = [
    profile.name,
    profile.description,
    ...profile.items.flatMap(item => [item.name, item.category])
  ].join(" ").toLocaleLowerCase("de-DE");
  return haystack.includes(needle);
}

function renderTripActivityChoices(query = "") {
  const holder = document.querySelector("#activityProfileChoices");
  if (!holder) return;
  const matches = activityCatalog.filter(profile => profileMatches(profile, query));
  holder.innerHTML = matches.length ? matches.map(profile => `
    <label class="activity-choice">
      <input type="checkbox" value="${escapeHtml(profile.id)}" ${tripSelectedActivityIds.has(profile.id) ? "checked" : ""}>
      <span>
        <strong>${escapeHtml(profile.name)}</strong>
        <small>${escapeHtml(profile.description || `${profile.items.length} Packeinträge`)}</small>
      </span>
    </label>
  `).join("") : `<p class="profile-empty">Kein Profil gefunden.</p>`;
}

function selectedActivities() {
  return activityCatalog.filter(profile => tripSelectedActivityIds.has(profile.id));
}

async function injectTravelerSetting() {
  if (!isSettingsView()) return;
  const grid = view.querySelector(".settings-grid");
  if (!grid) return;

  const existingCards = [...grid.querySelectorAll("[data-pack-profile-card]")];
  existingCards.slice(1).forEach(card => card.remove());
  if (existingCards.length || profileCardMounting) return;

  profileCardMounting = true;
  try {
    const profile = await getSetting(PROFILE_KEY, "neutral");
    if (!isSettingsView() || !grid.isConnected || grid.querySelector("[data-pack-profile-card]")) return;

    const card = document.createElement("section");
    card.className = "setting-row card profile-setting-row";
    card.dataset.packProfileCard = "";
    card.innerHTML = `
      <div>
        <h3>Reisende für neue Reisen</h3>
        <p class="muted">Optional. Paar rechnet personenbezogene Mengen für zwei Reisende; Dame und Paar ergänzen persönliche Hygieneartikel.</p>
      </div>
      <select data-pack-profile aria-label="Reisende für neue Reisen">
        <option value="neutral" ${profile === "neutral" ? "selected" : ""}>Keine Angabe</option>
        <option value="women" ${profile === "women" ? "selected" : ""}>Dame</option>
        <option value="men" ${profile === "men" ? "selected" : ""}>Herr</option>
        <option value="couple" ${profile === "couple" ? "selected" : ""}>Paar</option>
      </select>
    `;

    const installCard = grid.querySelector("[data-app-install-card]");
    if (installCard) installCard.insertAdjacentElement("afterend", card);
    else grid.prepend(card);
  } finally {
    profileCardMounting = false;
  }
}

function profileManagerMarkup(query = "") {
  const matches = activityCatalog.filter(profile => profileMatches(profile, query));
  return matches.length ? matches.map(profile => `
    <article class="profile-manage-row" data-profile-row="${escapeHtml(profile.id)}">
      <div class="profile-manage-copy">
        <div class="profile-title-row">
          <strong>${escapeHtml(profile.name)}</strong>
          ${profile.builtin ? `<span class="profile-badge">Standard</span>` : `<span class="profile-badge custom">Eigenes</span>`}
        </div>
        <small>${escapeHtml(profile.description || `${profile.items.length} Packeinträge`)}</small>
      </div>
      <div class="profile-actions">
        <button type="button" class="button small ghost" data-profile-edit="${escapeHtml(profile.id)}">Bearbeiten</button>
        <button type="button" class="button small ghost" data-profile-copy="${escapeHtml(profile.id)}">Kopieren</button>
        ${profile.builtin
          ? `<button type="button" class="button small ghost" data-profile-reset="${escapeHtml(profile.id)}">Zurücksetzen</button>`
          : `<button type="button" class="button small ghost" data-profile-delete="${escapeHtml(profile.id)}">Löschen</button>`}
      </div>
    </article>
  `).join("") : `<p class="profile-empty">Kein Profil gefunden.</p>`;
}

async function injectActivityManager() {
  if (!isSettingsView()) return;
  const grid = view.querySelector(".settings-grid");
  if (!grid || grid.querySelector("[data-activity-profile-manager]")) return;

  const card = document.createElement("section");
  card.className = "card activity-profile-manager";
  card.dataset.activityProfileManager = "";
  card.innerHTML = `
    <div class="profile-manager-head">
      <div>
        <p class="eyebrow">Packprofile</p>
        <h2>Interessen & Aktivitäten</h2>
        <p class="muted">Standardprofile bearbeiten oder eigene Profile mit individuellen Packeinträgen anlegen.</p>
      </div>
      <button type="button" class="button primary" data-profile-new>Neues Profil</button>
    </div>
    <input type="search" data-profile-manager-search placeholder="Profile oder Packeinträge durchsuchen …" aria-label="Profile durchsuchen" autocomplete="off">
    <div class="profile-manager-list" data-profile-manager-list>${profileManagerMarkup()}</div>
  `;

  const traveler = grid.querySelector("[data-pack-profile-card]");
  if (traveler) traveler.insertAdjacentElement("afterend", card);
  else grid.prepend(card);
}

function addEditorItem(item = {}) {
  if (!profileItems) return;
  const row = document.createElement("div");
  row.className = "profile-editor-item";
  row.innerHTML = `
    <input name="itemName" required placeholder="Gegenstand" value="${escapeHtml(item.name || "")}">
    <input name="itemCategory" placeholder="Kategorie" value="${escapeHtml(item.category || "Sonstiges")}">
    <input name="itemQuantity" type="number" min="1" step="1" value="${Math.max(1, Number(item.quantity) || 1)}" aria-label="Menge">
    <input name="itemUnit" placeholder="Einheit" value="${escapeHtml(item.unit || "Stück")}">
    <label class="profile-important"><input name="itemImportant" type="checkbox" ${item.important ? "checked" : ""}><span>wichtig</span></label>
    <button type="button" class="item-delete" data-profile-item-remove aria-label="Eintrag entfernen">×</button>
  `;
  profileItems.append(row);
}

function openProfileEditor(profile = null, mode = "edit") {
  if (!profileDialog || !profileForm || !profileItems) return;
  editorMode = mode;
  profileForm.reset();
  profileItems.innerHTML = "";
  const source = profile ? clone(profile) : { id: "", name: "", description: "", items: [] };
  profileForm.elements.profileId.value = source.id || "";
  profileForm.elements.profileName.value = mode === "copy" ? `${source.name} Kopie` : source.name || "";
  profileForm.elements.profileDescription.value = source.description || "";
  document.querySelector("#activityProfileEditorTitle").textContent = mode === "new" ? "Neues Profil" : mode === "copy" ? "Profil kopieren" : "Profil bearbeiten";
  (source.items?.length ? source.items : [{}]).forEach(addEditorItem);
  profileDialog.showModal();
  setTimeout(() => profileForm.elements.profileName.focus(), 70);
}

function readEditorItems() {
  return [...profileItems.querySelectorAll(".profile-editor-item")].map(row => ({
    name: row.querySelector("[name='itemName']").value.trim(),
    category: row.querySelector("[name='itemCategory']").value.trim() || "Sonstiges",
    quantity: Math.max(1, Number(row.querySelector("[name='itemQuantity']").value) || 1),
    unit: row.querySelector("[name='itemUnit']").value.trim() || "Stück",
    important: row.querySelector("[name='itemImportant']").checked
  })).filter(item => item.name);
}

function rerenderManagers() {
  const managerSearch = view.querySelector("[data-profile-manager-search]");
  const list = view.querySelector("[data-profile-manager-list]");
  if (list) list.innerHTML = profileManagerMarkup(managerSearch?.value || "");
  const tripSearch = document.querySelector("#activityProfileSearch");
  renderTripActivityChoices(tripSearch?.value || "");
}

async function enhanceRouteWeatherInput() {
  if (!isHomeView()) return;
  const form = view.querySelector("#weatherLocationForm");
  const input = form?.querySelector("input[name='weatherLocation']");
  if (!input) return;

  const currentTripId = await getSetting("currentTripId", null);
  const trip = currentTripId ? await get("trips", currentTripId) : null;
  if (!form.isConnected || !input.isConnected) return;

  form.dataset.systemMarkers = JSON.stringify(systemMarkers(trip?.weatherLocation || input.value));

  const textarea = document.createElement("textarea");
  textarea.name = "weatherLocation";
  textarea.rows = 3;
  textarea.value = stripSystemMarkers(input.value);
  textarea.placeholder = "Wetterorte – ein Ort pro Zeile, z. B. Passau, Wien, Budapest";
  textarea.setAttribute("aria-label", "Wetterorte entlang der Route");
  input.replaceWith(textarea);

  const button = form.querySelector("button");
  if (button) button.textContent = "Wetterorte speichern";
}

async function showWeatherRoute() {
  if (!isHomeView()) return;
  const currentTripId = await getSetting("currentTripId", null);
  if (!currentTripId || !isHomeView()) return;
  const weather = await get("weather", currentTripId);
  const places = weather?.places || [];
  if (places.length < 2 || !isHomeView()) return;

  const weatherCard = view.querySelector("#weatherLocationForm")?.closest(".info-card");
  if (!weatherCard || weatherCard.querySelector("[data-weather-route]")) return;

  const summary = document.createElement("p");
  summary.className = "muted";
  summary.dataset.weatherRoute = "";
  summary.style.marginTop = "8px";
  summary.textContent = `Route: ${places.map(place => place.place).join(" · ")}`;
  weatherCard.querySelector(".progress-row")?.insertAdjacentElement("afterend", summary);
}

async function enhanceCurrentView() {
  await enhanceRouteWeatherInput();
  await injectTravelerSetting();
  await injectActivityManager();
  await showWeatherRoute();
}

const observer = new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(async () => {
    scheduled = false;
    await enhanceCurrentView();
  });
});
observer.observe(view, { childList: true, subtree: true });

document.addEventListener("input", event => {
  if (event.target.id === "activityProfileSearch") renderTripActivityChoices(event.target.value);
  if (event.target.matches("[data-profile-manager-search]")) {
    const list = view.querySelector("[data-profile-manager-list]");
    if (list) list.innerHTML = profileManagerMarkup(event.target.value);
  }
});

document.addEventListener("change", async event => {
  if (event.target.matches("#activityProfileChoices input[type='checkbox']")) {
    if (event.target.checked) tripSelectedActivityIds.add(event.target.value);
    else tripSelectedActivityIds.delete(event.target.value);
  }

  const select = event.target.closest("[data-pack-profile]");
  if (!select) return;
  await setSetting(PROFILE_KEY, select.value);
  const tripProfile = document.querySelector("#tripPackProfile");
  if (tripProfile) tripProfile.value = select.value;
});

document.addEventListener("click", async event => {
  if (event.target.closest("#openTripDialog,[data-action='new-trip']")) {
    tripSelectedActivityIds.clear();
    const tripProfile = document.querySelector("#tripPackProfile");
    if (tripProfile) tripProfile.value = await getSetting(PROFILE_KEY, "neutral");
    const search = document.querySelector("#activityProfileSearch");
    if (search) search.value = "";
    renderTripActivityChoices();
  }

  if (event.target.closest("[data-profile-new]")) openProfileEditor(null, "new");

  const edit = event.target.closest("[data-profile-edit]");
  if (edit) openProfileEditor(activityCatalog.find(profile => profile.id === edit.dataset.profileEdit), "edit");

  const copyButton = event.target.closest("[data-profile-copy]");
  if (copyButton) openProfileEditor(activityCatalog.find(profile => profile.id === copyButton.dataset.profileCopy), "copy");

  const reset = event.target.closest("[data-profile-reset]");
  if (reset) {
    const original = DEFAULT_ACTIVITY_PROFILES.find(profile => profile.id === reset.dataset.profileReset);
    const index = activityCatalog.findIndex(profile => profile.id === reset.dataset.profileReset);
    if (original && index >= 0) {
      activityCatalog[index] = clone(original);
      await saveActivityCatalog();
      rerenderManagers();
    }
  }

  const remove = event.target.closest("[data-profile-delete]");
  if (remove) {
    activityCatalog = activityCatalog.filter(profile => profile.id !== remove.dataset.profileDelete);
    tripSelectedActivityIds.delete(remove.dataset.profileDelete);
    await saveActivityCatalog();
    rerenderManagers();
  }

  if (event.target.closest("[data-profile-item-add]")) addEditorItem();
  const removeItem = event.target.closest("[data-profile-item-remove]");
  if (removeItem) removeItem.closest(".profile-editor-item")?.remove();

  if (event.target.closest("[data-profile-editor-close]")) profileDialog?.close("cancel");
}, true);

document.addEventListener("submit", event => {
  if (event.target.id === "tripForm") {
    const profile = event.target.elements.packProfile?.value || "neutral";
    const weatherField = event.target.elements.weatherLocation;
    if (weatherField) weatherField.value = withTripMarkers(weatherField.value, profile, selectedActivities());
    return;
  }

  if (event.target.id === "weatherLocationForm") {
    const weatherField = event.target.elements.weatherLocation;
    if (weatherField) {
      let markers = [];
      try { markers = JSON.parse(event.target.dataset.systemMarkers || "[]"); } catch (_) {}
      weatherField.value = [stripSystemMarkers(weatherField.value), ...markers].filter(Boolean).join("\n");
    }
  }
}, true);

profileForm?.addEventListener("submit", async event => {
  event.preventDefault();
  const items = readEditorItems();
  if (!items.length) return;

  const id = profileForm.elements.profileId.value;
  const existing = activityCatalog.find(profile => profile.id === id);
  const profile = normalizeProfile({
    id: editorMode === "edit" && existing ? existing.id : crypto.randomUUID(),
    name: profileForm.elements.profileName.value,
    description: profileForm.elements.profileDescription.value,
    builtin: editorMode === "edit" ? Boolean(existing?.builtin) : false,
    items
  });

  if (editorMode === "edit" && existing) {
    activityCatalog = activityCatalog.map(row => row.id === existing.id ? profile : row);
  } else {
    activityCatalog.push(profile);
  }

  await saveActivityCatalog();
  rerenderManagers();
  profileDialog?.close("saved");
});

await loadActivityCatalog();
renderTripActivityChoices();
await enhanceCurrentView();
