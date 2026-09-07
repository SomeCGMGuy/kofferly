const choiceDialog = document.querySelector("#choiceSheetDialog");
const choiceTitle = document.querySelector("#choiceSheetTitle");
const choiceOptions = document.querySelector("#choiceSheetOptions");
const sheetDialogs = [...document.querySelectorAll("dialog.sheet-dialog")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let activeSelect = null;

const esc = (value = "") => String(value).replace(/[&<>"']/g, ch => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[ch]));

function fieldTitle(select) {
  return select.dataset.androidSelect
    || select.getAttribute("aria-label")
    || select.closest("label")?.childNodes?.[0]?.textContent?.trim()
    || "Auswählen";
}

function selectedLabel(select) {
  return select.selectedOptions?.[0]?.textContent?.trim() || "Auswählen";
}

function syncSelectButton(select) {
  const button = select.nextElementSibling?.matches("[data-android-select-button]")
    ? select.nextElementSibling
    : null;
  if (!button) return;
  button.querySelector("span").textContent = selectedLabel(select);
}

function enhanceSelect(select) {
  if (select.dataset.androidEnhanced === "true" || select.multiple || select.size > 1) return;
  select.dataset.androidEnhanced = "true";
  select.classList.add("android-native-select-source");

  const button = document.createElement("button");
  button.type = "button";
  button.className = "android-select-field";
  button.dataset.androidSelectButton = "";
  button.setAttribute("aria-haspopup", "dialog");
  button.innerHTML = `<span>${esc(selectedLabel(select))}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>`;
  select.insertAdjacentElement("afterend", button);
}

function enhanceSelects(root = document) {
  root.querySelectorAll?.("select").forEach(enhanceSelect);
}

function renderChoices(select) {
  choiceTitle.textContent = fieldTitle(select);
  choiceOptions.innerHTML = [...select.options].map(option => `
    <button type="button" class="choice-option ${option.selected ? "selected" : ""}" data-choice-value="${esc(option.value)}" ${option.disabled ? "disabled" : ""}>
      <span>${esc(option.textContent.trim())}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>
    </button>
  `).join("");
}

function openChoiceSheet(select) {
  activeSelect = select;
  renderChoices(select);
  choiceDialog.showModal();
}

function prepareSheet(dialog) {
  if (dialog.dataset.sheetReady === "true") return;
  dialog.dataset.sheetReady = "true";
  const nativeShow = dialog.showModal.bind(dialog);
  const nativeClose = dialog.close.bind(dialog);

  dialog.showModal = () => {
    nativeShow();
    requestAnimationFrame(() => requestAnimationFrame(() => dialog.classList.add("is-active")));
  };

  dialog.close = (value = "") => {
    if (!dialog.open || dialog.classList.contains("is-closing")) return;
    if (reduceMotion.matches) {
      dialog.classList.remove("is-active", "is-closing");
      nativeClose(value);
      return;
    }
    dialog.classList.remove("is-active");
    dialog.classList.add("is-closing");
    setTimeout(() => {
      dialog.classList.remove("is-closing");
      nativeClose(value);
    }, 210);
  };

  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    dialog.close("cancel");
  });

  dialog.addEventListener("pointerdown", event => {
    if (event.target === dialog) dialog.dataset.backdropPointer = "true";
  });
  dialog.addEventListener("pointerup", event => {
    if (event.target === dialog && dialog.dataset.backdropPointer === "true") dialog.close("cancel");
    delete dialog.dataset.backdropPointer;
  });
}

sheetDialogs.forEach(prepareSheet);
enhanceSelects();

const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach(node => {
      if (!(node instanceof Element)) return;
      if (node.matches("select")) enhanceSelect(node);
      enhanceSelects(node);
    });
  }
});
observer.observe(document.body, { childList: true, subtree: true });

document.addEventListener("click", event => {
  const field = event.target.closest("[data-android-select-button]");
  if (field) {
    const select = field.previousElementSibling;
    if (select?.matches("select")) openChoiceSheet(select);
    return;
  }

  const option = event.target.closest("[data-choice-value]");
  if (option && activeSelect) {
    activeSelect.value = option.dataset.choiceValue;
    activeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    syncSelectButton(activeSelect);
    choiceDialog.close("selected");
    activeSelect = null;
    return;
  }

  if (event.target.closest("[data-choice-close]")) {
    choiceDialog.close("cancel");
    activeSelect = null;
  }
});

document.addEventListener("change", event => {
  if (event.target.matches("select[data-android-enhanced='true']")) syncSelectButton(event.target);
});
