/**
 * Eigene Hero-Fotos für importierte Inhaltsseiten, deren ICONY-Bild nicht zur Zielgruppe passt
 * (FAQ und Bewertungen zeigten Frauen). Die Dateien in public/pages sind 4:5-Ausschnitte (800×1000 WebP)
 * aus den Titelbildern des eigenen Magazins (public/magazine/media), also bereits für er-sucht-ihn.de lizenziert.
 * Schlüssel sind die öffentlichen Pfade (Bewertungen liegen unter /ueber-uns/). `replaces` entfernt das ersetzte Importbild aus Bildliste und Text.
 */
export const PAGE_PHOTOS = Object.freeze({
  "/faq": {
    file: "/pages/faq.webp",
    alt: "Junger Mann mit Brille überlegt und macht sich Notizen – Fragen zu Er-sucht-Ihn.de",
    source: "/magazine/media/1729-ist-er-schwul-merkmale-und-verhaltensweisen-eines-gays.jpg",
    replaces: "faq-(1).jpg",
  },
  "/ueber-uns/bewertungen": {
    file: "/pages/bewertungen.webp",
    alt: "Zwei lächelnde Männer Arm in Arm – Bewertungen und Erfahrungen zu Er-sucht-Ihn.de",
    source: "/magazine/media/1965-schwarzer-und-weisser-maenner-paar-compr.png",
    replaces: "bewertung-und-erfahrungen-pic.jpg",
  },
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Stellt das eigene Foto an den Anfang der Bildliste und entfernt das ersetzte Importbild aus Liste und Text. */
export function withPagePhoto(page, toAssetUrl = (path) => path) {
  const photo = PAGE_PHOTOS[page.path.replace(/\/+$/, "")];
  if (!photo) return page;
  const marker = escapeRegExp(photo.replaces);
  const images = page.images.filter((image) => !image.src.includes(photo.replaces));
  const contentHtml = page.contentHtml.replace(new RegExp(`<p>\\s*<img\\b[^>]*${marker}[^>]*>\\s*</p>|<img\\b[^>]*${marker}[^>]*>`, "g"), "");
  return { ...page, contentHtml, images: [{ src: toAssetUrl(photo.file), alt: photo.alt }, ...images] };
}
