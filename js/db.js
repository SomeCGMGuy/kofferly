const DB_NAME = "kofferly";
const DB_VERSION = 3;

export function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains("trips")) {
        const store = db.createObjectStore("trips", { keyPath: "id" });
        store.createIndex("date", "date");
      }

      if (!db.objectStoreNames.contains("packItems")) {
        const store = db.createObjectStore("packItems", { keyPath: "id" });
        store.createIndex("tripId", "tripId");
      }

      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "tripId" });
      }

      if (!db.objectStoreNames.contains("weather")) {
        db.createObjectStore("weather", { keyPath: "tripId" });
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(storeName, mode, cb) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result;
    try {
      result = cb(store);
    } catch (err) {
      reject(err);
      return;
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function put(storeName, value) {
  return withStore(storeName, "readwrite", store => request(store.put(value)));
}

export async function get(storeName, key) {
  const db = await openDb();
  const tx = db.transaction(storeName, "readonly");
  return request(tx.objectStore(storeName).get(key));
}

export async function getAll(storeName) {
  const db = await openDb();
  const tx = db.transaction(storeName, "readonly");
  return request(tx.objectStore(storeName).getAll());
}

export async function getByIndex(storeName, indexName, key) {
  const db = await openDb();
  const tx = db.transaction(storeName, "readonly");
  return request(tx.objectStore(storeName).index(indexName).getAll(key));
}

export async function del(storeName, key) {
  return withStore(storeName, "readwrite", store => request(store.delete(key)));
}

export async function clearTripData(tripId) {
  const db = await openDb();
  const tx = db.transaction(["trips", "packItems", "images", "weather"], "readwrite");
  tx.objectStore("trips").delete(tripId);
  tx.objectStore("images").delete(tripId);
  tx.objectStore("weather").delete(tripId);

  const idx = tx.objectStore("packItems").index("tripId");
  const req = idx.openCursor(IDBKeyRange.only(tripId));
  req.onsuccess = () => {
    const cursor = req.result;
    if (!cursor) return;
    cursor.delete();
    cursor.continue();
  };

  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSetting(key, fallback = null) {
  const row = await get("settings", key);
  return row?.value ?? fallback;
}

export async function setSetting(key, value) {
  return put("settings", { key, value });
}
