import { get, put } from "./db.js";

const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST = "https://api.open-meteo.com/v1/forecast";

export async function refreshWeather(trip) {
  const geoParams = new URLSearchParams({
    name: trip.destination,
    count: "1",
    language: "de",
    format: "json"
  });
  const geoRes = await fetch(`${GEOCODE}?${geoParams}`);
  if (!geoRes.ok) throw new Error("Ort konnte nicht gefunden werden");
  const geo = await geoRes.json();
  const place = geo.results?.[0];
  if (!place) throw new Error("Keine Wetterkoordinaten gefunden");

  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "auto",
    forecast_days: "16"
  });

  const res = await fetch(`${FORECAST}?${params}`);
  if (!res.ok) throw new Error("Wetter konnte nicht geladen werden");
  const data = await res.json();

  const days = data.daily.time.map((date, i) => ({
    date,
    code: data.daily.weather_code[i],
    max: data.daily.temperature_2m_max[i],
    min: data.daily.temperature_2m_min[i],
    rain: data.daily.precipitation_probability_max[i]
  }));

  const row = {
    tripId: trip.id,
    place: [place.name, place.admin1, place.country].filter(Boolean).join(", "),
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
