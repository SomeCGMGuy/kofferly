import "./mobile-polish.js";

const REFRESH_PARAM = "kofferly-refresh";
const APP_CACHE_PREFIX = "kofferly-shell-";

const initialUrl = new URL(location.href);
if (initialUrl.searchParams.has(REFRESH_PARAM)) {
  finishForcedReload(initialUrl);
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-reload-app]");
  if (!button) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  forceFreshReload(button);
}, true);

async function forceFreshReload(button = null) {
  const originalLabel = button?.textContent;
  if (button) {
    if (button.disabled) return;
    button.disabled = true;
    button.textContent = "Aktualisiere …";
  }

  if (!navigator.onLine) {
    if (button) {
      button.disabled = false;
      button.textContent = "Offline";
      setTimeout(() => { button.textContent = originalLabel; }, 1600);
    }
    return;
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys
        .filter(key => key.startsWith(APP_CACHE_PREFIX))
        .map(key => caches.delete(key)));
    }

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }

    const nextUrl = new URL(location.href);
    nextUrl.searchParams.set(REFRESH_PARAM, Date.now().toString());
    location.replace(nextUrl.href);
  } catch (error) {
    console.warn("Kofferly hard refresh failed.", error);
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
    location.reload();
  }
}

async function finishForcedReload(url) {
  try {
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      const registration = await navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
      try { await registration.update(); } catch (error) { console.warn("Service worker update failed.", error); }
      await waitForController();
    }
  } finally {
    url.searchParams.delete(REFRESH_PARAM);
    location.replace(url.href);
  }
}

async function waitForController() {
  if (navigator.serviceWorker.controller) return;

  await Promise.race([
    new Promise(resolve => {
      navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
    }),
    new Promise(resolve => setTimeout(resolve, 3000))
  ]);
}
