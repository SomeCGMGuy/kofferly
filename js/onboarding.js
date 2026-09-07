const overlay = document.querySelector("#onboardingShell");
const slides = [...document.querySelectorAll("[data-onboarding-slide]")];
const dots = [...document.querySelectorAll("[data-onboarding-dot]")];
const nextButton = document.querySelector("[data-onboarding-next]");
const backButton = document.querySelector("[data-onboarding-back]");
const skipButton = document.querySelector("[data-onboarding-skip]");
const DONE_KEY = "kofferly:onboarding:v1";
let step = 0;
let startX = null;
let startY = null;
let closingHistory = false;

function completed() {
  return localStorage.getItem(DONE_KEY) === "done";
}

function clarifyHostingCopy() {
  const welcome = slides[0];
  if (!welcome) return;
  const body = welcome.querySelector(".onboarding-copy > p:not(.eyebrow)");
  const chips = [...welcome.querySelectorAll(".onboarding-chip")];
  if (body) body.textContent = "Kofferly läuft als Web-App über GitHub Pages. Deine Reisen und Packlisten werden direkt auf deinem Gerät gespeichert – ohne Konto.";
  if (chips[0]) chips[0].textContent = "GitHub Pages";
  if (chips[1]) chips[1].textContent = "Ohne Konto";
  if (chips[2]) chips[2].textContent = "Daten lokal";
}

function renderStep() {
  slides.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === step);
    slide.classList.toggle("is-before", index < step);
    slide.setAttribute("aria-hidden", index === step ? "false" : "true");
  });
  dots.forEach((dot, index) => dot.classList.toggle("is-active", index === step));
  backButton?.classList.toggle("is-visible", step > 0);
  if (nextButton) nextButton.textContent = step === slides.length - 1 ? "Los geht’s" : "Weiter";
}

function guardHistory() {
  if (history.state?.kofferlyOnboarding) return;
  history.pushState({ ...(history.state || {}), kofferlyOnboarding: true }, "");
}

function openOnboarding({ replay = false } = {}) {
  if (!overlay || (!replay && completed())) return;
  step = 0;
  renderStep();
  overlay.hidden = false;
  document.body.classList.add("onboarding-open");
  overlay.setAttribute("aria-hidden", "false");
  guardHistory();
  setTimeout(() => nextButton?.focus({ preventScroll: true }), 60);
}

function hideOnboarding() {
  localStorage.setItem(DONE_KEY, "done");
  overlay.hidden = true;
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("onboarding-open");
  window.dispatchEvent(new CustomEvent("kofferly:onboarding-complete"));
}

function finishOnboarding() {
  if (!overlay || overlay.hidden) return;
  hideOnboarding();
  if (history.state?.kofferlyOnboarding) {
    closingHistory = true;
    history.back();
  }
}

function nextStep() {
  if (step >= slides.length - 1) return finishOnboarding();
  step += 1;
  renderStep();
}

function previousStep() {
  if (step <= 0) return;
  step -= 1;
  renderStep();
}

function addSettingsReplay() {
  const heading = document.querySelector("#view .section-head h1");
  if (heading?.textContent?.trim() !== "Einstellungen") return;
  const grid = document.querySelector("#view .settings-grid");
  if (!grid || grid.querySelector("[data-onboarding-replay-card]")) return;

  const card = document.createElement("section");
  card.className = "setting-row card";
  card.dataset.onboardingReplayCard = "";
  card.innerHTML = `
    <div class="onboarding-setting-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M4 19h16M6 17V7l6-4 6 4v10M9 11h6M9 14h4"/></svg>
    </div>
    <div>
      <h3>Einführung</h3>
      <p class="muted">Zeigt die wichtigsten Funktionen von Kofferly noch einmal.</p>
    </div>
    <button class="button secondary" type="button" data-replay-onboarding>Ansehen</button>
  `;
  grid.append(card);
}

const view = document.querySelector("#view");
let settingsScheduled = false;
const observer = new MutationObserver(() => {
  if (settingsScheduled) return;
  settingsScheduled = true;
  queueMicrotask(() => {
    settingsScheduled = false;
    addSettingsReplay();
  });
});
if (view) observer.observe(view, { childList: true, subtree: true });

nextButton?.addEventListener("click", nextStep);
backButton?.addEventListener("click", previousStep);
skipButton?.addEventListener("click", finishOnboarding);
dots.forEach((dot, index) => dot.addEventListener("click", () => { step = index; renderStep(); }));

document.addEventListener("click", event => {
  if (event.target.closest("[data-replay-onboarding]")) openOnboarding({ replay: true });
});

document.addEventListener("keydown", event => {
  if (overlay?.hidden) return;
  if (event.key === "ArrowRight") { event.preventDefault(); nextStep(); }
  if (event.key === "ArrowLeft") { event.preventDefault(); previousStep(); }
  if (event.key === "Escape") {
    event.preventDefault();
    if (step > 0) previousStep();
    else finishOnboarding();
  }
});

window.addEventListener("popstate", event => {
  if (closingHistory) {
    closingHistory = false;
    event.stopImmediatePropagation();
    return;
  }
  if (!overlay || overlay.hidden) return;
  event.stopImmediatePropagation();
  if (step > 0) {
    step -= 1;
    renderStep();
    guardHistory();
  } else {
    hideOnboarding();
  }
});

overlay?.addEventListener("pointerdown", event => {
  startX = event.clientX;
  startY = event.clientY;
});
overlay?.addEventListener("pointerup", event => {
  if (startX == null || startY == null) return;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  startX = null;
  startY = null;
  if (Math.abs(dx) < 52 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
  if (dx < 0) nextStep();
  else previousStep();
});

clarifyHostingCopy();
renderStep();
addSettingsReplay();
requestAnimationFrame(() => openOnboarding());
