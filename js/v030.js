import { getAll, getByIndex, getSetting, setSetting, get } from "./db.js";
import { daysUntil } from "./reminders.js";

const bell = document.querySelector("#notificationBell");
const badge = document.querySelector("#notificationBadge");
const dialog = document.querySelector("#notificationDialog");
const list = document.querySelector("#notificationList");
const view = document.querySelector("#view");

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function tripStartText(days) {
  if (days === 0) return "Die Reise startet heute";
  if (days === 1) return "Die Reise startet morgen";
  if (days > 1) return `Die Reise startet in ${days} Tagen`;
  return "Die Reise hat bereits begonnen";
}

async function currentTripSnapshot() {
  const trips = (await getAll("trips")).sort((a,b) => a.date.localeCompare(b.date));
  const selected = await getSetting("currentTripId", null);
  let trip = trips.find(t => t.id === selected);

  if (!trip) {
    const today = new Date();
    trip = trips.find(t => new Date(`${t.date}T23:59:59`) >= today) || trips.at(-1) || null;
  }

  if (!trip) return null;

  const items = await getByIndex("packItems", "tripId", trip.id);
  const weather = await get("weather", trip.id);
  return { trip, items, weather };
}

function candidateNotifications({ trip, items, weather }) {
  const days = daysUntil(trip.date);
  const open = items.filter(item => !item.checked);
  const important = open.filter(item => item.important);
  const notes = [];

  if (days >= 0 && days <= 7) {
    notes.push({
      id: `${trip.id}:countdown:${days}`,
      icon: "✈",
      title: tripStartText(days),
      text: days <= 1 ? "Ein kurzer letzter Blick auf die Packliste lohnt sich." : "Du hast noch genug Zeit für die letzten Vorbereitungen."
    });
  }

  if (open.length) {
    notes.push({
      id: `${trip.id}:open:${open.length}:${important.length}`,
      icon: "✓",
      title: `${open.length} ${open.length === 1 ? "Ding ist" : "Dinge sind"} noch offen`,
      text: important.length
        ? `Davon ${important.length} ${important.length === 1 ? "wichtiger Punkt" : "wichtige Punkte"}.`
        : "Keine wichtigen Punkte mehr offen."
    });
  } else if (items.length) {
    notes.push({
      id: `${trip.id}:ready`,
      icon: "✓",
      title: "Alles bereit",
      text: "Deine Packliste ist vollständig abgehakt."
    });
  }

  const fetchedAt = weather?.fetchedAt ? new Date(weather.fetchedAt).getTime() : 0;
  const stale = !fetchedAt || Date.now() - fetchedAt > 12 * 60 * 60 * 1000;
  if (days >= 0 && days <= 3 && stale) {
    notes.push({
      id: `${trip.id}:weather:${trip.date}`,
      icon: "☁",
      title: "Wetter vor der Abfahrt prüfen",
      text: "Aktualisiere die Vorhersage noch einmal, damit die Packempfehlung zum neuesten Stand passt."
    });
  }

  return notes;
}

async function refreshNotificationUi(markRead = false) {
  const snapshot = await currentTripSnapshot();
  const notes = snapshot ? candidateNotifications(snapshot) : [];
  const readIds = new Set(await getSetting("notificationReadIds", []));
  const unread = notes.filter(note => !readIds.has(note.id));

  badge.hidden = unread.length === 0;
  badge.textContent = String(unread.length);
  bell?.setAttribute("aria-label", unread.length ? `Benachrichtigungen, ${unread.length} ungelesen` : "Benachrichtigungen");

  list.innerHTML = notes.length
    ? notes.map(note => `
      <article class="notification-item ${readIds.has(note.id) ? "read" : "unread"}">
        <span class="notification-item-icon" aria-hidden="true">${esc(note.icon)}</span>
        <div>
          <strong>${esc(note.title)}</strong>
          <p>${esc(note.text)}</p>
        </div>
      </article>
    `).join("")
    : `<div class="notification-empty"><strong>Alles ruhig.</strong><p>Aktuell gibt es keine Hinweise für deine Reise.</p></div>`;

  if (markRead && notes.length) {
    const next = [...new Set([...readIds, ...notes.map(note => note.id)])].slice(-100);
    await setSetting("notificationReadIds", next);
    badge.hidden = true;
  }
}

async function insertCountdownCard() {
  if (!view || view.querySelector(".mockup-countdown-card")) return;
  const hero = view.querySelector(".hero");
  if (!hero) return;

  const snapshot = await currentTripSnapshot();
  if (!snapshot || !document.body.contains(hero) || view.querySelector(".mockup-countdown-card")) return;

  const { trip, items } = snapshot;
  const days = daysUntil(trip.date);
  const open = items.filter(item => !item.checked);
  const important = open.filter(item => item.important);
  const ready = items.length > 0 && open.length === 0;

  const card = document.createElement("section");
  card.className = `mockup-countdown-card ${ready ? "ready" : "open"}`;
  card.innerHTML = `
    <div class="countdown-plane" aria-hidden="true">✈</div>
    <div class="countdown-copy">
      <p class="eyebrow">${ready ? "Alles erledigt" : "Noch etwas zu erledigen"}</p>
      <h2>${esc(ready ? "Alles bereit" : tripStartText(days))}</h2>
      <p>${ready
        ? "Die wichtigen Dinge sind erledigt. Jetzt darf die Vorfreude übernehmen."
        : `${open.length} ${open.length === 1 ? "Ding ist" : "Dinge sind"} noch offen${important.length ? `, davon ${important.length} wichtig` : ""}.`}</p>
    </div>
    <button class="countdown-link" data-route="packing">${ready ? "Packliste ansehen" : "Zur Packliste"}<span aria-hidden="true">→</span></button>
  `;

  hero.insertAdjacentElement("afterend", card);
}

let scheduled = false;
const observer = new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(async () => {
    scheduled = false;
    await insertCountdownCard();
    await refreshNotificationUi(false);
  });
});

observer.observe(view, { childList: true, subtree: true });

bell?.addEventListener("click", async () => {
  await refreshNotificationUi(true);
  dialog.showModal();
});

document.querySelector("[data-notification-close]")?.addEventListener("click", () => dialog.close());

dialog?.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

await insertCountdownCard();
await refreshNotificationUi(false);
