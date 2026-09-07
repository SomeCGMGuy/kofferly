const appShell = document.querySelector("#app");
const dialogs = [...document.querySelectorAll("dialog.modal:not(#notificationDialog)")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const CLOSE_MS = 230;

function syncBodyState() {
  const open = dialogs.some(dialog => dialog.open && !dialog.classList.contains("is-closing"));
  document.body.classList.toggle("has-push-dialog", open);
  appShell?.setAttribute("aria-hidden", open ? "true" : "false");
}

function enterDialog(dialog) {
  if (!dialog || dialog.dataset.pushReady === "true") return;
  dialog.dataset.pushReady = "true";
  dialog.classList.add("push-dialog", "is-entering");
  syncBodyState();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      dialog.classList.remove("is-entering");
      dialog.classList.add("is-active");
    });
  });
}

function finishClose(dialog, returnValue = "") {
  dialog.classList.remove("is-active", "is-closing", "push-dialog");
  dialog.dataset.pushReady = "false";
  dialog.__nativeClose(returnValue);
  syncBodyState();
}

function closeDialog(dialog, returnValue = "") {
  if (!dialog?.open || dialog.classList.contains("is-closing")) return;

  if (reduceMotion.matches) {
    finishClose(dialog, returnValue);
    return;
  }

  dialog.classList.remove("is-active");
  dialog.classList.add("is-closing");
  document.body.classList.add("push-dialog-leaving");

  window.setTimeout(() => {
    document.body.classList.remove("push-dialog-leaving");
    finishClose(dialog, returnValue);
  }, CLOSE_MS);
}

for (const dialog of dialogs) {
  const nativeShowModal = dialog.showModal.bind(dialog);
  const nativeClose = dialog.close.bind(dialog);
  dialog.__nativeClose = nativeClose;

  dialog.showModal = () => {
    nativeShowModal();
    enterDialog(dialog);
  };

  dialog.close = (returnValue = "") => closeDialog(dialog, returnValue);

  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    closeDialog(dialog, "cancel");
  });

  dialog.addEventListener("close", () => {
    dialog.classList.remove("is-active", "is-entering", "is-closing", "push-dialog");
    dialog.dataset.pushReady = "false";
    syncBodyState();
  });
}

document.addEventListener("click", event => {
  const dialogButton = event.target.closest("dialog form[method='dialog'] button[value]");
  if (!dialogButton) return;

  const dialog = dialogButton.closest("dialog");
  const form = dialogButton.closest("form");
  if (!dialog || !form) return;

  const isTripSubmit = form.id === "tripForm" && dialogButton.id === "saveTripButton";
  if (isTripSubmit) return;

  event.preventDefault();
  closeDialog(dialog, dialogButton.value || "");
}, true);

for (const dialog of dialogs) {
  dialog.addEventListener("pointerdown", event => {
    if (event.target !== dialog) return;
    dialog.dataset.backdropPointer = "true";
  });

  dialog.addEventListener("pointerup", event => {
    if (event.target === dialog && dialog.dataset.backdropPointer === "true") {
      closeDialog(dialog, "cancel");
    }
    delete dialog.dataset.backdropPointer;
  });
}
