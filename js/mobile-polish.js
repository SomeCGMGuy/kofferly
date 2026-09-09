const view = document.querySelector("#view");
const PACK_HINT_KEY = "kofferly:pack-edit-hint:v1";
const STYLE_ID = "kofferly-mobile-polish-style";
const tripThumbCache = new Map();
let showCompletedPacking = false;

if (!document.querySelector(`#${STYLE_ID}`)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .hero-media{background-image:var(--kofferly-hero-image,none),linear-gradient(135deg,#648c75,#214f3f);background-size:cover;background-position:center}
    .trip-thumb.has-cached-image{background-image:var(--kofferly-trip-thumb,none);background-size:cover;background-position:center;font-size:0}
    .trip-thumb.has-cached-image img{background:transparent}
    .pack-edit-coachmark{display:flex;align-items:center;gap:8px;margin:-4px 0 12px;padding:0 2px;color:var(--muted);font-size:.78rem;line-height:1.35}
    .pack-edit-coachmark svg{width:17px;height:17px;flex:0 0 auto;fill:none;stroke:var(--forest);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .pack-edit-coachmark strong{color:var(--forest);font-weight:800}
    .pack-completed-filter{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 12px;padding:11px 14px;border:1px solid var(--line);border-radius:16px;background:#fbfaf5;color:var(--muted);font-size:.82rem;font-weight:800}
    .pack-completed-filter button{border:0;background:transparent;color:var(--forest);font:inherit;font-weight:900;padding:5px 2px}
    .category.is-complete-collapsed{padding-top:12px;padding-bottom:12px;background:linear-gradient(135deg,var(--sage),#fbfdfb);border-color:var(--forest-3)}
    .category.is-complete-collapsed .pack-items{display:none}
    .category.is-complete-collapsed [data-action="check-category"]{display:none}
    .category.is-complete-collapsed .category-title::after{content:"✓ erledigt";margin-left:8px;color:var(--forest);font-size:.72rem;font-weight:900}
    @media (max-width:420px){.pack-edit-coachmark{font-size:.75rem}.pack-completed-filter{font-size:.78rem}}
  `;
  document.head.append(style);
}

function packHintDone() {
  return localStorage.getItem(PACK_HINT_KEY) === "done";
}

function markPackHintDone() {
  if (packHintDone()) return;
  localStorage.setItem(PACK_HINT_KEY, "done");
  document.querySelector(".pack-edit-coachmark")?.remove();
}

function maybeAddPackHint() {
  if (!view || packHintDone() || view.querySelector(".pack-edit-coachmark")) return;
  const heading = view.querySelector(".section-head h1");
  if (heading?.textContent?.trim() !== "Packliste") return;

  const sectionHead = heading.closest(".section-head");
  if (!sectionHead) return;

  const hint = document.createElement("div");
  hint.className = "pack-edit-coachmark";
  hint.setAttribute("role", "note");
  hint.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 11V7a2 2 0 0 1 4 0v3M12 10V6a2 2 0 0 1 4 0v5M16 10V8a2 2 0 0 1 4 0v6c0 4.4-3.6 8-8 8h-1.5a7 7 0 0 1-5.8-3.1L2.8 16a2 2 0 0 1 3.2-2.4L8 16"/></svg>
    <span><strong>Tipp:</strong> Bezeichnung gedrückt halten, um Menge oder Notiz zu bearbeiten.</span>
  `;
  sectionHead.insertAdjacentElement("afterend", hint);
}

function syncPackingCompletedFilter() {
  if (!view) return;
  const heading = view.querySelector(".section-head h1");
  const isPacking = heading?.textContent?.trim() === "Packliste";
  const existingFilter = view.querySelector(".pack-completed-filter");

  if (!isPacking) {
    existingFilter?.remove();
    return;
  }

  const categories = [...view.querySelectorAll(".list .category")];
  const items = categories.flatMap(category => [...category.querySelectorAll(".pack-item")]);
  if (!items.length) {
    existingFilter?.remove();
    return;
  }

  const completed = items.filter(item => item.classList.contains("checked") || item.querySelector('input[type="checkbox"]')?.checked);

  for (const category of categories) {
    const categoryItems = [...category.querySelectorAll(".pack-item")];
    const completedItems = categoryItems.filter(item => item.classList.contains("checked") || item.querySelector('input[type="checkbox"]')?.checked);
    const complete = categoryItems.length > 0 && completedItems.length === categoryItems.length;

    for (const item of categoryItems) {
      const checked = item.classList.contains("checked") || item.querySelector('input[type="checkbox"]')?.checked;
      item.hidden = !showCompletedPacking && checked;
    }

    category.classList.toggle("is-complete-collapsed", !showCompletedPacking && complete);
  }

  if (!completed.length) {
    existingFilter?.remove();
    return;
  }

  const list = categories[0]?.closest(".list");
  if (!list) return;

  const filter = existingFilter || document.createElement("div");
  filter.className = "pack-completed-filter";
  filter.innerHTML = `<span>✓ ${completed.length} ${completed.length === 1 ? "erledigt" : "erledigt"}</span><button type="button" data-completed-toggle>${showCompletedPacking ? "Erledigte ausblenden" : "Anzeigen"}</button>`;
  if (!existingFilter) list.insertAdjacentElement("beforebegin", filter);
}

function syncHeroBackground() {
  const image = view?.querySelector(".hero-media img");
  if (!image?.src) return;
  document.documentElement.style.setProperty("--kofferly-hero-image", `url("${image.src.replace(/"/g, "%22")}")`);
}

function syncTripThumbs() {
  for (const holder of view?.querySelectorAll("[data-trip-thumb]") || []) {
    const id = holder.dataset.tripThumb;
    const image = holder.querySelector("img");

    if (image?.src) tripThumbCache.set(id, image.src);
    const cached = tripThumbCache.get(id);
    if (!cached) continue;

    holder.style.setProperty("--kofferly-trip-thumb", `url("${cached.replace(/"/g, "%22")}")`);
    holder.classList.add("has-cached-image");
  }
}

function watchPackEditor() {
  const dialog = document.querySelector("#packItemEditDialog");
  if (!dialog || dialog.dataset.coachmarkWatch === "true") return;
  dialog.dataset.coachmarkWatch = "true";
  const observer = new MutationObserver(() => {
    if (dialog.open) markPackHintDone();
  });
  observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
}

document.addEventListener("click", event => {
  const toggle = event.target.closest("[data-completed-toggle]");
  if (!toggle) return;
  showCompletedPacking = !showCompletedPacking;
  syncPackingCompletedFilter();
});

let scheduled = false;
function refreshPolish() {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    maybeAddPackHint();
    syncPackingCompletedFilter();
    syncHeroBackground();
    syncTripThumbs();
    watchPackEditor();
  });
}

const observer = new MutationObserver(refreshPolish);
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener("pageshow", refreshPolish);
refreshPolish();
