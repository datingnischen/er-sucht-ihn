import { selectHeroImage } from "./hero-image.mjs";

/**
 * Zerlegt den importierten ICONY-Stadttext in Kapitel, ohne ein Wort zu ändern.
 * Nur Präsentation: leere Wrapper-divs und Absätze, doppelte Registrierungs-Wrapper außerhalb des Fließtexts,
 * Flaggen- und Statistikgrafiken sowie die Bildquelle werden herausgelöst; die Linkliste
 * „Diese Städte könnten auch interessant …“ wird separat als Chips gezeigt.
 */

/** Stichwort-Regeln für Kapitel-Symbole, Reihenfolge = Priorität. @type {[string, RegExp][]} */
const TOPIC_RULES = [
  ["love", /fazit/],
  ["sources", /quellen/],
  ["tip", /hack/],
  ["culture", /^kultur|kultur-date|museum|kunsthaus/],
  ["online", /online|\bapps?\b|plattform|platform|singlebörse|datingbörse|dating-platform|auf den ersten klick|er-sucht-ihn\.de|\bgrindr\b|\bromeo\b|gaychat/],
  ["bar", /\bbars?\b|bar-|club|party|partys|lounge|nachtleben|nachtszene|tanzbar|ausgehen|flirty|szeneviertel|szene-vibe/],
  ["event", /event|pride|\bcsd\b|festival|veranstaltung|kirchtag|tuntenball|fest\b|messe|folsom|hustlaball|gaywiesn|parade|\bfeier\b|regenbogenfeier|weihnachtsmarkt|termin/],
  ["food", /café|cafe|kaffee|\bessen &|essen und|restaurant|köstlich|kulinar|brunch|markt|genuss|schokolade/],
  ["boat", /\bboot|schiff/],
  ["mountain", /\bberge?\b|berg-|alpen|nordkette|karren|\bski\b/],
  ["nature", /park|see\b|seen\b|see-|seeblick|natur|ausblick|aussicht|spazier|ufer|garten|wander|rheinfall|outdoor|radtour|donau|insel|sport|freizeit/],
  ["culture", /kultur|museum|kunst|\bbuch|film|kino|theater|galerie|zeche|schloss|architektur|schnoor/],
  ["community", /community|szene|verein|treff|stammtisch|gruppe|netzwerk|hosi|zentrum|schwulenzentrum|aidshilfe|beratung|anlaufstelle|initiative|queer|jugend|kontakte|vernetz|rosalila|queerbeet|wilsch|regenbogenhaus/],
  ["music", /musik|konzert|tanz/],
  ["tip", /tipp|idee|hack|möglichkeit|alternative|wie funktioniert|passende|weg ist das ziel|gemeinsamkeit|hobby|shoppen/],
  ["love", /liebe|lieben|verlieb|herz|hochzeit|romant|traummann|gefühl|chance|kennenlernen/],
];

export const TOPIC_LABELS = Object.freeze({
  bar: "Bars & Clubs",
  event: "Events & Pride",
  food: "Café & Genuss",
  nature: "Natur & Ausblick",
  boat: "Auf dem Wasser",
  mountain: "Berge & Alpen",
  online: "Online-Dating",
  culture: "Kultur",
  community: "Community",
  music: "Musik & Tanz",
  love: "Liebe & Fazit",
  tip: "Tipps & Ideen",
  sources: "Quellen",
  place: "Orte & Begegnungen",
});

/** Grafiken, die im Guide nicht gezeigt werden: Flaggen (Deko) und „Flirt & Dating Statistik“-Bilder mit unbelegten Zahlen. */
const HIDDEN_IMAGE_NAME = /flagge|statistik|statistics|er-sucht-ihn-de-titelbild/i;
// „HamburgL.jpg“, „KölnL.jpg“ … (großes L, daher ohne i-Flag): Statistikgrafiken mit unbelegten Zahlen.
const STATISTIC_GRAPHIC = /\/[^/"]*L\.jpg(?:$|\?|")/;
const isHiddenImage = (value) => HIDDEN_IMAGE_NAME.test(value) || STATISTIC_GRAPHIC.test(value);

const EMPTY_PARAGRAPH = /<p>(?:\s|&nbsp;| |<br\s*\/?>)*<\/p>/gi;
const WRAPPER_TAG = /<\/?(?:div|section)\s*>/gi;
const CTA_WRAPPER = /<div>\s*<a class="inline-content-cta"[^>]*>[^<]*<\/a>\s*<\/div>/gi;
const CREDIT_BLOCK = /(?:<hr\s*\/?>\s*)?<p>\s*<small>\s*Bildquelle:?\s*((?:(?!<\/small>)[\s\S])*?)\s*<\/small>\s*<\/p>((?:\s*<p>\s*<small>[^<]*<\/small>\s*<\/p>)*)/i;
const HEADING = /<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
// Die Linkliste steht bei ICONY als <ul> oder als Folge von „· <a>“-Absätzen.
const RELATED_BLOCK = /<h([23])\b[^>]*>((?:(?!<\/h[23]>)[\s\S])*?(?:interessante Orte|interessant für dich)(?:(?!<\/h[23]>)[\s\S])*?)<\/h\1>\s*((?:<ul>[\s\S]*?<\/ul>)|(?:(?:<p>\s*(?:·|&middot;)?\s*<a\b(?![^>]*inline-content-cta)[^>]*>[\s\S]*?<\/a>\s*<\/p>\s*)+))/i;

export function plainText(html = "") {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;| /g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** @returns {string} */
export function topicFor(heading = "") {
  const value = heading.toLowerCase();
  return TOPIC_RULES.find(([, rule]) => rule.test(value))?.[0] ?? "place";
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Foto für Hero, Karten und Thumbnails: keine Flaggen, Statistik- oder Titelgrafiken. */
export function selectCityPhoto(images = []) {
  return selectHeroImage(images.filter((image) => !isHiddenImage(image.src))) ?? null;
}

function removeImage(html, src) {
  const img = `<img\\b[^>]*\\bsrc=["']${escapeRegExp(src)}["'][^>]*>`;
  const blank = "(?:\\s|&nbsp;|\\u00a0)*";
  return html.replace(new RegExp(`<p>${blank}${img}${blank}</p>`, "gi"), "").replace(new RegExp(img, "gi"), "");
}

function removeHiddenImages(html) {
  return html
    .replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/gi, (match, img) => (isHiddenImage(img) ? "" : match))
    .replace(/<img\b[^>]*>/gi, (img) => (isHiddenImage(img) ? "" : img));
}

function creditLabel(url) {
  if (/pexels\./i.test(url)) return "Pexels";
  if (/pixabay\./i.test(url)) return "Pixabay";
  if (/freepik\./i.test(url)) return "Freepik";
  if (/unsplash\./i.test(url)) return "Unsplash";
  return "Quelle";
}

/**
 * Löst Bildnachweise („Bildquelle: URL“, auch mehrere <small>-Absätze) aus dem HTML.
 * @returns {{ html: string; credits: { url: string; label: string }[] }}
 */
export function extractCredits(html = "") {
  const match = html.match(CREDIT_BLOCK);
  if (!match) return { html, credits: [] };
  const urls = `${plainText(match[1])} ${plainText(match[2] ?? "")}`
    .split(/\s+/)
    .map((value) => value.replace(/&amp;/g, "&"))
    .filter((value) => /^https:\/\//.test(value));
  return {
    html: html.replace(CREDIT_BLOCK, ""),
    credits: urls.map((url) => ({ url, label: creditLabel(url) })),
  };
}

/** Wrapper-divs, doppelte CTA-Wrapper, leere Absätze und Rand-Trennlinien entfernen (Text bleibt unverändert). */
export function tidyImportedHtml(html = "") {
  let result = html.replace(CTA_WRAPPER, "").replace(WRAPPER_TAG, " ");
  result = removeHiddenImages(result).replace(EMPTY_PARAGRAPH, "");
  result = result.replace(/^\s*(?:<hr\s*\/?>\s*)+/i, "").replace(/(?:\s*<hr\s*\/?>)+\s*$/i, "");
  return result.replace(/\s{2,}/g, " ").trim();
}

function relatedLinks(listHtml, currentPath) {
  const links = [];
  for (const match of listHtml.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = match[1];
    const name = plainText(match[2]);
    if (!name || !href.startsWith("/")) continue;
    if (href.replace(/\/+$/, "") === currentPath.replace(/\/+$/, "")) continue;
    links.push({ name, href, isHub: /^\/partnersuche\/?$/.test(href) });
  }
  return links;
}

function wordCount(text) {
  return text ? text.split(" ").length : 0;
}

/**
 * @param {{ contentHtml: string; path: string; heroSrc?: string | null }} input
 */
export function buildCityGuide({ contentHtml, path, heroSrc = null }) {
  const { html: withoutCredit, credits } = extractCredits(tidyImportedHtml(contentHtml));
  let html = heroSrc ? removeImage(withoutCredit, heroSrc) : withoutCredit;
  html = html.replace(EMPTY_PARAGRAPH, "").trim();

  /** @type {{ heading: string; links: { name: string; href: string; isHub: boolean }[] }} */
  let related = { heading: "", links: [] };
  const relatedMatch = html.match(RELATED_BLOCK);
  if (relatedMatch) {
    related = { heading: plainText(relatedMatch[2]), links: relatedLinks(relatedMatch[3], path) };
    html = html.replace(RELATED_BLOCK, "").trim();
  }

  // An h2 teilen; gliedert ein Text überwiegend mit h3 (z. B. Wien, Frankfurt), zählen auch die h3 als Kapitel.
  const headings = [...html.matchAll(HEADING)].filter((match) => plainText(match[2]));
  const h2Count = headings.filter((match) => match[1] === "2").length;
  const splitLevels = h2Count >= 3 ? ["2"] : ["2", "3"];

  const parts = [{ heading: null, level: 2, html: "" }];
  let cursor = 0;
  for (const match of html.matchAll(HEADING)) {
    if (!splitLevels.includes(match[1])) continue;
    parts[parts.length - 1].html += html.slice(cursor, match.index);
    cursor = (match.index ?? 0) + match[0].length;
    if (plainText(match[2])) parts.push({ heading: match[2].trim(), level: Number(match[1]), html: "" });
  }
  parts[parts.length - 1].html += html.slice(cursor);

  const usedIds = new Set();
  const sections = [];
  let chapterNo = 0;
  for (const part of parts.slice(1)) {
    const heading = plainText(part.heading);
    let id = slugify(heading) || `kapitel-${sections.length + 1}`;
    while (usedIds.has(id)) id = `${id}-${sections.length + 1}`;
    usedIds.add(id);
    const body = part.html.trim();
    // Überschrift ohne eigenen Text (h2 direkt vor h3-Kapiteln) wird zum Zwischentitel ohne Nummer.
    const isPart = !plainText(body) && !/<img\b/i.test(body);
    if (!isPart) chapterNo += 1;
    sections.push({ id, heading, headingHtml: part.heading, level: part.level, topic: topicFor(heading), html: body, isPart, no: isPart ? 0 : chapterNo });
  }

  const introHtml = parts[0].html.trim();
  const chapters = sections.filter((section) => !section.isPart);
  const fullText = plainText(`${introHtml} ${sections.map((section) => `${section.heading} ${section.html}`).join(" ")}`);
  const topics = [...new Set(chapters.map((section) => section.topic))].filter((topic) => !["place", "love", "sources", "tip"].includes(topic));

  return {
    introHtml: plainText(introHtml) || /<img\b/i.test(introHtml) ? introHtml : "",
    sections,
    chapterCount: chapters.length,
    related,
    credits,
    readingMinutes: Math.max(1, Math.round(wordCount(fullText) / 200)),
    topics,
  };
}
