import catalog from "@/data/magazine.json";
import retiredLexicon from "@/data/magazine-lexikon.json";
import { absolutizeAssetUrls, staticAsset } from "./static-asset.mjs";
import { slashInternalLinks, withTrailingSlash } from "./site-contract.mjs";

export type MagazineEntry = {
  id: number;
  type: "post" | "page";
  status: "publish";
  slug: string;
  path: string;
  canonical: string;
  sourceUrl: string;
  title: string;
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
export const magazineEntries = ([...catalog.entries, ...retiredLexicon.entries] as MagazineEntry[]).map((entry) => ({
  ...entry,
  canonical: withTrailingSlash(entry.canonical),
  featuredImage: entry.featuredImage ? staticAsset(entry.featuredImage) : entry.featuredImage,
  contentHtml: absolutizeAssetUrls(slashInternalLinks(entry.contentHtml)),
}));
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
