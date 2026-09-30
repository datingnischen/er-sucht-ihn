import { getMagazineEntry, magazineCategories, magazinePosts, postsForMagazineCategory, type MagazineEntry } from "@/lib/magazine";
import { getLocationName } from "@/lib/site-contract.mjs";

/** Autoren-Bios als Magazinseiten gibt es bei Er-sucht-Ihn (noch) nicht; die Menge bleibt für die Byline-Logik. */
export const BIO_PAGE_SLUGS = new Set<string>([]);

/** Szene-Guides: Gay-Locations je Stadt und die Deutschland-Übersicht dazu. */
export function isSceneGuide(entry: MagazineEntry) {
  return /^gaylocations-|^gay-locations$/.test(entry.slug);
}

/** „gaylocations-koeln“ → „Köln“; die Übersicht liefert null. */
export function guideCity(entry: MagazineEntry) {
  const slug = entry.slug.match(/^gaylocations-(.+)$/)?.[1];
  return slug ? getLocationName(slug) : null;
}

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lesezeit bei 200 Wörtern pro Minute, mindestens eine Minute. */
export function readingMinutes(html: string) {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function dateLabel(date: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(date));
}

export function shortDateLabel(date: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "abschnitt";
}

export type ArticleHeading = { id: string; text: string };

/**
 * Bereitet den importierten Artikeltext nur für die Darstellung auf: leere Absätze und Absatz-Hüllen um Tabellen fallen weg,
 * jede h2 bekommt eine Sprungmarke für das Inhaltsverzeichnis. Der Wortlaut bleibt unverändert.
 */
export function prepareArticleHtml(html: string) {
  const used = new Set<string>();
  const headings: ArticleHeading[] = [];
  const cleaned = html
    .replace(/<p>\s*(<table[\s\S]*?<\/table>)\s*<\/p>/g, "$1")
    .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/g, "");
  const withIds = cleaned.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g, (match, attrs: string | undefined, inner: string) => {
    const text = stripHtml(inner);
    if (!text) return match;
    const existing = attrs?.match(/\sid="([^"]+)"/)?.[1];
    let id = existing || slugify(text);
    if (!existing) {
      const base = id;
      for (let n = 2; used.has(id); n += 1) id = `${base}-${n}`;
    }
    used.add(id);
    headings.push({ id, text });
    return existing ? match : `<h2 id="${id}"${attrs ?? ""}>${inner}</h2>`;
  });
  return { html: withIds, headings };
}

/** Kategorien mit ihrer tatsächlichen Beitragszahl, leere (z. B. Kontaktanzeigen) fallen weg. */
export function categoriesWithPosts() {
  return magazineCategories
    .map((category) => ({ ...category, total: postsForMagazineCategory(category.id).length }))
    .filter((category) => category.total > 0);
}

export function primaryCategory(entry: MagazineEntry) {
  return entry.categories[0] ?? null;
}

type AuthorProfile = { bio?: string; role?: string; portrait?: boolean };

/** Autoren-Slug → Rolle und (falls vorhanden) Bio-Seite im Magazin. */
const AUTHOR_PROFILES: Record<string, AuthorProfile> = {
  gay: { role: "Gay-Dating-Autor" },
  redaktion: { role: "Redaktion Er-sucht-Ihn.de" },
};

export function authorProfile(slug: string) {
  const profile = AUTHOR_PROFILES[slug] ?? {};
  const bioEntry = profile.bio ? getMagazineEntry(`/magazin/${profile.bio}`) : undefined;
  const portrait = profile.portrait && bioEntry ? bioEntry.contentHtml.match(/<img[^>]*\ssrc="([^"]+)"/)?.[1] ?? null : null;
  const bioLead = bioEntry
    ? [...bioEntry.contentHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((match) => stripHtml(match[1])).find((text) => text.length >= 80) ?? null
    : null;
  return { role: profile.role ?? null, bioEntry: bioEntry ?? null, portrait, bioLead };
}

export function initials(name: string) {
  return name.split(/[\s-]+/).filter((part) => /^[A-Za-zÄÖÜäöü]/.test(part)).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
}

export function postCountForAuthor(id: number) {
  return magazinePosts.filter((entry) => entry.author?.id === id).length;
}
