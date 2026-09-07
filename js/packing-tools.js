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

function simplifySettingsView() {
  if (!isSettingsView()) return;

  for (const card of view.querySelectorAll(".settings-grid .info-card")) {
    const eyebrow = card.querySelector(".eyebrow")?.textContent?.trim();
    if (eyebrow === "Intelligente Packliste") card.remove();
  }
}

function syncPullToRefresh() {
  const activeRoute = document.querySelector(".nav-item.active")?.dataset.route;
  const allow = activeRoute === "home";
  document.documentElement.style.overscrollBehaviorY = allow ? "auto" : "none";
  document.body.style.overscrollBehaviorY = allow ? "auto" : "none";
}

function enhanceCurrentView() {
  syncPullToRefresh();
  enhancePackingView();
  simplifySettingsView();
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
