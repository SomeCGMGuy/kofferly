import { getAll, openDb } from "./db.js";

const view = document.querySelector("#view");
const STORE_NAMES = ["trips", "packItems", "images", "weather", "settings"];
const BACKUP_FORMAT = "kofferly-backup";
const BACKUP_VERSION = 1;

function fileToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [meta, data] = String(dataUrl).split(",");
  const mime = /data:([^;]+)/.exec(meta)?.[1] || "application/octet-stream";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function buildBackup() {
  const stores = {};
  for (const name of STORE_NAMES) stores[name] = await getAll(name);

  stores.images = await Promise.all(stores.images.map(async row => {
    if (!(row.blob instanceof Blob)) return row;
    const { blob, ...rest } = row;
    return { ...rest, blobDataUrl: await fileToDataUrl(blob) };
  }));

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    stores
  };
}

function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `kofferly-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function validateBackup(data) {
  if (!data || data.format !== BACKUP_FORMAT || data.version !== BACKUP_VERSION || !data.stores) {
    throw new Error("Das ist keine gültige Kofferly-Backup-Datei.");
  }
  for (const name of STORE_NAMES) {
    if (!Array.isArray(data.stores[name])) throw new Error(`Backup-Bereich ${name} fehlt oder ist beschädigt.`);
  }
}

async function replaceDatabase(data) {
  const db = await openDb();
  const tx = db.transaction(STORE_NAMES, "readwrite");

  for (const name of STORE_NAMES) tx.objectStore(name).clear();

  for (const name of STORE_NAMES) {
    for (const original of data.stores[name]) {
      const row = { ...original };
      if (name === "images" && row.blobDataUrl) {
        row.blob = dataUrlToBlob(row.blobDataUrl);
        delete row.blobDataUrl;
      }
      tx.objectStore(name).put(row);
    }
  }

  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Restore wurde abgebrochen."));
  });
}

function setStatus(message, state = "") {
  const status = document.querySelector("#backupStatus");
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
}

function askRestoreConfirmation() {
  const dialog = document.querySelector("#confirmDialog");
  if (!dialog) return Promise.resolve(false);
  const title = dialog.querySelector("#confirmTitle");
  const text = dialog.querySelector("#confirmText");
  const confirmButton = dialog.querySelector("button[value='confirm']");
  const previousLabel = confirmButton?.textContent || "Löschen";

  title.textContent = "Backup wiederherstellen?";
  text.textContent = "Der aktuelle lokale Kofferly-Datenbestand wird durch den Inhalt des Backups ersetzt.";
  if (confirmButton) confirmButton.textContent = "Wiederherstellen";
  dialog.showModal();

  return new Promise(resolve => {
    const handler = () => {
      dialog.removeEventListener("close", handler);
      if (confirmButton) confirmButton.textContent = previousLabel;
      resolve(dialog.returnValue === "confirm");
    };
    dialog.addEventListener("close", handler);
  });
}

async function exportBackup(button) {
  try {
    button.disabled = true;
    setStatus("Backup wird erstellt …");
    downloadJson(await buildBackup());
    setStatus("Backup wurde erstellt.", "success");
  } catch (error) {
    console.error(error);
    setStatus("Backup konnte nicht erstellt werden.", "error");
  } finally {
    button.disabled = false;
  }
}

async function restoreBackup(file, button) {
  try {
    button.disabled = true;
    setStatus("Backup wird geprüft …");
    const data = JSON.parse(await file.text());
    validateBackup(data);
    const confirmed = await askRestoreConfirmation();
    if (!confirmed) {
      setStatus("Wiederherstellung abgebrochen.");
      return;
    }
    setStatus("Daten werden wiederhergestellt …");
    await replaceDatabase(data);
    setStatus("Wiederherstellung abgeschlossen. Kofferly wird neu geladen.", "success");
    setTimeout(() => location.reload(), 350);
  } catch (error) {
    console.error(error);
    setStatus(error?.message || "Backup konnte nicht wiederhergestellt werden.", "error");
  } finally {
    button.disabled = false;
  }
}

function injectBackupCard() {
  if (!view || view.querySelector("#backupCard")) return;
  const heading = [...view.querySelectorAll("h1")].find(el => el.textContent.trim() === "Einstellungen");
  if (!heading) return;
  const grid = view.querySelector(".settings-grid");
  if (!grid) return;

  const card = document.createElement("section");
  card.id = "backupCard";
  card.className = "info-card card backup-card";
  card.innerHTML = `
    <p class="eyebrow">Sicherung</p>
    <h2>Backup & Wiederherstellung</h2>
    <p class="muted">Exportiert Reisen, Packlisten, Einstellungen, Wetterdaten und gespeicherte Reisezielbilder in eine lokale Kofferly-Datei.</p>
    <div class="backup-actions">
      <button class="button secondary" type="button" data-backup-export>Backup erstellen</button>
      <button class="button ghost" type="button" data-backup-restore>Backup wiederherstellen</button>
      <input id="backupFileInput" class="backup-file-input" type="file" accept="application/json,.json" />
    </div>
    <p id="backupStatus" class="backup-status" aria-live="polite"></p>
  `;
  grid.prepend(card);
}

const observer = new MutationObserver(injectBackupCard);
observer.observe(view, { childList: true, subtree: true });
injectBackupCard();

document.addEventListener("click", event => {
  const exportButton = event.target.closest("[data-backup-export]");
  if (exportButton) exportBackup(exportButton);

  const restoreButton = event.target.closest("[data-backup-restore]");
  if (restoreButton) document.querySelector("#backupFileInput")?.click();
});

document.addEventListener("change", event => {
  if (event.target.id !== "backupFileInput") return;
  const file = event.target.files?.[0];
  if (!file) return;
  const button = document.querySelector("[data-backup-restore]");
  restoreBackup(file, button);
  event.target.value = "";
});
