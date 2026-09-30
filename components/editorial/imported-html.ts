/**
 * Präsentationshilfen für importierte ICONY-Texte (Lexikon, Bewertungen).
 * Der Wortlaut bleibt unangetastet – entfernt werden nur Wrapper-<div>s, leere Absätze
 * und leere Überschriften; danach wird an <h2> in Kapitel zerlegt.
 */

const BLANK = String.raw`(?:\s|&nbsp;| |<br\s*\/?>)*`;
const BLOCK = "p|h[1-6]|ul|ol|blockquote|figure|table|hr|small";

export type HtmlSection = { id: string; title: string; titleHtml: string; html: string };

export function stripTags(html = "") {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Entfernt Wrapper-<div>s, leere Absätze/Überschriften und fasst lose Textknoten in Absätze. */
export function cleanImportedHtml(html = "") {
  let out = html
    .replace(/<\/?div\b[^>]*>/gi, " ")
    .replace(new RegExp(`<(p|h[1-6])>${BLANK}</\\1>`, "gi"), " ")
    .replace(/\s{2,}/g, " ");
  // Lose Textknoten zwischen Blöcken (z. B. im Regenbogenfahnen-Eintrag) bekommen einen Absatz.
  out = out.replace(new RegExp(`(</(?:${BLOCK})>|<hr\\s*/?>)([^<]*[^\\s<][^<]*?)(?=<(?:${BLOCK})\\b)`, "gi"), (_, close: string, text: string) => `${close}<p>${text.trim()}</p>`);
  return out.trim();
}

/** Holt die Bildquellen-Zeile heraus, damit sie als Nachweis am Ende steht (Wortlaut bleibt). */
export function extractCredit(html = "") {
  const match = html.match(/<small>([\s\S]*?Bildquelle[\s\S]*?)<\/small>/i) || html.match(/<p>\s*(Bildquelle:[^<]*)<\/p>/i);
  if (!match) return { html, credit: "" };
  return { html: html.replace(match[0], " ").replace(/<hr\s*\/?>\s*$/i, "").trim(), credit: stripTags(match[1]) };
}

/** Zerlegt einen Text an <h2> in Einleitung und Kapitel. */
export function splitSections(html = "") {
  const parts = html.split(/(?=<h2\b)/i);
  const intro = /^<h2\b/i.test(parts[0] || "") ? "" : (parts.shift() || "").trim();
  const used = new Set<string>();
  const sections: HtmlSection[] = parts.map((part, index) => {
    const heading = part.match(/^<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
    const titleHtml = heading ? heading[1].trim() : "";
    const title = stripTags(titleHtml);
    let id = slugify(title) || `abschnitt-${index + 1}`;
    while (used.has(id)) id = `${id}-${index + 1}`;
    used.add(id);
    return { id, title, titleHtml, html: heading ? part.slice(heading[0].length).trim() : part.trim() };
  }).filter((section) => section.title || stripTags(section.html));
  return { intro, sections };
}

/** Lesezeit in Minuten (200 Wörter pro Minute, mindestens 1). */
export function readingMinutes(html = "") {
  const words = stripTags(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
