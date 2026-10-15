import catalog from "../data/magazine.json" with { type: "json" };
import retiredLexicon from "../data/magazine-lexikon.json" with { type: "json" };
import { absolutizeAssetUrls, staticAsset } from "./static-asset.mjs";
import { slashInternalLinks, withTrailingSlash } from "./site-contract.mjs";
import { withImageAlts } from "./image-alt.mjs";
import { withoutEmptyHeadings } from "./html-cleanup.mjs";

export type MagazineEntry = {
  id: number;
  type: "post" | "page";
  status: "publish";
  slug: string;
  path: string;
  canonical: string;
  sourceUrl: string;
  title: string;
  /** Nur <title>; die Überschrift bleibt title. */
  seoTitle?: string;
  description: string;
  date: string;
  modified: string;
  author: { id: number; name: string; slug: string; description: string } | null;
  featuredImage: string | null;
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  contentHtml: string;
};

export type MagazineAttachment = {
  id: number;
  slug: string;
  path: string;
  canonical: string;
  targetType: "entry" | "asset";
  target: string;
};

export type MagazineCategory = { id: number; name: string; slug: string; count: number; description: string };
export type MagazineAuthor = { id: number; name: string; slug: string; description: string };
type MagazineAsset = { localPath: string; legacyPaths: string[] };

// The former /lexikon articles live on as magazine posts outside the WordPress snapshot.
// Medien kommen vom Asset-Host, weil der nginx vor der Live-Domain nur Seitenrouten durchreicht.
// Seiten-URLs (Canonical, interne Links) enden auf "/" wie die ICONY-Plattform; der Snapshot bleibt unverändert.
// Seitentitel unter ca. 580 px (Google-Abschnitt), gemessen wie Seobility mit 20px Arial; Snapshot bleibt unverändert.
const SEO_TITLES: Record<string, string> = {
  "bin-ich-schwul": "Bin ich schwul? Gefühle verstehen und einordnen",
  "drag-queen": "Drag Queen: Bedeutung, Geschichte und Szene",
  // Ohne Wortwiederholung (Seobility) und ohne eigene Domain im Titel.
  "er-sucht-ihn": "Er sucht Ihn: Als schwuler Mann den Partner finden",
  "seitensprung-affaere": "Seitensprung und Affäre: Mann sucht Abenteuer",
  "my-homo": "My-homo.net im Vergleich: Ist My-Homo eine Alternative?",
  "poppen-de": "Poppen.de: große Dating-Community mit Gaychat",
  "promi-outings": "Promi-Outings: Berühmte Schwule, die dazu stehen",
  "kleine-pride-events-gay-dating": "Kleine Pride-Events: Echte Kontakte für Gay Singles",
  "deepfake-nudes-dating-schutz": "Deepfake-Nudes: Privatsphäre beim Gay-Dating schützen",
  "schwul-und-muslimisch-partnersuche": "Schwul und muslimisch: Chancen bei der Partnersuche",
  "bisexuelle-maenner": "Bisexuelle Männer: Umgang und Gleichgesinnte finden",
  "queere-events-dating-sicherheit": "Queere Events und Dating: Warum Vertrauen zählt",
  gaychat: "Gaychat, Schwulenchat & Gay Cam: Der passende Chat",
  "gay-escort": "Gay Escort: Dienstleistungen, Sicherheit & Tipps",
  "ernie-und-bert-doch-nur-beste-freunde": "Ernie und Bert: doch nur beste Freunde?",
};
// Überschrift und Titel zugleich (ein Wort reicht weder als H1 noch als Titel), wie bei den anderen Gay-Locations.
const TITLE_OVERRIDES: Record<string, string> = {
  "gaylocations-dortmund": "Gay-Locations, Clubs und Bars in Dortmund",
};

// Längere H1 (Seobility: unter ca. 20 Zeichen zu kurz); Titel, Karten und Linktexte behalten den Originaltitel.
const H1_OVERRIDES: Record<string, string> = {
  "bin-ich-schwul": "Bin ich schwul? Gefühle verstehen und einordnen",
  "drag-queen": "Drag Queen: Bedeutung, Geschichte und Szene",
  "er-sucht-ihn": "Er sucht Ihn: Als schwuler Mann den Partner finden",
  "promi-outings": "Promi-Outings: Berühmte Schwule, die dazu stehen",
};
export function magazineHeading(entry: Pick<MagazineEntry, "slug" | "title">) {
  return H1_OVERRIDES[entry.slug] ?? entry.title;
}

// Gleicher Linktext soll immer auf dasselbe Ziel zeigen (Seobility „identische Linktexte“). Sichtbarer Text bleibt,
// nur das Ziel wird vereinheitlicht; im Gay-Locations-Überblick bekommen die Stadt-Zwischentitel den Themenzusatz,
// weil die bloßen Stadtnamen sonst mit den Städteseiten unter /partnersuche/ konkurrieren.
const LINK_TARGET_FIXES: Array<[RegExp, string]> = [
  [/href="\/magazin\/gay-de\/?">schwule Männer finden</g, 'href="/magazin/schwule-maenner-suchen">schwule Männer finden<'],
  [/href="\/gay\.html\/?">Schwule</g, 'href="/magazin/ist-er-schwul-merkmale">Schwule<'],
  [/href="\/magazin\/schwule-maenner-suchen\/?">Schwule</g, 'href="/magazin/ist-er-schwul-merkmale">Schwule<'],
  [/href="\/magazin\/tv-show-prince-charming\/?">Prince Charming</g, 'href="/magazin/prince-charming">Prince Charming<'],
];
function withUniqueLinkTargets(slug: string, html: string) {
  let out = html;
  for (const [pattern, replacement] of LINK_TARGET_FIXES) out = out.replace(pattern, replacement);
  // Bildlinks auf die Städte-Guides: ein bloßer Stadtname als Alt-Text wäre derselbe Linktext wie zur Städteseite.
  out = out.replace(/(<a href="\/magazin\/gaylocations-[a-z-]+\/?"[^>]*>\s*<img\b[^>]*\balt=")([A-ZÄÖÜ][a-zäöüß]+)(")/g, "$1Gay-Locations in $2$3");
  if (slug === "gay-locations") out = out.replace(/<h4><a href="(\/magazin\/gaylocations-[a-z-]+\/?)">([^<]+)<\/a><\/h4>/g, '<h4><a href="$1">Gay-Locations in $2</a></h4>');
  return out;
}

export const magazineEntries = ([...catalog.entries, ...retiredLexicon.entries] as MagazineEntry[]).map((entry) => ({
  ...entry,
  // Importbereinigung vor dem Slash-/Asset-Schritt: leere Überschriften raus, eindeutige Linkziele.
  contentHtml: withoutEmptyHeadings(withUniqueLinkTargets(entry.slug, entry.contentHtml)),
})).map((entry) => ({
  ...entry,
  title: TITLE_OVERRIDES[entry.slug] ?? entry.title,
  seoTitle: SEO_TITLES[entry.slug],
  canonical: withTrailingSlash(entry.canonical),
  featuredImage: entry.featuredImage ? staticAsset(entry.featuredImage) : entry.featuredImage,
  contentHtml: absolutizeAssetUrls(slashInternalLinks(entry.contentHtml)),
})).map((entry) => withImageAlts(entry, entry.title) as MagazineEntry);
export const magazineAttachments = (catalog.attachments as MagazineAttachment[]).map((attachment) =>
  attachment.targetType === "asset"
    ? { ...attachment, target: staticAsset(attachment.target) }
    : { ...attachment, target: withTrailingSlash(attachment.target) },
);
export const magazinePosts = magazineEntries
  .filter((entry) => entry.type === "post")
  .sort((a, b) => b.date.localeCompare(a.date));
export const magazinePages = magazineEntries
  .filter((entry) => entry.type === "page")
  .sort((a, b) => a.title.localeCompare(b.title, "de"));
export const magazineCategories = catalog.categories as MagazineCategory[];
export const magazineAuthors = catalog.authors as MagazineAuthor[];
export const magazineTags = catalog.tags as MagazineCategory[];
/** IDs der ehemaligen WordPress-Inhalte (ohne das Lexikon); nur diese gibt der WP-REST-Endpunkt aus. */
export const magazineWordpressIds = new Set(catalog.entries.map((entry) => entry.id));

const magazineAssets = catalog.assets as MagazineAsset[];
const entryByPath = new Map(magazineEntries.map((entry) => [entry.path, entry]));
const attachmentByPath = new Map(magazineAttachments.map((attachment) => [attachment.path, attachment]));
const categoryBySlug = new Map(magazineCategories.map((category) => [category.slug, category]));
const authorBySlug = new Map(magazineAuthors.map((author) => [author.slug, author]));
const legacyAssetByPath = new Map(
  magazineAssets.flatMap((asset) => asset.legacyPaths.map((path) => [safeDecodePath(path), staticAsset(asset.localPath)] as const)),
);

const germanDate = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" });

/** Sichtbares Artikeldatum: Änderungsdatum, Fallback auf das Veröffentlichungsdatum. */
export function magazineUpdatedDate(entry: Pick<MagazineEntry, "date" | "modified">) {
  return entry.modified || entry.date;
}

export function magazineUpdatedLabel(entry: Pick<MagazineEntry, "date" | "modified">) {
  const value = magazineUpdatedDate(entry);
  return value ? `Aktualisiert am ${germanDate.format(new Date(value))}` : "";
}

/** Sichtbares Artikeldatum: Änderungsdatum, Fallback auf das Veröffentlichungsdatum. Seiten zeigen kein Datum. */
export function articleUpdatedDate(entry: Pick<MagazineEntry, "date" | "modified">): string {
  return entry.modified || entry.date;
}

/** Beiträge nach Erscheinungsjahr, neuestes Jahr zuerst (innerhalb des Jahres bleiben die neuesten vorn). */
export function magazinePostsByYear() {
  const years = new Map<string, MagazineEntry[]>();
  for (const entry of magazinePosts) {
    const year = entry.date.slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), entry]);
  }
  return [...years].map(([year, posts]) => ({ year, posts }));
}

export function getMagazineEntry(path: string) {
  return entryByPath.get(normalizeMagazinePath(path));
}

export function getMagazineAttachment(path: string) {
  return attachmentByPath.get(normalizeMagazinePath(path));
}

export function getMagazineCategory(slug: string) {
  return categoryBySlug.get(slug);
}

export function getMagazineAuthor(slug: string) {
  return authorBySlug.get(slug);
}

export function postsForMagazineCategory(id: number) {
  return magazinePosts.filter((entry) => entry.categories.some((category) => category.id === id));
}

export function postsForMagazineAuthor(id: number) {
  return magazinePosts.filter((entry) => entry.author?.id === id);
}

export function getLegacyMagazineAsset(path: string) {
  return legacyAssetByPath.get(safeDecodePath(normalizeMagazinePath(path)));
}

export function normalizeMagazinePath(path: string) {
  const clean = path.split(/[?#]/, 1)[0].replace(/\/+$/, "");
  return clean || "/";
}

function safeDecodePath(path: string) {
  try {
    return decodeURI(path);
  } catch {
    return "";
  }
}

export function magazineStaticParams() {
  return [...magazineEntries.map((entry) => entry.path), ...magazineAttachments.map((entry) => entry.path)]
    .map((path) => ({ slug: path.replace(/^\/magazin\//, "").split("/").map(decodeURIComponent) }));
}

export function relatedMagazineEntries(entry: MagazineEntry, limit = 3) {
  const categorySlugs = new Set(entry.categories.map((category) => category.slug));
  return magazinePosts
    .filter((candidate) => candidate.id !== entry.id)
    .sort((a, b) => {
      const aScore = a.categories.filter((category) => categorySlugs.has(category.slug)).length;
      const bScore = b.categories.filter((category) => categorySlugs.has(category.slug)).length;
      return bScore - aScore || b.date.localeCompare(a.date);
    })
    .slice(0, limit);
}
