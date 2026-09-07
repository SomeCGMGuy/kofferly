export function daysUntil(dateString) {
  const target = new Date(`${dateString}T12:00:00`);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return Math.ceil((target - start) / 86400000);
}

export function buildReminder(trip, items) {
  const days = daysUntil(trip.date);
  const open = items.filter(i => !i.checked);
  const importantOpen = open.filter(i => i.important);
  const categoriesOpen = new Set(open.map(i => i.category)).size;

  if (items.length && open.length === 0) {
    return {
      level: "calm",
      icon: "✓",
      title: "Alles bereit.",
      text: "Deine Packliste ist komplett. Jetzt darf Vorfreude übernehmen."
    };
  }

  if (days < 0) {
    return {
      level: "calm",
      icon: "↺",
      title: "Reise läuft oder ist vorbei.",
      text: "Du kannst die Reise archivieren oder die Liste für später als Vorlage nutzen."
    };
  }

  if (days <= 1 && importantOpen.length) {
    return {
      level: "urgent",
      icon: "🧳",
      title: "Letzter Check vor der Abreise",
      text: `${importantOpen.length} wichtige ${importantOpen.length === 1 ? "Sache ist" : "Sachen sind"} noch offen.`
    };
  }

  if (days <= 2 && open.length) {
    return {
      level: "urgent",
      icon: "⏳",
      title: `Noch ${Math.max(days, 0)} ${days === 1 ? "Tag" : "Tage"}`,
      text: `${open.length} Dinge in ${categoriesOpen} ${categoriesOpen === 1 ? "Kategorie" : "Kategorien"} sind noch offen.`
    };
  }

  if (days <= 7 && open.length) {
    return {
      level: "calm",
      icon: "🌿",
      title: "Die Abreise rückt näher",
      text: `Noch ${days} Tage. Du hast noch ${open.length} offene Punkte – ganz entspannt Stück für Stück.`
    };
  }

  return {
    level: "calm",
    icon: "✦",
    title: "Alles im grünen Bereich",
    text: days >= 0 ? `Noch ${days} Tage bis ${trip.destination}.` : "Gute Reise!"
  };
}
