"use strict";

const STORAGE_KEY = "kofferly-v1";
const LEGACY_STORAGE_KEY = "suedtirol-packliste-v1";
const WEATHER_STALE_MS = 24 * 60 * 60 * 1000;

const categories = [
  {
    id: "clothing",
    icon: "👕",
    title: "Kleidung",
    items: [
      ["7× Unterwäsche", true],
      ["7× Socken", true],
      ["5–6 T-Shirts / Shirts", false],
      ["2× lange Hose", false],
      ["1–2× kurze Hose", false],
      ["1× Pullover oder Hoodie", true],
      ["1× dünne Jacke", false],
      ["1× Regenjacke", true],
      ["Schlafsachen", false],
      ["Gürtel", false],
      ["Badehose", false]
    ]
  },
  {
    id: "shoes",
    icon: "👟",
    title: "Schuhe & unterwegs",
    items: [
      ["Bequeme Sneaker", true],
      ["Feste Schuhe für Spaziergänge / Wanderungen", true],
      ["Kleiner Tagesrucksack", true],
      ["Sonnenbrille", false],
      ["Cap / Mütze", false],
      ["Kleiner Regenschirm", false]
    ]
  },
  {
    id: "care",
    icon: "🧴",
    title: "Bad & Pflege",
    items: [
      ["Zahnbürste", true],
      ["Zahnpasta", true],
      ["Duschgel / Shampoo", false],
      ["Deo", true],
      ["Rasierer", false],
      ["Kamm / Bürste", false],
      ["Sonnencreme", true],
      ["Persönliche Medikamente", true],
      ["Taschentücher", false]
    ]
  },
  {
    id: "tech",
    icon: "📱",
    title: "Technik",
    items: [
      ["Handy", true],
      ["Handy-Ladekabel", true],
      ["USB-Netzteil", true],
      ["Powerbank", false],
      ["Smartwatch + Ladekabel", false],
      ["Kopfhörer", false],
      ["12-V-/USB-C-Autolader", false]
    ]
  },
  {
    id: "car",
    icon: "🚗",
    title: "Auto & E-Auto",
    items: [
      ["Führerschein", true],
      ["Fahrzeugschein / Zulassungsbescheinigung", true],
      ["DKV-Karte", false],
      ["Ladekabel / Typ-2-Kabel", true],
      ["Lade-Apps prüfen / Zugangsdaten griffbereit", true],
      ["Vignette / Maut für die Route prüfen", true],
      ["Warnweste(n)", true],
      ["Warndreieck", true],
      ["Verbandskasten", true],
      ["Reifendruck prüfen", false],
      ["Scheibenwaschwasser prüfen", false]
    ]
  },
  {
    id: "documents",
    icon: "🪪",
    title: "Dokumente & Geld",
    items: [
      ["Personalausweis / Reisepass", true],
      ["EC-/Debitkarte", true],
      ["Etwas Bargeld", false],
      ["Unterkunft / Buchungsbestätigung", true],
      ["Krankenversicherungskarte", true],
      ["Wichtige Telefonnummern / Adresse der Unterkunft", false]
    ]
  },
  {
    id: "drive",
    icon: "🍎",
    title: "Für die Fahrt",
    items: [
      ["Wasser", true],
      ["Snacks", false],
      ["Müllbeutel fürs Auto", false],
      ["Kaugummi / Bonbons", false],
      ["Küchenrolle / Feuchttücher", false]
    ]
  },
  {
    id: "departure",
    icon: "✅",
    title: "Vor der Abfahrt",
    items: [
      ["Handy voll laden", true],
      ["Powerbank laden", false],
      ["Route und Verkehr prüfen", true],
      ["Ladestopps grob festlegen", true],
      ["Wetter in Dorf Tirol noch einmal prüfen", true],
      ["Fenster schließen", true],
      ["Müll rausbringen", false],
      ["Kühlschrank prüfen", false],
      ["Licht / Geräte ausschalten", true],
      ["Wohnungsschlüssel einpacken", true]
    ]
  }
];

const DEFAULT_TRIP = {
  name: "Südtirol",
  location: "Dorf Tirol, Italien",
  start: "2026-09-09",
  end: "2026-09-16",
  coordinates: { latitude: 46.6888, longitude: 11.1563, label: "Dorf Tirol, Italien" }
};

const dom = {
  main: document.getElementById("appMain"),
  views: [...document.querySelectorAll(".view")],
  navButtons: [...document.querySelectorAll("[data-nav]")],
  bottomNavButtons: [...document.querySelectorAll(".bottom-nav [data-nav]")],
  tripTitle: document.getElementById("tripTitle"),
  tripDates: document.getElementById("tripDates"),
  tripLocation: document.getElementById("tripLocation"),
  overviewDone: document.getElementById("overviewDone"),
  overviewTotal: document.getElementById("overviewTotal"),
  overviewPercent: document.getElementById("overviewPercent"),
  overviewProgress: document.getElementById("overviewProgress"),
  progressHint: document.getElementById("progressHint"),
  categoryTabs: document.getElementById("categoryTabs"),
  packingItems: document.getElementById("packingItems"),
  packingCount: document.getElementById("packingCount"),
  categoryIcon: document.getElementById("categoryIcon"),
  categoryTitle: document.getElementById("categoryTitle"),
  categoryProgressText: document.getElementById("categoryProgressText"),
  categoryPercent: document.getElementById("categoryPercent"),
  categoryProgress: document.getElementById("categoryProgress"),
  doneFilterTabs: document.getElementById("doneFilterTabs"),
  doneItems: document.getElementById("doneItems"),
  doneCountBadge: document.getElementById("doneCountBadge"),
  weatherPreview: document.getElementById("weatherPreview"),
  weatherFreshness: document.getElementById("weatherFreshness"),
  weatherList: document.getElementById("weatherList"),
  weatherLocationTitle: document.getElementById("weatherLocationTitle"),
  weatherDateRange: document.getElementById("weatherDateRange"),
  weatherUpdatedDetail: document.getElementById("weatherUpdatedDetail"),
  weatherOfflineBadge: document.getElementById("weatherOfflineBadge"),
  weatherInfoNote: document.getElementById("weatherInfoNote"),
  tripForm: document.getElementById("tripForm"),
  tripNameInput: document.getElementById("tripNameInput"),
  tripLocationInput: document.getElementById("tripLocationInput"),
  tripStartInput: document.getElementById("tripStartInput"),
  tripEndInput: document.getElementById("tripEndInput"),
  addItemDialog: document.getElementById("addItemDialog"),
  addItemForm: document.getElementById("addItemForm"),
  newItemText: document.getElementById("newItemText"),
  newItemCategory: document.getElementById("newItemCategory"),
  newItemImportant: document.getElementById("newItemImportant"),
  resetDialog: document.getElementById("resetDialog"),
  installBtn: document.getElementById("installBtn"),
  installState: document.getElementById("installState"),
  toast: document.getElementById("toast")
};

let state = loadState();
let currentView = "overview";
let weatherReturnView = "overview";
let selectedCategoryId = state.ui?.selectedCategoryId || categories[0].id;
let doneFilterId = "all";
let deferredInstallPrompt = null;
let toastTimer = null;

/**
 * Creates the initial persisted application state and imports old checkmarks once.
 * @returns {object} application state
 */
function loadState() {
  const fallback = {
    checked: {},
    customItems: [],
    trip: structuredCloneSafe(DEFAULT_TRIP),
    weather: null,
    ui: { selectedCategoryId: categories[0].id },
    migratedLegacy: false
  };

  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (parsed && typeof parsed === "object") {
      return {
        ...fallback,
        ...parsed,
        checked: parsed.checked || {},
        customItems: Array.isArray(parsed.customItems) ? parsed.customItems : [],
        trip: { ...fallback.trip, ...(parsed.trip || {}) },
        ui: { ...fallback.ui, ...(parsed.ui || {}) }
      };
    }
  } catch (error) {
    console.warn("Kofferly state could not be loaded", error);
  }

  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "null");
    if (legacy && typeof legacy === "object") {
      Object.entries(legacy).forEach(([key, value]) => {
        const match = /^c(\d+)-i(\d+)$/.exec(key);
        if (!match || !value) return;
        const categoryIndex = Number(match[1]);
        const itemIndex = Number(match[2]);
        if (categories[categoryIndex]?.items[itemIndex]) {
          fallback.checked[standardItemId(categories[categoryIndex].id, itemIndex)] = true;
        }
      });
      fallback.migratedLegacy = true;
    }
  } catch (error) {
    console.warn("Legacy checklist could not be migrated", error);
  }

  return fallback;
}

/** Safely clones plain state data in browsers without structuredClone. */
function structuredCloneSafe(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

/** Persists the complete local application state. */
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Kofferly state could not be saved", error);
  }
}

/** Returns a stable ID for a built-in checklist item. */
function standardItemId(categoryId, itemIndex) {
  return `std:${categoryId}:${itemIndex}`;
}

/** Returns all built-in and custom items as normalized objects. */
function getAllItems() {
  const standardItems = categories.flatMap(category =>
    category.items.map(([text, important], itemIndex) => ({
      id: standardItemId(category.id, itemIndex),
      categoryId: category.id,
      text,
      important,
      custom: false
    }))
  );
  return [...standardItems, ...state.customItems];
}

/** Returns normalized items for one category. */
function getItemsForCategory(categoryId) {
  return getAllItems().filter(item => item.categoryId === categoryId);
}

/** Returns how many items are done and how many exist. */
function getProgress(items = getAllItems()) {
  const done = items.filter(item => Boolean(state.checked[item.id])).length;
  const total = items.length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

/** Formats an ISO date in German short notation. */
function formatDate(isoDate, withYear = true) {
  if (!isoDate) return "–";
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("de-DE", withYear
    ? { day: "2-digit", month: "2-digit", year: "numeric" }
    : { day: "2-digit", month: "2-digit" }
  ).format(date);
}

/** Formats the current trip date range. */
function formatDateRange(start, end) {
  if (!start || !end) return "Zeitraum nicht festgelegt";
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${formatDate(start, false)} – ${formatDate(end, false)}.${endDate.getFullYear()}`;
  }
  return `${formatDate(start)} – ${formatDate(end)}`;
}

/** Formats a timestamp as a readable local update time. */
function formatUpdatedAt(timestamp) {
  if (!timestamp) return "Noch nicht aktualisiert";
  const date = new Date(timestamp);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  const time = new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit" }).format(date);
  if (sameDay) return `Heute, ${time}`;
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

/** Returns current weather cache freshness metadata. */
function getWeatherFreshness() {
  if (!state.weather?.updatedAt) return { label: "Noch nicht geladen", className: "neutral", stale: true };
  const age = Date.now() - new Date(state.weather.updatedAt).getTime();
  if (age > WEATHER_STALE_MS) return { label: `Alt · ${formatUpdatedAt(state.weather.updatedAt)}`, className: "stale", stale: true };
  return { label: `Aktuell · ${formatUpdatedAt(state.weather.updatedAt)}`, className: "fresh", stale: false };
}

/** Displays a transient message above the bottom navigation. */
function showToast(message) {
  clearTimeout(toastTimer);
  dom.toast.textContent = message;
  dom.toast.classList.add("show");
  toastTimer = setTimeout(() => dom.toast.classList.remove("show"), 3100);
}

/** Navigates to one app view without reloading the page. */
function showView(viewName) {
  currentView = viewName;
  dom.views.forEach(view => view.classList.toggle("active", view.dataset.view === viewName));
  dom.bottomNavButtons.forEach(button => button.classList.toggle("active", button.dataset.nav === viewName));
  if (viewName === "packing") renderPacking();
  if (viewName === "done") renderDone();
  if (viewName === "more") renderSettings();
  if (viewName === "weather") renderWeather();
  window.scrollTo({ top: 0, behavior: "smooth" });
  dom.main.focus({ preventScroll: true });
}

/** Opens the weather detail screen and remembers where to return. */
function openWeather() {
  weatherReturnView = currentView === "weather" ? weatherReturnView : currentView;
  showView("weather");
}

/** Renders trip information and overall packing progress. */
function renderOverview() {
  dom.tripTitle.textContent = state.trip.name || "Meine Reise";
  dom.tripDates.textContent = formatDateRange(state.trip.start, state.trip.end);
  dom.tripLocation.textContent = state.trip.location || "Reiseziel";
  const progress = getProgress();
  dom.overviewDone.textContent = progress.done;
  dom.overviewTotal.textContent = progress.total;
  dom.overviewPercent.textContent = `${progress.percent} %`;
  dom.overviewProgress.style.width = `${progress.percent}%`;
  dom.progressHint.textContent = progress.percent === 100
    ? "Alles gepackt. Kofferly gibt grünes Licht. 🚀"
    : progress.percent >= 75
      ? "Fast geschafft – der Koffer sieht schon ziemlich reisefertig aus."
      : "Noch ein paar Dinge, dann kann es losgehen.";
  renderWeatherPreview();
}

/** Renders category tabs and the selected packing list category. */
function renderPacking() {
  const allProgress = getProgress();
  dom.packingCount.textContent = `${allProgress.done}/${allProgress.total}`;
  dom.categoryTabs.innerHTML = "";

  categories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip${category.id === selectedCategoryId ? " active" : ""}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(category.id === selectedCategoryId));
    button.textContent = `${category.icon} ${category.title}`;
    button.addEventListener("click", () => {
      selectedCategoryId = category.id;
      state.ui.selectedCategoryId = category.id;
      saveState();
      renderPacking();
    });
    dom.categoryTabs.append(button);
  });

  const category = categories.find(entry => entry.id === selectedCategoryId) || categories[0];
  const items = getItemsForCategory(category.id);
  const progress = getProgress(items);
  dom.categoryIcon.textContent = category.icon;
  dom.categoryTitle.textContent = category.title;
  dom.categoryProgressText.textContent = `${progress.done} von ${progress.total} erledigt`;
  dom.categoryPercent.textContent = `${progress.percent}%`;
  dom.categoryProgress.style.width = `${progress.percent}%`;
  dom.packingItems.innerHTML = "";

  items.forEach(item => dom.packingItems.append(createItemRow(item, { showCategory: false })));
}

/** Creates one reusable checklist row. */
function createItemRow(item, { showCategory = false } = {}) {
  const row = document.createElement("div");
  const checked = Boolean(state.checked[item.id]);
  row.className = `pack-item${checked ? " done" : ""}`;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "pack-check";
  checkbox.checked = checked;
  checkbox.id = `check-${cssSafeId(item.id)}`;
  checkbox.addEventListener("change", () => {
    state.checked[item.id] = checkbox.checked;
    saveState();
    renderOverview();
    if (currentView === "packing") renderPacking();
    if (currentView === "done") renderDone();
  });

  const copy = document.createElement("div");
  copy.className = "item-copy";
  const label = document.createElement("label");
  label.htmlFor = checkbox.id;
  label.textContent = item.text;
  copy.append(label);

  const meta = document.createElement("div");
  meta.className = "item-meta";
  if (showCategory) {
    const category = categories.find(entry => entry.id === item.categoryId);
    const span = document.createElement("span");
    span.textContent = category ? `${category.icon} ${category.title}` : "Packliste";
    meta.append(span);
  }
  if (item.important) {
    const badge = document.createElement("span");
    badge.className = "important-badge";
    badge.textContent = "wichtig";
    meta.append(badge);
  }
  if (item.custom) {
    const badge = document.createElement("span");
    badge.className = "custom-badge";
    badge.textContent = "eigener Eintrag";
    meta.append(badge);
  }
  if (meta.childNodes.length) copy.append(meta);

  row.append(checkbox, copy);
  if (item.custom) {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-item";
    remove.setAttribute("aria-label", `${item.text} löschen`);
    remove.textContent = "×";
    remove.addEventListener("click", () => removeCustomItem(item.id));
    row.append(remove);
  }
  return row;
}

/** Converts IDs to a string suitable for use in HTML element IDs. */
function cssSafeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "-");
}

/** Renders completed items and its category filter. */
function renderDone() {
  const allItems = getAllItems();
  const completed = allItems.filter(item => Boolean(state.checked[item.id]));
  dom.doneCountBadge.textContent = completed.length;
  dom.doneFilterTabs.innerHTML = "";

  const filters = [{ id: "all", icon: "✓", title: `Alle (${completed.length})` }, ...categories.map(category => {
    const count = completed.filter(item => item.categoryId === category.id).length;
    return { id: category.id, icon: category.icon, title: `${category.title} (${count})` };
  })];

  filters.forEach(filter => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `chip${doneFilterId === filter.id ? " active" : ""}`;
    button.textContent = `${filter.icon} ${filter.title}`;
    button.addEventListener("click", () => {
      doneFilterId = filter.id;
      renderDone();
    });
    dom.doneFilterTabs.append(button);
  });

  const visible = doneFilterId === "all" ? completed : completed.filter(item => item.categoryId === doneFilterId);
  dom.doneItems.innerHTML = "";
  if (!visible.length) {
    dom.doneItems.innerHTML = '<div class="done-empty"><span>🧳</span><p>Hier ist noch nichts. Sobald du etwas abhakst, landet es automatisch in dieser Ansicht.</p></div>';
    return;
  }
  visible.forEach(item => dom.doneItems.append(createItemRow(item, { showCategory: true })));
}

/** Fills the trip settings form with saved values. */
function renderSettings() {
  dom.tripNameInput.value = state.trip.name || "";
  dom.tripLocationInput.value = state.trip.location || "";
  dom.tripStartInput.value = state.trip.start || "";
  dom.tripEndInput.value = state.trip.end || "";
}

/** Maps WMO weather codes to German labels and symbols. */
function describeWeather(code) {
  const weatherCode = Number(code);
  if (weatherCode === 0) return { icon: "☀️", label: "Sonnig" };
  if ([1, 2].includes(weatherCode)) return { icon: "🌤️", label: "Leicht bewölkt" };
  if (weatherCode === 3) return { icon: "☁️", label: "Bewölkt" };
  if ([45, 48].includes(weatherCode)) return { icon: "🌫️", label: "Nebel" };
  if ([51, 53, 55, 56, 57].includes(weatherCode)) return { icon: "🌦️", label: "Nieselregen" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return { icon: "🌧️", label: "Regenschauer" };
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return { icon: "🌨️", label: "Schnee" };
  if ([95, 96, 99].includes(weatherCode)) return { icon: "⛈️", label: "Gewitter" };
  return { icon: "🌦️", label: "Wechselhaft" };
}

/** Returns forecast entries that belong to the selected trip range. */
function getTripForecast() {
  const days = state.weather?.days || [];
  if (!state.trip.start || !state.trip.end) return days;
  return days.filter(day => day.date >= state.trip.start && day.date <= state.trip.end);
}

/** Renders the compact weather strip on the dashboard. */
function renderWeatherPreview() {
  const freshness = getWeatherFreshness();
  dom.weatherFreshness.className = `status-pill ${freshness.className}`;
  dom.weatherFreshness.textContent = freshness.label;
  const days = getTripForecast();
  dom.weatherPreview.innerHTML = "";

  if (!state.weather?.days?.length) {
    dom.weatherPreview.innerHTML = '<div class="empty-state compact"><span class="empty-icon">☁️</span><p>Einmal online aktualisieren – danach bleibt die Vorhersage offline sichtbar.</p></div>';
    return;
  }

  const previewDays = (days.length ? days : state.weather.days).slice(0, 5);
  previewDays.forEach(day => {
    const info = describeWeather(day.code);
    const date = new Date(`${day.date}T12:00:00`);
    const card = document.createElement("div");
    card.className = "day-mini";
    card.innerHTML = `
      <strong>${new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(date)}</strong>
      <small>${formatDate(day.date, false)}</small>
      <span class="weather-icon" aria-label="${info.label}">${info.icon}</span>
      <div class="temp-mini">${Math.round(day.max)}° <em>${Math.round(day.min)}°</em></div>`;
    dom.weatherPreview.append(card);
  });
}

/** Renders the full cached forecast including offline age information. */
function renderWeather() {
  dom.weatherLocationTitle.textContent = state.weather?.locationLabel || state.trip.location || "Reiseziel";
  dom.weatherDateRange.textContent = formatDateRange(state.trip.start, state.trip.end);
  dom.weatherUpdatedDetail.textContent = state.weather?.updatedAt
    ? `Zuletzt aktualisiert: ${formatUpdatedAt(state.weather.updatedAt)}`
    : "Noch nicht aktualisiert";

  const freshness = getWeatherFreshness();
  dom.weatherOfflineBadge.className = `status-pill ${freshness.className}`;
  dom.weatherOfflineBadge.textContent = state.weather ? (freshness.stale ? "Offline · Daten älter" : "Offline gespeichert") : "Nicht geladen";
  dom.weatherList.innerHTML = "";

  if (!state.weather?.days?.length) {
    dom.weatherList.innerHTML = '<div class="done-empty"><span>🌦️</span><p>Noch keine Wetterdaten gespeichert. Tippe oben auf ↻, solange du Internet hast.</p></div>';
    return;
  }

  const tripDays = getTripForecast();
  const visibleDays = tripDays.length ? tripDays : state.weather.days;
  visibleDays.forEach(day => {
    const info = describeWeather(day.code);
    const date = new Date(`${day.date}T12:00:00`);
    const row = document.createElement("div");
    row.className = "forecast-row";
    const rain = Number.isFinite(day.rainChance) ? `${Math.round(day.rainChance)} % Regen` : "Regen n. v.";
    const wind = Number.isFinite(day.wind) ? `${Math.round(day.wind)} km/h Wind` : "Wind n. v.";
    row.innerHTML = `
      <div class="forecast-day"><strong>${new Intl.DateTimeFormat("de-DE", { weekday: "short" }).format(date)}</strong><small>${formatDate(day.date, false)}</small></div>
      <div class="forecast-symbol" aria-label="${info.label}">${info.icon}</div>
      <div class="forecast-main"><strong>${info.label}</strong><small>${rain} · ${wind}</small></div>
      <div class="forecast-temp">${Math.round(day.max)}° <span>/ ${Math.round(day.min)}°</span></div>`;
    dom.weatherList.append(row);
  });

  const rangeCovered = tripDays.length > 0;
  dom.weatherInfoNote.textContent = rangeCovered
    ? "Die angezeigten Wetterdaten sind lokal gespeichert und bleiben offline verfügbar. Für eine aktuelle Prognose vor der Abfahrt noch einmal online aktualisieren."
    : "Der gewählte Reisezeitraum liegt außerhalb der aktuell verfügbaren Vorhersage. Deshalb zeigt Kofferly die gespeicherten verfügbaren Tage. Später erneut aktualisieren.";
}

/** Resolves a free-text place name to coordinates using Open-Meteo geocoding. */
async function geocodeLocation(location) {
  const normalized = location.trim().toLocaleLowerCase("de-DE");
  const savedCoordinates = state.trip.coordinates;
  if (savedCoordinates?.query?.toLocaleLowerCase("de-DE") === normalized) return savedCoordinates;
  if (normalized === DEFAULT_TRIP.location.toLocaleLowerCase("de-DE")) {
    return { ...DEFAULT_TRIP.coordinates, query: location };
  }

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", location);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "de");
  url.searchParams.set("format", "json");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Ortssuche fehlgeschlagen");
  const data = await response.json();
  const result = data.results?.[0];
  if (!result) throw new Error("Ort nicht gefunden");
  const labelParts = [result.name, result.admin1, result.country].filter(Boolean);
  return {
    latitude: result.latitude,
    longitude: result.longitude,
    label: [...new Set(labelParts)].join(", "),
    query: location
  };
}

/** Downloads a 16-day forecast and keeps a compact copy in localStorage for offline use. */
async function refreshWeather({ silent = false } = {}) {
  const buttons = [document.getElementById("refreshWeatherBtn"), document.getElementById("weatherRefreshTopBtn")].filter(Boolean);
  buttons.forEach(button => { button.disabled = true; button.setAttribute("aria-busy", "true"); });
  if (!silent) showToast("Wetter wird aktualisiert …");

  try {
    if (!navigator.onLine) throw new Error("offline");
    const coordinates = await geocodeLocation(state.trip.location);
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(coordinates.latitude));
    url.searchParams.set("longitude", String(coordinates.longitude));
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max");
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "16");

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Vorhersage konnte nicht geladen werden");
    const data = await response.json();
    const daily = data.daily;
    if (!daily?.time?.length) throw new Error("Keine Vorhersagedaten erhalten");

    const days = daily.time.map((date, index) => ({
      date,
      code: daily.weather_code?.[index],
      max: daily.temperature_2m_max?.[index],
      min: daily.temperature_2m_min?.[index],
      rainChance: daily.precipitation_probability_max?.[index],
      wind: daily.wind_speed_10m_max?.[index]
    }));

    state.trip.coordinates = coordinates;
    state.weather = {
      updatedAt: new Date().toISOString(),
      locationLabel: coordinates.label || state.trip.location,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      timezone: data.timezone || "auto",
      days
    };
    saveState();
    renderOverview();
    if (currentView === "weather") renderWeather();
    if (!silent) showToast("Wetter gespeichert – jetzt auch offline verfügbar.");
    return true;
  } catch (error) {
    console.warn("Weather refresh failed", error);
    if (!silent) {
      showToast(error.message === "offline"
        ? "Du bist offline. Die zuletzt gespeicherte Vorhersage bleibt verfügbar."
        : `Wetter konnte nicht aktualisiert werden: ${error.message}`);
    }
    return false;
  } finally {
    buttons.forEach(button => { button.disabled = false; button.removeAttribute("aria-busy"); });
  }
}

/** Opens the custom-item dialog with the current category preselected. */
function openAddItemDialog() {
  dom.newItemCategory.innerHTML = categories.map(category => `<option value="${category.id}">${category.icon} ${category.title}</option>`).join("");
  dom.newItemCategory.value = selectedCategoryId;
  dom.newItemText.value = "";
  dom.newItemImportant.checked = false;
  dom.addItemDialog.showModal();
  setTimeout(() => dom.newItemText.focus(), 0);
}

/** Adds a user-defined checklist entry to the selected category. */
function addCustomItem() {
  const text = dom.newItemText.value.trim();
  if (!text) return;
  const categoryId = dom.newItemCategory.value;
  state.customItems.push({
    id: `custom:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
    categoryId,
    text,
    important: dom.newItemImportant.checked,
    custom: true
  });
  selectedCategoryId = categoryId;
  state.ui.selectedCategoryId = categoryId;
  saveState();
  dom.addItemDialog.close();
  renderPacking();
  renderOverview();
  showToast("Eintrag hinzugefügt.");
}

/** Removes one custom item and its checkmark. */
function removeCustomItem(itemId) {
  const item = state.customItems.find(entry => entry.id === itemId);
  state.customItems = state.customItems.filter(entry => entry.id !== itemId);
  delete state.checked[itemId];
  saveState();
  renderPacking();
  renderOverview();
  if (currentView === "done") renderDone();
  if (item) showToast(`„${item.text}“ entfernt.`);
}

/** Saves the trip form and immediately tries to refresh weather for the new destination. */
async function saveTripForm(event) {
  event.preventDefault();
  const start = dom.tripStartInput.value;
  const end = dom.tripEndInput.value;
  if (start && end && start > end) {
    showToast("Das Rückreisedatum muss nach dem Startdatum liegen.");
    return;
  }

  const oldLocation = state.trip.location;
  state.trip.name = dom.tripNameInput.value.trim() || "Meine Reise";
  state.trip.location = dom.tripLocationInput.value.trim();
  state.trip.start = start;
  state.trip.end = end;
  if (oldLocation !== state.trip.location) state.trip.coordinates = null;
  saveState();
  renderOverview();
  await refreshWeather();
}

/** Resets completion state and custom items while keeping trip settings and weather. */
function resetChecklist() {
  state.checked = {};
  state.customItems = [];
  saveState();
  dom.resetDialog.close();
  renderOverview();
  renderPacking();
  renderDone();
  showToast("Packliste wurde zurückgesetzt.");
}

/** Registers the service worker when Kofferly is served from a supported origin. */
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!/^https?:$/.test(location.protocol)) {
    dom.installState.textContent = "Direkt als Datei nutzbar; für die Installation als PWA muss Kofferly über HTTPS bereitgestellt werden.";
    return;
  }
  navigator.serviceWorker.register("./sw.js").catch(error => console.warn("Service worker registration failed", error));
}

/** Wires all static user-interface events. */
function bindEvents() {
  dom.navButtons.forEach(button => {
    button.addEventListener("click", () => showView(button.dataset.nav));
  });
  document.querySelectorAll('[data-action="weather"]').forEach(button => button.addEventListener("click", openWeather));
  document.getElementById("weatherDetailsBtn").addEventListener("click", openWeather);
  document.getElementById("refreshWeatherBtn").addEventListener("click", () => refreshWeather());
  document.getElementById("weatherRefreshTopBtn").addEventListener("click", () => refreshWeather());
  document.getElementById("weatherBackBtn").addEventListener("click", () => showView(weatherReturnView));
  document.getElementById("settingsQuickBtn").addEventListener("click", () => showView("more"));
  document.getElementById("addItemFab").addEventListener("click", openAddItemDialog);
  document.getElementById("closeAddItem").addEventListener("click", () => dom.addItemDialog.close());
  document.getElementById("cancelAddItem").addEventListener("click", () => dom.addItemDialog.close());
  dom.addItemForm.addEventListener("submit", event => { event.preventDefault(); addCustomItem(); });
  dom.tripForm.addEventListener("submit", saveTripForm);
  document.getElementById("resetBtn").addEventListener("click", () => dom.resetDialog.showModal());
  document.getElementById("cancelReset").addEventListener("click", () => dom.resetDialog.close());
  document.getElementById("confirmReset").addEventListener("click", resetChecklist);
  dom.installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    dom.installBtn.classList.add("hidden");
  });

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    dom.installBtn.classList.remove("hidden");
    dom.installState.textContent = "Kofferly ist bereit für deinen Homescreen.";
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    dom.installBtn.classList.add("hidden");
    dom.installState.textContent = "Kofferly ist als App installiert.";
  });
  window.addEventListener("online", () => showToast("Wieder online – Wetter kann aktualisiert werden."));
  window.addEventListener("offline", () => showToast("Offline – Kofferly und gespeicherte Wetterdaten funktionieren weiter."));
}

/** Initializes the application from local state. */
function init() {
  bindEvents();
  registerServiceWorker();
  renderOverview();
  renderPacking();
  renderDone();
  renderSettings();
  saveState();
}

init();
