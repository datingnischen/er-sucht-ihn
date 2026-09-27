// Seitensuche unter /ueber-uns/suche/: reine Funktionen, damit Index und Ranking ohne Next.js testbar bleiben.
// /suche/ gehört auf der Live-Domain der ICONY-Plattform und wird hier nie verwendet.

export const SEARCH_RESULT_LIMIT = 50;
export const SEARCH_QUERY_MAX_LENGTH = 100;

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", shy: "", ndash: "–", mdash: "—", hellip: "…", bdquo: "„", ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’", auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß" };

/** Entfernt Tags, Skripte und Styles und dekodiert die gängigen Entities. */
export function htmlToText(html = "") {
  return String(html)
    .replace(/<(script|style|noscript|iframe)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name] ?? match)
    .replace(/\s+/g, " ")
    .trim();
}

/** Kleinschreibung, ä/ö/ü/ß ≙ ae/oe/ue/ss, übrige Diakritika entfernt. */
export function normalizeSearchText(value = "") {
  return String(value)
    .toLocaleLowerCase("de")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function cleanSearchQuery(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, SEARCH_QUERY_MAX_LENGTH) : "";
}

export function searchTerms(query) {
  return [...new Set(normalizeSearchText(query).split(" ").filter((term) => term.length > 1 || /\d/.test(term)))];
}

/**
 * Baut den Index aus Dokumenten { area, title, description, text, href }.
 * `text` ist bereits Klartext; normalisierte Fassungen werden einmal vorberechnet.
 */
export function buildSearchIndex(documents) {
  return documents.map((doc, order) => ({
    ...doc,
    order,
    nTitle: normalizeSearchText(doc.title),
    nDescription: normalizeSearchText(doc.description),
    nText: normalizeSearchText(doc.text),
  }));
}

function excerptFor(doc, terms, length = 180) {
  if (doc.description && terms.some((term) => doc.nDescription.includes(term))) return doc.description;
  const words = doc.text.split(" ");
  const hit = words.findIndex((word) => terms.some((term) => normalizeSearchText(word).includes(term)));
  if (hit < 0) return doc.description || shorten(doc.text, length);
  const start = Math.max(0, hit - 12);
  const snippet = shorten(words.slice(start).join(" "), length);
  return `${start > 0 ? "… " : ""}${snippet}`;
}

function shorten(text, length) {
  if (text.length <= length) return text;
  const cut = text.slice(0, length);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), length - 20)).trim()} …`;
}

/** Jeder Suchbegriff muss vorkommen; Titeltreffer ranken vor Auszug und Fließtext. */
export function searchIndex(index, query, limit = SEARCH_RESULT_LIMIT) {
  const terms = searchTerms(query);
  if (!terms.length) return [];
  const phrase = terms.join(" ");
  const results = [];
  for (const doc of index) {
    let score = 0;
    let complete = true;
    for (const term of terms) {
      const inTitle = doc.nTitle.includes(term);
      const inDescription = doc.nDescription.includes(term);
      const inText = doc.nText.includes(term);
      if (!inTitle && !inDescription && !inText) { complete = false; break; }
      if (inTitle) score += 100 + (new RegExp(`(^| )${term}( |$)`).test(doc.nTitle) ? 20 : 0) + (inDescription ? 2 : 0);
      else if (inDescription) score += 10;
      else score += 1 + Math.min(doc.nText.split(term).length - 2, 4);
    }
    if (!complete) continue;
    if (terms.length > 1 && doc.nTitle.includes(phrase)) score += 50;
    if (doc.nTitle === phrase) score += 80;
    results.push({ doc, score });
  }
  return results
    .sort((a, b) => b.score - a.score || a.doc.nTitle.length - b.doc.nTitle.length || a.doc.order - b.doc.order)
    .slice(0, limit)
    .map(({ doc }) => ({ area: doc.area, title: doc.title, href: doc.href, excerpt: excerptFor(doc, terms) }));
}
