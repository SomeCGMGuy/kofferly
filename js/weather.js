import { get, put } from "./db.js";

const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST = "https://api.open-meteo.com/v1/forecast";

const REGION_FALLBACKS = new Map([
  ["südtirol", "Bozen, Italien"],
  ["south tyrol", "Bolzano, Italy"],
  ["dolomiten", "Bozen, Italien"],
  ["tirol", "Innsbruck, Österreich"],
  ["toscana", "Florenz, Italien"],
  ["toskana", "Florenz, Italien"],
  ["mallorca", "Palma de Mallorca, Spanien"],
  ["kreta", "Heraklion, Griechenland"]
]);

function normalized(value = "") {
  return value.trim().toLocaleLowerCase("de-DE");
}

async function fetchJson(url, label) {
  let res;
  try {
    res = await fetch(url, { headers: { "Accept": "application/json" } });
  } catch (error) {
    throw new Error(`${label}: Netzwerkfehler`);
  }

  let data = null;
  try { data = await res.json(); } catch (_) {}

  if (!res.ok) {
    const reason = data?.reason || data?.error || `${res.status} ${res.statusText}`;
    throw new Error(`${label}: ${reason}`);
  }
  return data;
}

function pickBestPlace(results, query) {
  const q = normalized(query).split(",")[0];
  return [...results].sort((a, b) => {
    const aName = normalized(a.name);
    const bName = normalized(b.name);
    const aExact = aName === q ? 1 : 0;
    const bExact = bName === q ? 1 : 0;
    if (aExact !== bExact) return bExact - aExact;
    return (b.population || 0) - (a.population || 0);
  })[0];
}

async function geocode(query) {
  const params = new URLSearchParams({
    name: query,
    count: "10",
    language: "de",
    format: "json"
  });
  const json = await fetchJson(`${GEOCODE}?${params}`, "Ortssuche");
  const results = json.results || [];
  if (!results.length) return null;
  return pickBestPlace(results, query);
}

export async function resolveWeatherPlace(trip) {
  const explicit = trip.weatherLocation?.trim();
  const destination = trip.destination?.trim();
  const candidates = [];

  if (explicit) candidates.push(explicit);
  if (destination && destination !== explicit) candidates.push(destination);

  const fallback = REGION_FALLBACKS.get(normalized(explicit || destination));
  if (fallback) candidates.push(fallback);

  // A destination such as "Dorf Tirol (Südtirol)" often geocodes better without brackets.
  if (destination) {
    const simplified = destination.replace(/\([^)]*\)/g, "").trim();
    if (simplified && !candidates.includes(simplified)) candidates.push(simplified);
  }

  for (const query of [...new Set(candidates.filter(Boolean))]) {
    const place = await geocode(query);
    if (place) return { place, query };
  }

  throw new Error(`Für „${explicit || destination}“ wurde kein eindeutiger Wetterort gefunden. Bitte einen Ort wie „Dorf Tirol“ oder „Bozen“ eintragen.`);
}

export async function refreshWeather(trip) {
  const { place, query } = await resolveWeatherPlace(trip);

  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "16"
  });

  const data = await fetchJson(`${FORECAST}?${params}`, "Wetterdienst");
  if (!data.daily?.time?.length) throw new Error("Wetterdienst: Es wurden keine Tageswerte geliefert.");

  const days = data.daily.time.map((date, i) => ({
    date,
    code: data.daily.weather_code?.[i] ?? null,
    max: data.daily.temperature_2m_max?.[i] ?? null,
    min: data.daily.temperature_2m_min?.[i] ?? null,
    rain: data.daily.precipitation_probability_max?.[i] ?? 0
  }));

  const row = {
    tripId: trip.id,
    query,
    place: [place.name, place.admin1, place.country].filter(Boolean).join(", "),
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: data.timezone,
    days,
    fetchedAt: new Date().toISOString()
  };
  await put("weather", row);
  return row;
}

export async function getWeather(tripId) {
  return get("weather", tripId);
}

export function weatherIcon(code) {
  if (code === 0) return "☀️";
  if ([1,2].includes(code)) return "🌤️";
  if (code === 3) return "☁️";
  if ([45,48].includes(code)) return "🌫️";
  if ([51,53,55,56,57].includes(code)) return "🌦️";
  if ([61,63,65,66,67,80,81,82].includes(code)) return "🌧️";
  if ([71,73,75,77,85,86].includes(code)) return "🌨️";
  if ([95,96,99].includes(code)) return "⛈️";
  return "🌤️";
}
