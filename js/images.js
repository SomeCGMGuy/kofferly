import { get, put } from "./db.js";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

function stripHtml(value = "") {
  const div = document.createElement("div");
  div.innerHTML = value;
  return div.textContent?.trim() || "";
}

async function searchCommons(query) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime",
    iiurlwidth: "1600"
  });

  const res = await fetch(`${COMMONS_API}?${params}`);
  if (!res.ok) throw new Error("Bildsuche fehlgeschlagen");
  const json = await res.json();
  return Object.values(json.query?.pages || {});
}

function rankImage(page, destination) {
  const info = page.imageinfo?.[0];
  if (!info?.thumburl && !info?.url) return -999;
  const mime = info.mime || "";
  if (!mime.startsWith("image/") || mime.includes("svg")) return -999;

  const title = (page.title || "").toLowerCase();
  const dest = destination.toLowerCase();
  let score = 0;
  if (title.includes(dest)) score += 5;
  if (/landscape|panorama|mountain|lake|coast|sea|beach|cityscape|valley|travel/.test(title)) score += 3;
  if (/map|logo|flag|coat of arms|diagram|portrait|sign/.test(title)) score -= 5;
  return score + Math.random();
}

async function fetchBestImage(destination) {
  const searches = [
    `${destination} landscape travel`,
    `${destination} panorama`,
    `${destination}`
  ];

  for (const q of searches) {
    const pages = await searchCommons(q);
    const candidates = pages
      .map(p => ({ page: p, score: rankImage(p, destination) }))
      .filter(x => x.score > -100)
      .sort((a, b) => b.score - a.score);

    if (candidates.length) return candidates[0].page;
  }
  throw new Error("Kein passendes Bild gefunden");
}

async function downscaleToBlob(sourceBlob, maxWidth = 1600, quality = 0.84) {
  const bitmap = await createImageBitmap(sourceBlob);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function refreshDestinationImage(tripId, destination) {
  const page = await fetchBestImage(destination);
  const info = page.imageinfo?.[0];
  const imageUrl = info.thumburl || info.url;
  const response = await fetch(imageUrl, { mode: "cors" });
  if (!response.ok) throw new Error("Bild konnte nicht geladen werden");

  const rawBlob = await response.blob();
  const blob = await downscaleToBlob(rawBlob);
  const meta = info.extmetadata || {};

  const row = {
    tripId,
    blob,
    title: stripHtml(meta.ObjectName?.value || page.title?.replace(/^File:/, "") || ""),
    author: stripHtml(meta.Artist?.value || ""),
    license: stripHtml(meta.LicenseShortName?.value || ""),
    licenseUrl: meta.LicenseUrl?.value || "",
    sourceUrl: info.descriptionurl || "",
    fetchedAt: new Date().toISOString()
  };

  await put("images", row);
  return row;
}

export async function getDestinationImage(tripId) {
  return get("images", tripId);
}

export function imageObjectUrl(imageRow) {
  return imageRow?.blob ? URL.createObjectURL(imageRow.blob) : null;
}
