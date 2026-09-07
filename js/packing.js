function diffDays(start, end) {
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function tripLength(trip) {
  if (!trip?.date) return { days: 4, nights: 3 };
  if (!trip.endDate) return { days: 4, nights: 3 };
  const nights = diffDays(trip.date, trip.endDate);
  return { days: Math.max(1, nights + 1), nights };
}

function destinationProfile(destination = "") {
  const d = destination.toLocaleLowerCase("de-DE");
  return {
    mountain: /südtirol|south tyrol|tirol|alpen|dolomit|berg|zillertal|allgäu|schweiz|graubünden|salzburg|kärnten/.test(d),
    tropical: /thailand|phuket|krabi|koh |bali|malediv|karibik|dominik|vietnam|sri lanka|seychell|mauritius/.test(d),
    beach: /mallorca|menorca|ibiza|kreta|rhodos|sardin|sizilien|adria|küste|meer|strand|costa |algarve|kanar|teneriffa|gran canaria|fuerteventura/.test(d),
    city: /rom|mailand|münchen|berlin|paris|london|wien|prag|hamburg|amsterdam|barcelona|madrid|lissabon/.test(d)
  };
}

function tripPackProfile(trip) {
  const marker = String(trip?.weatherLocation || "")
    .split(/\r?\n/)
    .find(line => line.trim().startsWith("@profile:"));
  return marker ? marker.trim().slice("@profile:".length) : "neutral";
}

export function weatherSummaryForTrip(trip, weather) {
  if (!weather?.days?.length || !trip?.date) return null;
  const start = trip.date;
  const end = trip.endDate || trip.date;
  let days = weather.days.filter(d => d.date >= start && d.date <= end);
  if (!days.length) return null;

  const max = Math.max(...days.map(d => Number(d.max)).filter(Number.isFinite));
  const min = Math.min(...days.map(d => Number(d.min)).filter(Number.isFinite));
  const rain = Math.max(...days.map(d => Number(d.rain ?? 0)).filter(Number.isFinite));
  return {
    max: Number.isFinite(max) ? max : null,
    min: Number.isFinite(min) ? min : null,
    rain: Number.isFinite(rain) ? rain : null,
    days: days.length
  };
}

function rec(key, category, name, quantity, unit, important = false, reason = "") {
  return { key, category, name, quantity, unit, important, reason, source: "generated" };
}

export function generatePackingRecommendations(trip, weather = null) {
  const { days, nights } = tripLength(trip);
  const profile = destinationProfile(trip.destination);
  const packProfile = tripPackProfile(trip);
  const wx = weatherSummaryForTrip(trip, weather);

  const underwear = days + 1;
  const socks = days + 1;
  const tops = Math.min(days, Math.max(3, Math.ceil(days * 0.7)));
  const trousers = days <= 4 ? 1 : days <= 8 ? 2 : 3;
  const sleepwear = days <= 7 ? 1 : 2;

  const items = [
    rec("id", "Dokumente", "Personalausweis / Reisepass", 1, "Stück", true, "Für die Reise griffbereit halten."),
    rec("driver", "Dokumente", "Führerschein", 1, "Stück", true, "Relevant, sobald du selbst fährst oder einen Mietwagen nutzt."),
    rec("insurance", "Dokumente", "Krankenversicherungskarte", 1, "Stück", true, "Für medizinische Versorgung unterwegs."),
    rec("travel-insurance", "Dokumente", "Auslandskrankenversicherung / Versicherungsnachweis", 1, "Nachweis", true, "Vor Auslandsreisen prüfen, ob Versicherungsschutz besteht und der Nachweis griffbereit ist."),
    rec("booking", "Dokumente", "Buchungsunterlagen", 1, "Satz", true, "Unterkunft, Tickets und Reservierungen offline verfügbar halten."),

    rec("underwear", "Kleidung", "Unterwäsche", underwear, "Stück", false, `${days} Reisetage plus 1 Reserve.`),
    rec("socks", "Kleidung", "Socken", socks, "Paar", false, `${days} Reisetage plus 1 Reserve.`),
    rec("tops", "Kleidung", "T-Shirts / Oberteile", tops, "Stück", false, "So reicht Wechselkleidung, ohne den Koffer unnötig voll zu machen."),
    rec("trousers", "Kleidung", "Lange Hosen", trousers, "Stück", false, `Für ${days} Tage reichen normalerweise ${trousers}.`),
    rec("sleep", "Kleidung", "Schlafsachen", sleepwear, "Set", false, nights > 7 ? "Bei längeren Reisen ist ein zweites Set angenehm." : "Ein Set reicht für diese Reisedauer normalerweise aus."),

    rec("toothbrush", "Hygiene", "Zahnbürste", 1, "Stück", false, ""),
    rec("toothpaste", "Hygiene", "Zahnpasta", 1, "Tube", false, days > 10 ? "Normale Tube statt Reisegröße." : "Eine Reisegröße reicht für diese Dauer meist aus."),
    rec("deodorant", "Hygiene", "Deo", 1, "Stück", false, ""),
    rec("sunscreen", "Hygiene", "Sonnencreme", 1, "Flasche", false, "Gerade bei längeren Aufenthalten oder viel Zeit draußen sinnvoll."),

    rec("phone", "Technik", "Smartphone", 1, "Stück", true, ""),
    rec("charger", "Technik", "Ladekabel", 1, "Stück", true, ""),
    rec("powerbank", "Technik", "Powerbank", 1, "Stück", false, "Für lange Reisetage und Navigation unterwegs."),

    rec("meds", "Gesundheit", "Persönlich benötigte Medikamente", days + 2, "Tagesdosen", true, `${days} Reisetage plus 2 Tage Reserve.`),
    rec("firstaid", "Gesundheit", "Kleine Reiseapotheke", 1, "Set", false, "Nur Dinge einpacken, die du kennst und üblicherweise verwendest."),

    rec("bottle", "Unterwegs", "Trinkflasche", 1, "Stück", false, ""),
    rec("snacks", "Unterwegs", "Snacks für die Anreise", 2, "Portionen", false, "Eine Portion für unterwegs, eine kleine Reserve.")
  ];

  if (packProfile === "women") {
    items.push(rec("women-hygiene", "Hygiene", "Menstruations- / Hygieneartikel", 1, "Set", false, "Aus dem Damen-Packprofil für diese Reise ergänzt."));
  }

  if (profile.mountain) {
    items.push(
      rec("fleece", "Kleidung", "Pullover / Fleece", wx?.min != null && wx.min < 8 ? 2 : 1, "Stück", false, "In Bergregionen können Morgen und Abend deutlich kühler sein."),
      rec("hiking-shoes", "Kleidung", "Feste Schuhe / Wanderschuhe", 1, "Paar", false, "Für Wege, Höhenunterschiede und wechselnden Untergrund."),
      rec("daypack", "Unterwegs", "Kleiner Tagesrucksack", 1, "Stück", false, "Praktisch für Ausflüge und Wanderungen.")
    );
  }

  if (profile.tropical || profile.beach || (wx?.max != null && wx.max >= 24)) {
    items.push(
      rec("shorts", "Kleidung", "Shorts / kurze Hose", days <= 5 ? 2 : 3, "Stück", false, "Für warme Tage."),
      rec("swimwear", "Kleidung", "Badebekleidung", days >= 7 ? 2 : 1, "Stück", false, "Bei mehreren Badetagen ist ein Wechselteil angenehm."),
      rec("sunhat", "Kleidung", "Sonnenhut / Cap", 1, "Stück", false, "Schutz bei längerer Zeit in der Sonne.")
    );
  }

  if (profile.tropical) {
    items.push(
      rec("mosquito", "Hygiene", "Insektenschutz", 1, "Flasche", true, "Bei tropischen Reisezielen besonders sinnvoll."),
      rec("light-long", "Kleidung", "Leichtes langes Oberteil", 1, "Stück", false, "Als Sonnen- und Mückenschutz am Abend.")
    );
  }

  if ((wx?.rain ?? 0) >= 35) {
    items.push(rec("rain-jacket", "Kleidung", "Regenjacke", 1, "Stück", true, `Für die Reise werden bis zu ${Math.round(wx.rain)} % Regenwahrscheinlichkeit angezeigt.`));
  } else if (profile.mountain) {
    items.push(rec("rain-jacket", "Kleidung", "Leichte Regenjacke", 1, "Stück", false, "In den Bergen kann das Wetter schnell wechseln."));
  }

  if (wx?.min != null && wx.min <= 10 && !items.some(i => i.key === "fleece")) {
    items.push(rec("fleece", "Kleidung", "Warmer Pullover / Fleece", 1, "Stück", false, `Die Vorhersage fällt nachts bis etwa ${Math.round(wx.min)} °C.`));
  }

  if (wx?.max != null && wx.max >= 28) {
    const sunscreen = items.find(i => i.key === "sunscreen");
    if (sunscreen) sunscreen.reason = `Bis etwa ${Math.round(wx.max)} °C vorhergesagt – Sonnenschutz fest einplanen.`;
  }

  return items;
}

export function recommendationHeadline(trip, weather) {
  const { days, nights } = tripLength(trip);
  const wx = weatherSummaryForTrip(trip, weather);
  const weatherText = wx
    ? ` · Wetter berücksichtigt (${Math.round(wx.min)}–${Math.round(wx.max)} °C${wx.rain != null ? `, bis ${Math.round(wx.rain)} % Regen` : ""})`
    : "";
  return `${days} Tage${nights ? ` / ${nights} Nächte` : ""}${weatherText}`;
}
