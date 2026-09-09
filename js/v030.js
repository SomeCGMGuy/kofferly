import { getAll, getByIndex, getSetting, setSetting, get } from "./db.js";
import { daysUntil } from "./reminders.js";

const bell = document.querySelector("#notificationBell");
const badge = document.querySelector("#notificationBadge");
const dialog = document.querySelector("#notificationDialog");
const list = document.querySelector("#notificationList");
const view = document.querySelector("#view");

let cachedSnapshot = null;
let refreshScheduled = false;
let notificationCloseTimer = 0;

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

  const items = (await getByIndex("packItems", "tripId", trip.id)).filter(item => !item.dismissed);
  const weather = await get("weather", trip.id);
  return { trip, items, weather };
}

function candidateNotifications({ trip, items, weather }) {
  const days = daysUntil(trip.date);
  const open = items.filter(item => !item.checked);
  const important = open.filter(item => item.important);
  const urgent = days === 0 && important.length > 0;
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
      icon: urgent ? "!" : "✓",
      level: urgent ? "urgent" : "normal",
      title: urgent
        ? `${important.length} ${important.length === 1 ? "wichtiger Punkt ist" : "wichtige Punkte sind"} noch offen`
        : `${open.length} ${open.length === 1 ? "Ding ist" : "Dinge sind"} noch offen`,
      text: urgent
        ? "Bitte prüfe die wichtigen Dinge vor der Abreise noch einmal."
        : important.length
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
      text: "Aktualisiere die Vorhersage noch einmal, damit die Packempfehlung zum neuesten Stand passt.",
      action: navigator.onLine ? {
        label: "Wetter aktualisieren",
        dataAction: "refresh-weather"
      } : null
    });
  }

  return notes;
}

async function refreshNotificationUi(markRead = false, snapshotOverride = null) {
  const snapshot = snapshotOverride || await currentTripSnapshot();
  if (snapshot) cachedSnapshot = snapshot;
  const notes = snapshot ? candidateNotifications(snapshot) : [];
  const readIds = new Set(await getSetting("notificationReadIds", []));
  const unread = notes.filter(note => !readIds.has(note.id));
  const hasUrgentUnread = unread.some(note => note.level === "urgent");

  badge.hidden = unread.length === 0;
  badge.textContent = String(unread.length);
  badge.classList.toggle("urgent", hasUrgentUnread);
  bell?.setAttribute("aria-label", unread.length ? `Benachrichtigungen, ${unread.length} ungelesen` : "Benachrichtigungen");

  list.innerHTML = notes.length
    ? notes.map(note => `
      <article class="notification-item ${readIds.has(note.id) ? "read" : "unread"} ${note.level === "urgent" ? "urgent" : ""}">
        <span class="notification-item-icon" aria-hidden="true">${esc(note.icon)}</span>
        <div>
          <strong>${esc(note.title)}</strong>
          <p>${esc(note.text)}</p>
          ${note.action ? `<button class="notification-action" type="button" data-action="${esc(note.action.dataAction)}">${esc(note.action.label)}</button>` : ""}
        </div>
      </article>
    `).join("")
    : `<div class="notification-empty"><strong>Alles ruhig.</strong><p>Aktuell gibt es keine Hinweise für deine Reise.</p></div>`;

  if (markRead && notes.length) {
    const next = [...new Set([...readIds, ...notes.map(note => note.id)])].slice(-100);
    await setSetting("notificationReadIds", next);
    badge.hidden = true;
    badge.classList.remove("urgent");
  }
}

function openNotificationSheet() {
  if (!dialog || dialog.open) return;
  window.clearTimeout(notificationCloseTimer);
  dialog.classList.remove("is-closing");
  dialog.showModal();
  requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add("is-open")));
}

function closeNotificationSheet() {
  if (!dialog?.open || dialog.classList.contains("is-closing")) return;
  dialog.classList.remove("is-open");
  dialog.classList.add("is-closing");
  notificationCloseTimer = window.setTimeout(() => {
    dialog.classList.remove("is-closing");
    dialog.close();
  }, 180);
}

function buildCountdownCard({ trip, items }) {
  const days = daysUntil(trip.date);
  const open = items.filter(item => !item.checked);
  const important = open.filter(item => item.important);
  const ready = items.length > 0 && open.length === 0;
  const urgent = days === 0 && important.length > 0;
  const status = ready ? "ready" : urgent ? "urgent" : "open";

  const card = document.createElement("section");
  card.className = `mockup-countdown-card ${status}`;
  card.innerHTML = `
    <div class="countdown-plane" aria-hidden="true">${urgent ? "!" : "✈"}</div>
    <div class="countdown-copy">
      <p class="eyebrow">${ready ? "Alles erledigt" : urgent ? "Vor der Abreise prüfen" : "Noch etwas zu erledigen"}</p>
      <h2>${esc(ready ? "Alles bereit" : urgent ? "Wichtige Dinge sind noch offen" : tripStartText(days))}</h2>
      <p>${ready
        ? "Die wichtigen Dinge sind erledigt. Jetzt darf die Vorfreude übernehmen."
        : urgent
          ? `${important.length} ${important.length === 1 ? "wichtiger Punkt ist" : "wichtige Punkte sind"} noch offen${open.length > important.length ? ` · insgesamt ${open.length} offene Dinge` : ""}.`
          : `${open.length} ${open.length === 1 ? "Ding ist" : "Dinge sind"} noch offen${important.length ? `, davon ${important.length} wichtig` : ""}.`}</p>
    </div>
    <button class="countdown-link" data-route="packing">${ready ? "Packliste ansehen" : "Zur Packliste"}<span aria-hidden="true">→</span></button>
  `;
  return card;
}

function insertCountdownCardFromSnapshot(snapshot) {
  if (!view || !snapshot || view.querySelector(".mockup-countdown-card")) return false;
  const hero = view.querySelector(".hero");
  if (!hero) return false;
  hero.insertAdjacentElement("afterend", buildCountdownCard(snapshot));
  return true;
}

async function refreshSnapshotAndUi() {
  const snapshot = await currentTripSnapshot();
  cachedSnapshot = snapshot;

  if (snapshot && !view.querySelector(".mockup-countdown-card")) {
    insertCountdownCardFromSnapshot(snapshot);
  }

  await refreshNotificationUi(false, snapshot);
}

const observer = new MutationObserver(() => {
  insertCountdownCardFromSnapshot(cachedSnapshot);

  if (refreshScheduled) return;
  refreshScheduled = true;
  queueMicrotask(async () => {
    refreshScheduled = false;
    await refreshSnapshotAndUi();
  });
});

observer.observe(view, { childList: true, subtree: true });

bell?.addEventListener("click", async () => {
  const snapshot = await currentTripSnapshot();
  cachedSnapshot = snapshot;
  await refreshNotificationUi(true, snapshot);
  openNotificationSheet();
});

document.querySelector("[data-notification-close]")?.addEventListener("click", closeNotificationSheet);

dialog?.addEventListener("cancel", event => {
  event.preventDefault();
  closeNotificationSheet();
});

dialog?.addEventListener("click", event => {
  if (event.target === dialog) closeNotificationSheet();
});

dialog?.addEventListener("close", () => {
  dialog.classList.remove("is-open", "is-closing");
});

cachedSnapshot = await currentTripSnapshot();
insertCountdownCardFromSnapshot(cachedSnapshot);
await refreshNotificationUi(false, cachedSnapshot);
