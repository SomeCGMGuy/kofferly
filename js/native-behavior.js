const view = document.querySelector("#view");
const bottomNav = document.querySelector(".bottom-nav");
const dialogs = [...document.querySelectorAll("dialog")];
const initialViewportHeight = window.visualViewport?.height || window.innerHeight;

let keyboardOpen = false;
let internalHistoryClose = false;
let dialogOpener = null;
let activeDialogId = null;

function currentRoute() {
  return document.querySelector(".nav-item.active")?.dataset.route || "home";
}

function routeButton(route) {
  return document.querySelector(`.nav-item[data-route="${CSS.escape(route)}"]`)
    || document.querySelector(`[data-route="${CSS.escape(route)}"]`);
}

function isTextEntry(element) {
  return element instanceof HTMLInputElement
    || element instanceof HTMLTextAreaElement
    || element?.isContentEditable;
}

function isUsableField(element) {
  return element
    && !element.disabled
    && element.tabIndex !== -1
    && !element.matches("[type='hidden'],.android-native-select-source");
}

function focusFirstField(dialog) {
  if (!dialog?.open) return;
  const alreadyFocused = dialog.contains(document.activeElement) && isUsableField(document.activeElement);
  if (alreadyFocused) return;

  const preferred = dialog.querySelector("[autofocus]")
    || [...dialog.querySelectorAll("input,textarea,button,[data-android-select-button]")].find(isUsableField);
  preferred?.focus({ preventScroll: true });
}

function scrollFocusedFieldIntoView() {
  const active = document.activeElement;
  if (!isTextEntry(active) || !keyboardOpen) return;
  requestAnimationFrame(() => active.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" }));
}

function updateKeyboardState() {
  const viewport = window.visualViewport;
  const active = document.activeElement;
  const viewportHeight = viewport?.height || window.innerHeight;
  const reducedBy = Math.max(0, initialViewportHeight - viewportHeight);
  const next = isTextEntry(active) && reducedBy > 120;

  if (next === keyboardOpen) {
    if (next) scrollFocusedFieldIntoView();
    return;
  }

  keyboardOpen = next;
  document.body.classList.toggle("keyboard-open", keyboardOpen);
  bottomNav?.setAttribute("aria-hidden", keyboardOpen ? "true" : "false");
  document.documentElement.style.setProperty("--visual-viewport-height", `${Math.round(viewportHeight)}px`);
  if (keyboardOpen) scrollFocusedFieldIntoView();
}

function dialogHistoryState(dialog) {
  return { ...(history.state || {}), kofferlyDialog: dialog.id, route: currentRoute() };
}

function patchDialogHistory(dialog) {
  if (!dialog?.id || dialog.dataset.nativeHistoryReady === "true") return;
  dialog.dataset.nativeHistoryReady = "true";

  const showModal = dialog.showModal.bind(dialog);
  const close = dialog.close.bind(dialog);

  dialog.showModal = (...args) => {
    if (!dialog.open) {
      dialogOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      activeDialogId = dialog.id;
      history.pushState(dialogHistoryState(dialog), "");
    }
    const result = showModal(...args);
    setTimeout(() => focusFirstField(dialog), 70);
    return result;
  };

  dialog.close = (...args) => {
    const hadHistoryEntry = history.state?.kofferlyDialog === dialog.id;
    const result = close(...args);
    activeDialogId = null;
    document.body.classList.remove("keyboard-open");
    keyboardOpen = false;
    bottomNav?.removeAttribute("aria-hidden");

    if (hadHistoryEntry && !internalHistoryClose) {
      internalHistoryClose = true;
      history.back();
      setTimeout(() => { internalHistoryClose = false; }, 0);
    }

    setTimeout(() => {
      if (dialogOpener?.isConnected) dialogOpener.focus({ preventScroll: true });
      dialogOpener = null;
    }, 80);
    return result;
  };
}

function syncInitialHistory() {
  const state = history.state || {};
  if (!state.kofferlyRoot) {
    history.replaceState({ ...state, kofferlyRoot: true, route: currentRoute() }, "");
  }
}

function pushRouteHistory(route) {
  const current = currentRoute();
  if (!route || route === current || history.state?.route === route) return;
  history.pushState({ kofferlyRoot: true, route }, "");
}

syncInitialHistory();
dialogs.forEach(patchDialogHistory);

const dialogObserver = new MutationObserver(() => {
  document.querySelectorAll("dialog").forEach(patchDialogHistory);
});
dialogObserver.observe(document.body, { childList: true, subtree: true });

document.addEventListener("click", event => {
  const routeTarget = event.target.closest("[data-route]");
  if (routeTarget && !routeTarget.closest("dialog")) pushRouteHistory(routeTarget.dataset.route);
}, true);

document.addEventListener("focusin", event => {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    if (target.type === "search") target.enterKeyHint = "search";
    else if (["text", "email", "url", "tel", "number"].includes(target.type)) target.enterKeyHint = "next";
  }
  setTimeout(updateKeyboardState, 40);
});

document.addEventListener("focusout", () => setTimeout(updateKeyboardState, 90));
window.visualViewport?.addEventListener("resize", updateKeyboardState);
window.visualViewport?.addEventListener("scroll", updateKeyboardState);

// Android-style keyboard action: Search closes the keyboard; Enter on a simple
// single-line field advances to the next editable field instead of inserting noise.
document.addEventListener("keydown", event => {
  if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type === "date" || target.type === "checkbox") return;

  if (target.type === "search") {
    target.blur();
    return;
  }

  const scope = target.closest("form,dialog") || document;
  const fields = [...scope.querySelectorAll("input,textarea,[data-android-select-button],button[type='submit']")]
    .filter(isUsableField);
  const index = fields.indexOf(target);
  const next = fields.slice(index + 1).find(field => !field.matches("button:not([type='submit'])"));
  if (next && !(next instanceof HTMLTextAreaElement)) {
    event.preventDefault();
    next.focus({ preventScroll: true });
    next.scrollIntoView({ block: "center", behavior: "smooth" });
  }
});

window.addEventListener("popstate", event => {
  const openDialog = dialogs.find(dialog => dialog.open) || document.querySelector("dialog[open]");
  if (openDialog) {
    internalHistoryClose = true;
    openDialog.close("back");
    setTimeout(() => { internalHistoryClose = false; }, 0);
    return;
  }

  const route = event.state?.route;
  if (route && route !== currentRoute()) {
    routeButton(route)?.click();
  }
});
