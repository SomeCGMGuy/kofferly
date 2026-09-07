const view = document.querySelector("#view");
const dialog = document.querySelector("#quickItemDialog");
const form = document.querySelector("#quickItemForm");
const categorySelect = document.querySelector("#quickItemCategory");

function isPackingView() {
  return view?.querySelector(".section-head h1")?.textContent?.trim() === "Packliste";
}

function isSettingsView() {
  return view?.querySelector(".section-head h1")?.textContent?.trim() === "Einstellungen";
}

function isHomeView() {
  return Boolean(view?.querySelector(".hero"));
}

function categoryNames() {
  return [...view.querySelectorAll(".category-title strong")]
    .map(el => el.textContent.trim())
    .filter(Boolean);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function populateCategories() {
  const categories = [...new Set([...categoryNames(), "Sonstiges"])];
  categorySelect.innerHTML = categories.map(category => `<option>${escapeHtml(category)}</option>`).join("");
}

function openQuickItem() {
  if (!isPackingView()) return;
  populateCategories();
  form.reset();
  dialog.showModal();
  setTimeout(() => form.elements.name?.focus(), 80);
}

function applySearch(query) {
  const normalized = query.trim().toLocaleLowerCase("de-DE");
  const categories = [...view.querySelectorAll(".category")];
  let visible = 0;

  for (const category of categories) {
    const categoryName = category.querySelector(".category-title strong")?.textContent?.toLocaleLowerCase("de-DE") || "";
    const categoryMatch = normalized && categoryName.includes(normalized);
    let categoryVisible = 0;

    for (const item of category.querySelectorAll(".pack-item")) {
      const copy = item.querySelector(".item-copy")?.textContent?.toLocaleLowerCase("de-DE") || "";
      const show = !normalized || categoryMatch || copy.includes(normalized);
      item.hidden = !show;
      if (show) categoryVisible += 1;
    }

    category.hidden = categoryVisible === 0;
    visible += categoryVisible;
  }

  const count = view.querySelector("[data-pack-search-count]");
  if (count) count.textContent = normalized ? `${visible} Treffer` : "";

  const empty = view.querySelector("[data-pack-search-empty]");
  if (empty) empty.hidden = !normalized || visible > 0;
}

function enhancePackingView() {
  if (!isPackingView()) return;

  view.querySelector(".pack-summary")?.remove();
  view.querySelector("[data-action='regenerate-packing']")?.remove();

  if (!view.querySelector(".pack-search-bar")) {
    const sectionHead = view.querySelector(".section-head");
    const search = document.createElement("section");
    search.className = "pack-search-bar card";
    search.innerHTML = `
      <label class="pack-search-field">
        <span class="pack-search-icon" aria-hidden="true">⌕</span>
        <input type="search" inputmode="search" placeholder="Aufgaben durchsuchen …" aria-label="Aufgaben durchsuchen" data-pack-search autocomplete="off">
        <span class="pack-search-count" data-pack-search-count aria-live="polite"></span>
      </label>
      <p class="pack-search-empty" data-pack-search-empty hidden>Keine passende Aufgabe gefunden.</p>
    `;
    sectionHead?.insertAdjacentElement("afterend", search);
  }

  if (!view.querySelector(".quick-add-task")) {
    const fab = document.createElement("button");
    fab.type = "button";
    fab.className = "quick-add-task";
    fab.dataset.quickAddItem = "";
    fab.setAttribute("aria-label", "Aufgabe hinzufügen");
    fab.innerHTML = `<span aria-hidden="true">＋</span><strong>Aufgabe</strong>`;
    view.append(fab);
  }
}

function simplifyHomeView() {
  if (!isHomeView()) return;
  view.querySelector("[data-action='refresh-image']")?.remove();
}

async function loadVersion(label) {
  try {
    const response = await fetch("./VERSION");
    if (!response.ok) throw new Error(`VERSION ${response.status}`);
    const version = (await response.text()).trim();
    if (label.isConnected && version) label.textContent = `Version ${version}`;
  } catch (error) {
    console.warn("Kofferly version could not be read.", error);
    if (label.isConnected) label.textContent = "Version unbekannt";
  }
}

function simplifySettingsView() {
  if (!isSettingsView()) return;

  for (const card of view.querySelectorAll(".settings-grid .info-card")) {
    const eyebrow = card.querySelector(".eyebrow")?.textContent?.trim();
    if (eyebrow === "Intelligente Packliste") card.remove();
  }

  const grid = view.querySelector(".settings-grid");
  if (grid && !grid.querySelector("[data-app-version-card]")) {
    const versionCard = document.createElement("section");
    versionCard.className = "setting-row card";
    versionCard.dataset.appVersionCard = "";
    versionCard.innerHTML = `
      <div>
        <h3>Installierte Version</h3>
        <p class="muted" data-app-version>Version wird geladen …</p>
      </div>
    `;
    grid.prepend(versionCard);
    loadVersion(versionCard.querySelector("[data-app-version]"));
  }

  if (grid && !grid.querySelector("[data-app-reload-card]")) {
    const card = document.createElement("section");
    card.className = "setting-row card";
    card.dataset.appReloadCard = "";
    card.innerHTML = `
      <div>
        <h3>App neu laden</h3>
        <p class="muted">Prüft auf eine neue Kofferly-Version und lädt die App vollständig neu. Deine Reisen und Packlisten bleiben gespeichert.</p>
      </div>
      <button class="button secondary" type="button" data-reload-app>Neu laden</button>
    `;
    grid.prepend(card);
  }
}

function syncPullToRefresh() {
  const allow = isHomeView();
  document.documentElement.style.overscrollBehaviorY = allow ? "auto" : "none";
  document.body.style.overscrollBehaviorY = allow ? "auto" : "none";
}

function enhanceCurrentView() {
  syncPullToRefresh();
  enhancePackingView();
  simplifyHomeView();
  simplifySettingsView();
}

async function waitForWorker(worker) {
  if (!worker || worker.state === "activated" || worker.state === "redundant") return;
  await Promise.race([
    new Promise(resolve => {
      const onStateChange = () => {
        if (worker.state === "activated" || worker.state === "redundant") {
          worker.removeEventListener("statechange", onStateChange);
          resolve();
        }
      };
      worker.addEventListener("statechange", onStateChange);
    }),
    new Promise(resolve => setTimeout(resolve, 2500))
  ]);
}

async function reloadApp(button) {
  if (!navigator.onLine) {
    const original = button.textContent;
    button.textContent = "Offline";
    setTimeout(() => { button.textContent = original; }, 1600);
    return;
  }

  if (button.disabled) return;
  button.disabled = true;
  button.textContent = "Prüfe …";

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys
        .filter(key => key.startsWith("kofferly-shell-"))
        .map(key => caches.delete(key)));
    }

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
      await registration.update();
      await waitForWorker(registration.installing || registration.waiting);
    }
  } catch (error) {
    console.warn("Kofferly update check failed; reloading from network.", error);
  }

  window.location.reload();
}

let scheduled = false;
const observer = new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    enhanceCurrentView();
  });
});
observer.observe(view, { childList: true, subtree: true });

document.addEventListener("input", event => {
  if (event.target.matches("[data-pack-search]")) applySearch(event.target.value);
});

document.addEventListener("click", event => {
  if (event.target.closest("[data-quick-add-item]")) openQuickItem();
  if (event.target.closest("[data-quick-item-close]")) dialog.close("cancel");

  const reloadButton = event.target.closest("[data-reload-app]");
  if (reloadButton) reloadApp(reloadButton);
});

form?.addEventListener("submit", event => {
  event.preventDefault();
  const existing = document.querySelector("#addItemForm");
  if (!existing) return;

  const data = new FormData(form);
  existing.elements.name.value = data.get("name")?.trim() || "";
  existing.elements.category.value = data.get("category") || "Sonstiges";
  existing.elements.important.checked = data.get("important") === "on";
  if (!existing.elements.name.value) return;

  dialog.close("default");
  existing.requestSubmit();
});

enhanceCurrentView();
