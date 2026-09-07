import "./app.js";
import { get, getAll, getByIndex, getSetting, setSetting } from "./db.js";

const view = document.querySelector("#view");
const badge = document.querySelector("#notificationBadge");
const notificationDialog = document.querySelector("#notificationDialog");
const notificationList = document.querySelector("#notificationList");
const openItemsDialog = document.querySelector("#openItemsDialog");
const openItemsList = document.querySelector("#openItemsList");

let notificationFilter = "all";
let refreshTimer = null;

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function daysUntil(dateString) {
  const target = new Date(`${dateString}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function departureLine(days) {
  if (days === 0) return "Die Reise startet heute!";
  if (days === 1) return "Die Reise startet morgen!";
  if (days > 1) return `Die Reise startet in ${days} Tagen!`;
  return "Die Reise ist bereits gestartet";
}

async function currentContext() {
  const trips = (await getAll("trips")).sort((a,b) => a.date.localeCompare(b.date));
  if (!trips.length) return null;

  const selected = await getSetting("currentTripId", null);
  let trip = trips.find(t => t.id === selected);
  if (!trip) {
    const today = new Date();
    trip = trips.find(t => new Date(`${t.date}T23:59:59`) >= today) || trips.at(-1);
  }

  const items = await getByIndex("packItems", "tripId", trip.id);
  const weather = await get("weather", trip.id);
  return { trip, items, weather };
}

function openStats(items) {
  const open = items.filter(item => !item.checked);
  const important = open.filter(item => item.important);
  return { open, important };
}

async function reminderSettings() {
  return {
    travelReminders: await getSetting("travelReminders", true),
    importantHints: await getSetting("importantHints", true),
    travelTips: await getSetting("travelTips", true)
  };
}

async function buildNotifications(ctx) {
  if (!ctx) return [];
  const { trip, items, weather } = ctx;
  const days = daysUntil(trip.date);
  const { open, important } = openStats(items);
  const settings = await reminderSettings();
  const rows = [];

  if (settings.travelReminders && days >= 0 && days <= 14) {
    rows.push({
      id: `${trip.id}:departure`,
      type: "departure",
      icon: "✈",
      title: departureLine(days),
      message: `${trip.destination} rückt näher. Packliste und Reisedaten sind offline verfügbar.`,
      route: "home"
    });
  }

  if (settings.importantHints && days >= 0 && days <= 7 && open.length) {
    rows.push({
      id: `${trip.id}:packing`,
      type: "important",
      icon: "✓",
      title: "Noch etwas zu erledigen",
      message: `${open.length} ${open.length === 1 ? "Punkt ist" : "Punkte sind"} noch offen${important.length ? `, davon ${important.length} wichtig` : ""}.`,
      route: "packing"
    });
  }

  if (settings.importantHints && days >= 0 && days <= 2 && important.length) {
    rows.push({
      id: `${trip.id}:last-check`,
      type: "important",
      icon: "!",
      title: "Letzter Check",
      message: `${important.length} wichtige ${important.length === 1 ? "Sache fehlt" : "Sachen fehlen"} noch vor der Abreise.`,
      route: "packing"
    });
  }

  if (settings.travelTips && days >= 0 && days <= 14) {
    rows.push({
      id: `${trip.id}:documents-tip`,
      type: "tip",
      icon: "i",
      title: "Tipp: Reiseunterlagen",
      message: "Unterkunftsbestätigung und wichtige Unterlagen offline bereithalten.",
      route: "home"
    });
  }

  if (settings.travelTips && days >= 0 && days <= 3 && weather?.fetchedAt) {
    const ageHours = (Date.now() - new Date(weather.fetchedAt).getTime()) / 3600000;
    if (ageHours >= 12) {
      rows.push({
        id: `${trip.id}:weather-tip`,
        type: "tip",
        icon: "☁",
        title: "Wetter noch einmal aktualisieren",
        message: "Die Abreise ist nah. Ein frischer Wetterstand kann deine Packliste noch verbessern.",
        route: "home"
      });
    }
  }

  const readMap = await getSetting("notificationRead", {});
  return rows.map(row => {
    const fingerprint = `${row.title}|${row.message}`;
    return { ...row, fingerprint, read: readMap[row.id] === fingerprint };
  });
}

function updateBadge(rows) {
  if (!badge) return;
  const unread = rows.filter(row => !row.read).length;
  badge.hidden = unread === 0;
  badge.textContent = unread > 9 ? "9+" : String(unread);
}

function filteredRows(rows) {
  if (notificationFilter === "important") return rows.filter(row => row.type === "important");
  if (notificationFilter === "tips") return rows.filter(row => row.type === "tip");
  return rows;
}

async function renderNotifications() {
  const ctx = await currentContext();
  const rows = await buildNotifications(ctx);
  updateBadge(rows);

  document.querySelectorAll("[data-action='notification-filter']").forEach(button => {
    button.classList.toggle("active", button.dataset.filter === notificationFilter);
  });

  const visible = filteredRows(rows);
  if (!notificationList) return rows;
  notificationList.innerHTML = visible.length ? visible.map(row => `
    <button class="notification-item ${row.read ? "read" : "unread"}" data-action="open-notification" data-id="${escapeHtml(row.id)}" data-route-target="${escapeHtml(row.route)}">
      <span class="notification-icon">${escapeHtml(row.icon)}</span>
      <span class="notification-copy">
        <strong>${escapeHtml(row.title)}</strong>
        <small>${escapeHtml(row.message)}</small>
      </span>
      ${row.read ? "" : '<span class="unread-dot" aria-label="ungelesen"></span>'}
    </button>
  `).join("") : `
    <div class="notification-empty">
      <span>✓</span><strong>Alles ruhig.</strong>
      <small>In diesem Bereich gibt es im Moment nichts Neues.</small>
    </div>
  `;
  return rows;
}

async function markRead(id) {
  const rows = await buildNotifications(await currentContext());
  const row = rows.find(item => item.id === id);
  if (!row) return;
  const readMap = await getSetting("notificationRead", {});
  readMap[row.id] = row.fingerprint;
  await setSetting("notificationRead", readMap);
}

async function markAllRead() {
  const rows = await buildNotifications(await currentContext());
  const readMap = await getSetting("notificationRead", {});
  rows.forEach(row => readMap[row.id] = row.fingerprint);
  await setSetting("notificationRead", readMap);
  await renderNotifications();
}

function routeTo(route) {
  document.querySelector(`.bottom-nav [data-route="${route}"]`)?.click();
}

function categoryIcon(category) {
  if (/hygiene/i.test(category)) return "◧";
  if (/technik/i.test(category)) return "▣";
  if (/dokument/i.test(category)) return "▤";
  return "•••";
}

async function openItems() {
  const ctx = await currentContext();
  if (!ctx || !openItemsDialog || !openItemsList) return;
  const { trip, items } = ctx;
  const days = daysUntil(trip.date);
  const groups = new Map();

  items.filter(item => !item.checked).forEach(item => {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  });

  document.querySelector("#openItemsCountdown").textContent = departureLine(days);
  openItemsList.innerHTML = [...groups.entries()].map(([category, openItems]) => {
    const total = items.filter(item => item.category === category).length;
    const done = total - openItems.length;
    return `
      <button class="open-category-card" data-action="open-packing-from-dialog">
        <span class="open-category-icon">${categoryIcon(category)}</span>
        <span class="open-category-copy">
          <strong>${escapeHtml(category)}</strong>
          <small>${done} von ${total} erledigt</small>
        </span>
        <span class="open-category-arrow">›</span>
      </button>
    `;
  }).join("") || `<div class="notification-empty"><span>✓</span><strong>Alles bereit.</strong><small>Deine Packliste ist vollständig.</small></div>`;

  openItemsDialog.showModal();
}

async function injectReminderCard() {
  const hero = view?.querySelector(".hero");
  view?.querySelector(".v03-trip-status-card")?.remove();
  if (!hero) return;

  const ctx = await currentContext();
  if (!ctx) return;
  const days = daysUntil(ctx.trip.date);
  const { open, important } = openStats(ctx.items);
  if (!(days >= 0 && days <= 7 && open.length)) return;

  const card = document.createElement("section");
  card.className = "v03-trip-status-card card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.innerHTML = `
    <div class="v03-plane-badge" aria-hidden="true">✈</div>
    <div class="v03-trip-status-copy">
      <p class="eyebrow">Noch etwas zu erledigen</p>
      <h2>${escapeHtml(departureLine(days))}</h2>
      <p>${open.length} ${open.length === 1 ? "Punkt ist" : "Punkte sind"} noch offen${important.length ? `, davon ${important.length} wichtig` : ""}.</p>
      <span class="v03-text-action">Offene Punkte ansehen <span aria-hidden="true">→</span></span>
    </div>
  `;
  card.addEventListener("click", openItems);
  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openItems();
    }
  });
  hero.insertAdjacentElement("afterend", card);
}

async function injectSettings() {
  const title = view?.querySelector(".section-head h1")?.textContent?.trim();
  if (title !== "Einstellungen") return;
  if (view.querySelector("[data-v03-notification-settings]")) return;

  const settings = await reminderSettings();
  const wrapper = document.createElement("section");
  wrapper.className = "info-card card";
  wrapper.dataset.v03NotificationSettings = "";
  wrapper.innerHTML = `
    <p class="eyebrow">Benachrichtigungen</p>
    <h2>Du hast die Kontrolle</h2>
    <p class="muted v03-settings-copy">Alle Hinweise bleiben lokal in Kofferly. Du entscheidest, welche davon im Glockenbereich erscheinen.</p>
    <div class="v03-setting-list">
      ${[
        ["travelReminders", "Erinnerungen vor der Reise", "Countdown und Hinweise, wenn die Abreise näher rückt.", settings.travelReminders],
        ["importantHints", "Wichtige Hinweise", "Offene wichtige Packpunkte und letzter Check.", settings.importantHints],
        ["travelTips", "Reisetipps", "Ruhige Hinweise zu Unterlagen und Vorbereitung.", settings.travelTips]
      ].map(([key, title, text, checked]) => `
        <div class="v03-setting-row">
          <div><strong>${title}</strong><small>${text}</small></div>
          <label class="switch">
            <input type="checkbox" data-v03-setting="${key}" ${checked ? "checked" : ""}>
            <span></span>
          </label>
        </div>
      `).join("")}
    </div>
  `;

  const grid = view.querySelector(".settings-grid");
  grid?.insertBefore(wrapper, grid.children[2] || null);
}

async function refreshEnhancements() {
  await injectReminderCard();
  await injectSettings();
  await renderNotifications();
}

function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => refreshEnhancements().catch(console.error), 30);
}

document.addEventListener("click", async event => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "open-notifications") {
    await renderNotifications();
    notificationDialog?.showModal();
  }
  if (action === "close-notifications") notificationDialog?.close();
  if (action === "notification-filter") {
    notificationFilter = target.dataset.filter || "all";
    await renderNotifications();
  }
  if (action === "mark-notifications-read") await markAllRead();
  if (action === "open-notification") {
    await markRead(target.dataset.id);
    notificationDialog?.close();
    routeTo(target.dataset.routeTarget || "home");
  }
  if (action === "close-open-items") openItemsDialog?.close();
  if (action === "open-packing-from-dialog") {
    openItemsDialog?.close();
    routeTo("packing");
  }
  if (action === "remind-later") openItemsDialog?.close();
}, true);

document.addEventListener("change", async event => {
  const key = event.target.dataset.v03Setting;
  if (!key) return;
  await setSetting(key, event.target.checked);
  await renderNotifications();
});

if (view) new MutationObserver(scheduleRefresh).observe(view, { childList: true, subtree: true });
window.addEventListener("online", scheduleRefresh);
window.addEventListener("offline", scheduleRefresh);

await refreshEnhancements();
