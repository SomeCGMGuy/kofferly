import { get, getSetting, setSetting } from "./db.js";

const view = document.querySelector("#view");
const PROFILE_KEY = "packProfile";
const PROFILE_MARKER_PREFIX = "@profile:";

let scheduled = false;

function isSettingsView() {
  return view?.querySelector(".section-head h1")?.textContent?.trim() === "Einstellungen";
}

function isHomeView() {
  return Boolean(view?.querySelector(".hero"));
}

function stripProfileMarkers(value = "") {
  return String(value)
    .split(/\r?\n/)
    .filter(line => !line.trim().startsWith(PROFILE_MARKER_PREFIX))
    .join("\n")
    .trim();
}

function withProfileMarker(value, profile) {
  const clean = stripProfileMarkers(value);
  if (!profile || profile === "neutral") return clean;
  return [clean, `${PROFILE_MARKER_PREFIX}${profile}`].filter(Boolean).join("\n");
}

async function injectProfileSetting() {
  if (!isSettingsView()) return;
  const grid = view.querySelector(".settings-grid");
  if (!grid || grid.querySelector("[data-pack-profile-card]")) return;

  const profile = await getSetting(PROFILE_KEY, "neutral");
  if (!isSettingsView() || !grid.isConnected) return;

  const card = document.createElement("section");
  card.className = "setting-row card";
  card.dataset.packProfileCard = "";
  card.innerHTML = `
    <div>
      <h3>Packprofil für neue Reisen</h3>
      <p class="muted">Optional. Beim Damen-Profil ergänzt Kofferly persönliche Hygieneartikel automatisch. Das Profil wird nur für neu angelegte Reisen übernommen.</p>
    </div>
    <select data-pack-profile aria-label="Packprofil für neue Reisen">
      <option value="neutral" ${profile === "neutral" ? "selected" : ""}>Keine Angabe</option>
      <option value="women" ${profile === "women" ? "selected" : ""}>Damen</option>
      <option value="men" ${profile === "men" ? "selected" : ""}>Herren</option>
    </select>
  `;

  const installCard = grid.querySelector("[data-app-install-card]");
  if (installCard) installCard.insertAdjacentElement("afterend", card);
  else grid.prepend(card);
}

function enhanceRouteWeatherInput() {
  if (!isHomeView()) return;
  const form = view.querySelector("#weatherLocationForm");
  const input = form?.querySelector("input[name='weatherLocation']");
  if (!input) return;

  const textarea = document.createElement("textarea");
  textarea.name = "weatherLocation";
  textarea.rows = 3;
  textarea.value = stripProfileMarkers(input.value);
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
  enhanceRouteWeatherInput();
  await injectProfileSetting();
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

document.addEventListener("change", async event => {
  const select = event.target.closest("[data-pack-profile]");
  if (!select) return;
  await setSetting(PROFILE_KEY, select.value);

  const tripProfile = document.querySelector("#tripPackProfile");
  if (tripProfile) tripProfile.value = select.value;
});

document.addEventListener("click", async event => {
  if (!event.target.closest("#openTripDialog,[data-action='new-trip']")) return;
  const tripProfile = document.querySelector("#tripPackProfile");
  if (tripProfile) tripProfile.value = await getSetting(PROFILE_KEY, "neutral");
}, true);

document.addEventListener("submit", async event => {
  if (event.target.id === "tripForm") {
    const profile = event.target.elements.packProfile?.value || await getSetting(PROFILE_KEY, "neutral");
    const weatherField = event.target.elements.weatherLocation;
    if (weatherField) weatherField.value = withProfileMarker(weatherField.value, profile);
    return;
  }

  if (event.target.id === "weatherLocationForm") {
    const currentTripId = await getSetting("currentTripId", null);
    const trip = currentTripId ? await get("trips", currentTripId) : null;
    const marker = String(trip?.weatherLocation || "")
      .split(/\r?\n/)
      .find(line => line.trim().startsWith(PROFILE_MARKER_PREFIX));
    if (marker && event.target.elements.weatherLocation) {
      const clean = stripProfileMarkers(event.target.elements.weatherLocation.value);
      event.target.elements.weatherLocation.value = [clean, marker.trim()].filter(Boolean).join("\n");
    }
  }
}, true);

await enhanceCurrentView();
