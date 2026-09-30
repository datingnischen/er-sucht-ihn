/**
 * Kein Bild ohne Alt-Text: Importierte Bilder ohne oder mit leerem alt bekommen den Seitentitel
 * als Beschreibung. Gilt für ICONY-Seiten und Magazininhalte (tests/image-alt.test.mjs).
 */
function escapeAttribute(value) {
  return value.replace(/&(?!#?\w+;)/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function ensureImageAlts(html = "", fallback = "") {
  const alt = escapeAttribute(fallback.trim() || "Bild auf Er-sucht-Ihn.de");
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\salt\s*=\s*(["'])\s*\1/i.test(tag)) return tag.replace(/\salt\s*=\s*(["'])\s*\1/i, ` alt="${alt}"`);
    if (/\salt\s*=/i.test(tag)) return tag;
    return tag.replace(/^<img\b/i, `<img alt="${alt}"`);
  });
}

/** Wendet ensureImageAlts auf contentHtml und die Bildliste eines Eintrags an. */
export function withImageAlts(entry, fallback) {
  return {
    ...entry,
    contentHtml: ensureImageAlts(entry.contentHtml, fallback),
    ...(Array.isArray(entry.images) ? { images: entry.images.map((image) => ({ ...image, alt: image.alt?.trim() || fallback })) } : {}),
  };
}
