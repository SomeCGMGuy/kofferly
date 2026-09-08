import { get, put } from "./db.js";

const view = document.querySelector("#view");
const STYLE_ID = "pack-item-editor-style";
const DIALOG_ID = "packItemEditDialog";

if (!document.querySelector(`#${STYLE_ID}`)) {
  const link = document.createElement("link");
  link.id = STYLE_ID;
  link.rel = "stylesheet";
  link.href = "./pack-item-editor.css";
  document.head.append(link);
}

const dialog = document.createElement("dialog");
dialog.id = DIALOG_ID;
dialog.className = "modal sheet-dialog pack-item-edit-dialog";
dialog.innerHTML = `
  <form id="packItemEditForm" class="modal-card">
    <div class="sheet-handle" aria-hidden="true"></div>
    <div class="modal-head">
      <div><p class="eyebrow">Packliste</p><h2>Eintrag bearbeiten</h2></div>
      <button class="icon-button" type="button" data-pack-edit-close aria-label="Schließen">×</button>
    </div>
    <input type="hidden" name="itemId" />
    <label>Bezeichnung<input name="name" required autocomplete="off" /></label>
    <div class="pack-edit-quantity-row">
      <label>Menge<input name="quantity" type="number" min="0" step="1" inputmode="numeric" /></label>
      <label>Einheit<input name="unit" autocomplete="off" placeholder="z. B. Stück" /></label>
    </div>
    <label>Notiz <span class="label-hint">optional</span><textarea name="note" rows="3" placeholder="z. B. Lieblingsshirt, im Handgepäck, noch kaufen …"></textarea></label>
    <label class="quick-important-row"><input type="checkbox" name="important" /><span>Als wichtig markieren</span></label>
    <p class="field-help" data-generated-hint hidden>Die automatische Empfehlung bleibt im Hintergrund erhalten. Deine manuelle Menge hat Vorrang, bis du sie wieder auf den berechneten Wert setzt.</p>
    <div class="modal-actions">
      <button type="button" class="button ghost" data-pack-edit-close>Abbrechen</button>
      <button type="submit" class="button primary">Speichern</button>
    </div>
  </form>
`;
document.body.append(dialog);

const form = dialog.querySelector("#packItemEditForm");
let currentItem = null;
let enhanceScheduled = false;

function isGenerated(item) {
  return item?.source === "generated" || Boolean(item?.key);
}

function effective(item, field) {
  const manualKey = `manual${field[0].toUpperCase()}${field.slice(1)}`;
  return Object.prototype.hasOwnProperty.call(item, manualKey) ? item[manualKey] : item[field];
}

function effectiveQuantityText(item) {
  const quantity = effective(item, "quantity");
  const unit = effective(item, "unit") || "";
  if (quantity == null || quantity === "") return "";
  return `${quantity} ${unit}`.trim();
}

function applyItemToRow(row, item) {
  if (!row || !item) return;

  const name = row.querySelector(".item-name");
  if (name) name.textContent = effective(item, "name") || item.name || "";

  const copy = row.querySelector(".item-copy");
  let note = copy?.querySelector(".item-note");
  const noteText = String(item.note || "").trim();
  if (noteText) {
    if (!note && copy) {
      note = document.createElement("span");
      note.className = "item-note";
      copy.append(note);
    }
    if (note) note.textContent = noteText;
  } else {
    note?.remove();
  }

  const actions = row.querySelector(".item-delete")?.parentElement;
  if (actions) {
    const text = effectiveQuantityText(item);
    let badge = actions.querySelector(".quantity-badge");
    if (text) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "quantity-badge";
        actions.prepend(badge);
      }
      badge.textContent = text;
    } else {
      badge?.remove();
    }

    const important = Boolean(effective(item, "important"));
    let importantBadge = actions.querySelector(".important-badge");
    if (important && !importantBadge) {
      importantBadge = document.createElement("span");
      importantBadge.className = "important-badge";
      importantBadge.textContent = "wichtig";
      actions.insertBefore(importantBadge, actions.querySelector(".item-delete"));
    } else if (!important) {
      importantBadge?.remove();
    }
  }
}

async function enhanceRow(row) {
  const checkbox = row.querySelector("[data-action='toggle-item'][data-id]");
  const id = checkbox?.dataset.id;
  if (!id || row.dataset.packEditReady === "true") return;

  row.dataset.packEditReady = "true";
  const deleteButton = row.querySelector(".item-delete[data-id]");
  if (deleteButton && !row.querySelector("[data-edit-pack-item]")) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "item-edit";
    button.dataset.editPackItem = id;
    button.setAttribute("aria-label", "Eintrag bearbeiten");
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Zm10-12 3 3"/></svg>`;
    deleteButton.before(button);
  }

  try {
    const item = await get("packItems", id);
    if (item && row.isConnected) applyItemToRow(row, item);
  } catch (error) {
    console.warn("Packeintrag konnte nicht für die Bearbeitung geladen werden.", error);
  }
}

function enhanceRows() {
  for (const row of view?.querySelectorAll(".pack-item") || []) enhanceRow(row);
}

function scheduleEnhance() {
  if (enhanceScheduled) return;
  enhanceScheduled = true;
  queueMicrotask(() => {
    enhanceScheduled = false;
    enhanceRows();
  });
}

async function openEditor(id) {
  const item = await get("packItems", id);
  if (!item) return;
  currentItem = item;

  form.elements.itemId.value = item.id;
  form.elements.name.value = effective(item, "name") ?? item.name ?? "";
  form.elements.quantity.value = effective(item, "quantity") ?? "";
  form.elements.unit.value = effective(item, "unit") ?? "";
  form.elements.note.value = item.note || "";
  form.elements.important.checked = Boolean(effective(item, "important"));
  form.querySelector("[data-generated-hint]").hidden = !isGenerated(item);
  dialog.showModal();
  setTimeout(() => form.elements.name.focus({ preventScroll: true }), 80);
}

function clearManual(row, key) {
  if (Object.prototype.hasOwnProperty.call(row, key)) delete row[key];
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!currentItem) return;

  const data = new FormData(form);
  const row = await get("packItems", currentItem.id);
  if (!row) return;

  const name = String(data.get("name") || "").trim();
  const quantityRaw = String(data.get("quantity") || "").trim();
  const quantity = quantityRaw === "" ? "" : Number(quantityRaw);
  const unit = String(data.get("unit") || "").trim();
  const note = String(data.get("note") || "").trim();
  const important = data.get("important") === "on";

  if (isGenerated(row)) {
    if (name && name !== row.name) row.manualName = name; else clearManual(row, "manualName");
    if (quantityRaw !== "" && quantity !== Number(row.quantity)) row.manualQuantity = quantity; else clearManual(row, "manualQuantity");
    if (unit !== String(row.unit || "")) row.manualUnit = unit; else clearManual(row, "manualUnit");
    if (important !== Boolean(row.important)) row.manualImportant = important; else clearManual(row, "manualImportant");
  } else {
    row.name = name;
    row.quantity = quantityRaw === "" ? "" : quantity;
    row.unit = unit;
    row.important = important;
  }
  row.note = note;
  row.updatedAt = new Date().toISOString();

  await put("packItems", row);
  currentItem = row;
  const rendered = view?.querySelector(`[data-action='toggle-item'][data-id='${CSS.escape(row.id)}']`)?.closest(".pack-item");
  applyItemToRow(rendered, row);
  dialog.close("saved");
});

document.addEventListener("click", event => {
  const edit = event.target.closest("[data-edit-pack-item]");
  if (edit) {
    event.preventDefault();
    event.stopPropagation();
    openEditor(edit.dataset.editPackItem).catch(console.error);
    return;
  }
  if (event.target.closest("[data-pack-edit-close]")) dialog.close("cancel");
});

const observer = new MutationObserver(scheduleEnhance);
if (view) observer.observe(view, { childList: true, subtree: true });
scheduleEnhance();
