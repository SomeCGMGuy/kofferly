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

function splitWeatherLocations(value = "") {
  return [...new Set(String(value)
    .split(/\r?\n|;/)
    .map(part => part.trim())
    .filter(Boolean))];
}

function weatherQueries(trip) {
  const explicit = splitWeatherLocations(trip.weatherLocation || "");
  if (explicit.length) return explicit;
  return trip.destination?.trim() ? [trip.destination.trim()] : [];
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

async function resolveQuery(query, destination = "") {
  const candidates = [query];
  const fallback = REGION_FALLBACKS.get(normalized(query));
  if (fallback) candidates.push(fallback);

  const simplified = query.replace(/\([^)]*\)/g, "").trim();
  if (simplified && !candidates.includes(simplified)) candidates.push(simplified);

  if (query === destination) {
    const destinationFallback = REGION_FALLBACKS.get(normalized(destination));
    if (destinationFallback && !candidates.includes(destinationFallback)) candidates.push(destinationFallback);
  }

  for (const candidate of [...new Set(candidates.filter(Boolean))]) {
    const place = await geocode(candidate);
    if (place) return { place, query };
  }

  return null;
}

export async function resolveWeatherPlace(trip) {
  const query = weatherQueries(trip)[0];
  if (!query) throw new Error("Kein Wetterort vorhanden.");
  const resolved = await resolveQuery(query, trip.destination?.trim() || "");
  if (resolved) return resolved;
  throw new Error(`Für „${query}“ wurde kein eindeutiger Wetterort gefunden. Bitte einen Ort wie „Dorf Tirol“ oder „Bozen“ eintragen.`);
}

async function fetchForecast(place) {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "16"
  });

  const data = await fetchJson(`${FORECAST}?${params}`, "Wetterdienst");
  if (!data.daily?.time?.length) throw new Error("Wetterdienst: Es wurden keine Tageswerte geliefert.");

  return {
    timezone: data.timezone,
    days: data.daily.time.map((date, i) => ({
      date,
      code: data.daily.weather_code?.[i] ?? null,
      max: data.daily.temperature_2m_max?.[i] ?? null,
      min: data.daily.temperature_2m_min?.[i] ?? null,
      rain: data.daily.precipitation_probability_max?.[i] ?? 0
    }))
  };
}

function aggregateForecasts(forecasts) {
  const byDate = new Map();

  for (const forecast of forecasts) {
    for (const day of forecast.days) {
      const current = byDate.get(day.date) || {
        date: day.date,
        code: day.code,
        max: null,
        min: null,
        rain: 0
      };

      if (Number.isFinite(Number(day.max))) {
        current.max = current.max == null ? Number(day.max) : Math.max(current.max, Number(day.max));
      }
      if (Number.isFinite(Number(day.min))) {
        current.min = current.min == null ? Number(day.min) : Math.min(current.min, Number(day.min));
      }
      if (Number.isFinite(Number(day.rain)) && Number(day.rain) >= current.rain) {
        current.rain = Number(day.rain);
        current.code = day.code;
      }

      byDate.set(day.date, current);
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function refreshWeather(trip) {
  const queries = weatherQueries(trip);
  if (!queries.length) throw new Error("Für diese Reise wurde kein Wetterort gefunden.");

  const resolved = [];
  const unresolved = [];

  for (const query of queries) {
    const result = await resolveQuery(query, trip.destination?.trim() || "");
    if (result) resolved.push(result);
    else unresolved.push(query);
  }

  if (!resolved.length) {
    throw new Error(`Für „${queries.join(" · ")}“ wurde kein eindeutiger Wetterort gefunden.`);
  }

  const forecasts = [];
  for (const entry of resolved) {
    const forecast = await fetchForecast(entry.place);
    forecasts.push({ ...forecast, ...entry });
  }

  const places = forecasts.map(entry => ({
    query: entry.query,
    place: [entry.place.name, entry.place.admin1, entry.place.country].filter(Boolean).join(", "),
    latitude: entry.place.latitude,
    longitude: entry.place.longitude,
    timezone: entry.timezone
  }));

  const row = {
    tripId: trip.id,
    query: queries.join("; "),
    place: places.length === 1 ? places[0].place : `${places.length} Orte entlang der Route`,
    places,
    unresolved,
    latitude: places[0]?.latitude ?? null,
    longitude: places[0]?.longitude ?? null,
    timezone: places[0]?.timezone || "auto",
    days: aggregateForecasts(forecasts),
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
