import { del, get, getAll, getByIndex, getSetting, put, setSetting } from "./db.js";

const view = document.querySelector("#view");
const PROFILE_KEY = "packProfile";
const WOMEN_PROFILE = "women";
const PROFILE_ITEM_KEY = "women-hygiene";

let scheduled = false;
let profileSyncRunning = false;

function isSettingsView() {
  return view?.querySelector(".section-head h1")?.textContent?.trim() === "Einstellungen";
}

function isHomeView() {
  return Boolean(view?.querySelector(".hero"));
}

async function syncProfileItems() {
  if (profileSyncRunning) return;
  profileSyncRunning = true;

  try {
    const profile = await getSetting(PROFILE_KEY, "neutral");
    const trips = await getAll("trips");

    for (const trip of trips) {
      const items = await getByIndex("packItems", "tripId", trip.id);
      const existing = items.find(item => item.source === "profile" && item.key === PROFILE_ITEM_KEY);

      if (profile === WOMEN_PROFILE && !existing) {
        await put("packItems", {
          id: crypto.randomUUID(),
          tripId: trip.id,
          key: PROFILE_ITEM_KEY,
          category: "Hygiene",
          name: "Menstruations- / Hygieneartikel",
          quantity: 1,
          unit: "Set",
          important: false,
          reason: "Aus deinem optionalen Damen-Packprofil ergänzt.",
          source: "profile",
          checked: false,
          createdAt: new Date().toISOString()
        });
      }

      if (profile !== WOMEN_PROFILE && existing) {
        await del("packItems", existing.id);
      }
    }
  } finally {
    profileSyncRunning = false;
  }
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
      <h3>Packprofil</h3>
      <p class="muted">Optional. Beim Damen-Profil ergänzt Kofferly passende persönliche Hygieneartikel automatisch.</p>
    </div>
    <select data-pack-profile aria-label="Packprofil">
      <option value="neutral" ${profile === "neutral" ? "selected" : ""}>Keine Angabe</option>
      <option value="women" ${profile === WOMEN_PROFILE ? "selected" : ""}>Damen</option>
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
  textarea.value = input.value;
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
  const head = weatherCard.querySelector(".progress-row");
  head?.insertAdjacentElement("afterend", summary);
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
  await syncProfileItems();
});

document.addEventListener("submit", event => {
  if (event.target.id !== "tripForm") return;
  setTimeout(() => syncProfileItems(), 600);
}, true);

await syncProfileItems();
await enhanceCurrentView();
