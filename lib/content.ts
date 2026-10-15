import catalog from "@/data/pages.json";
import { normalizeImportedPath } from "./imported-path.mjs";
import { aboutPathForImportedPath } from "./about-pages.mjs";
import { classifyPath, publicUrl, SITE_URL, slashInternalLinks, withTrailingSlash } from "./site-contract.mjs";
import { absolutizeAssetUrls, staticAsset } from "./static-asset.mjs";
import { withImageAlts } from "./image-alt.mjs";
import { withPagePhoto } from "./page-photos.mjs";
import { fixTypos, limitStrong, withoutEmptyHeadings, withoutH1Repeat } from "./html-cleanup.mjs";

export type ImportedPage = {
  path: string;
  sourceUrl: string;
  canonical: string;
  type: "location" | "editorial" | "magazine" | "platform";
  title: string;
  description: string;
  /** Nur für <title>/Meta-Description, wenn sie vom sichtbaren Seitentext abweichen sollen. */
  seoTitle?: string;
  seoDescription?: string;
  h1: string;
  contentHtml: string;
  images: Array<{ src: string; alt: string }>;
  widgetUrl: string | null;
  sourceStatus: number;
};

function withAboutPath(page: ImportedPage): ImportedPage {
  const path = aboutPathForImportedPath(page.path);
  return path === page.path ? page : { ...page, path, canonical: publicUrl(path) };
}

// Pages that ICONY still serves on the live domain are never rendered here,
// and imported links to them point straight to the live domain.
const ICONY_PAGE_LINK = /href="(\/(?:(?:sicherheit-und-datenschutz|redaktionelle-kontrolle|kostenlose-basis-mitgliedschaft|premium-mitgliedschaft|unsere-erfolgsgeschichten|fragenflirt|fotoflirt|videodating)\.html|dating-tipps\/?))"/g;

function withPlatformType(page: ImportedPage): ImportedPage {
  const contentHtml = page.contentHtml.replace(ICONY_PAGE_LINK, `href="${SITE_URL}$1"`);
  return classifyPath(page.path) === "platform" ? { ...page, contentHtml, type: "platform" } : { ...page, contentHtml };
}

// Gezielte Korrekturen am ICONY-Import, die ein erneuter Import sonst wieder zurücksetzen würde.
const metaOverrides: Record<string, Partial<Pick<ImportedPage, "title" | "description" | "seoTitle" | "seoDescription">>> = {
  // ICONY bedient /bewertungen-und-erfahrungen/ und /social-media/ weiter mit denselben Texten: eigene Metadaten gegen Dubletten.
  "/ueber-uns/bewertungen": {
    seoTitle: "Bewertungen & Erfahrungen mit Er sucht Ihn",
    seoDescription: "Was Mitglieder über Er sucht Ihn sagen: Erfahrungen, Trustpilot-Bewertungen und Vergleiche zur Partnersuche für schwule Männer.",
  },
  "/ueber-uns/social-media": {
    seoTitle: "Er sucht Ihn auf Facebook & YouTube",
    seoDescription: "Er sucht Ihn auf Facebook und YouTube: Dating-Tipps, Community-Themen und Neuigkeiten für schwule Männer. Folge unseren offiziellen Kanälen.",
  },
  "/partnersuche/essen": { title: "Er sucht Ihn in Essen (Ruhrgebiet)" },
  "/faq": {
    // Nur Wörter, die auch im Seitentext stehen.
    title: "Fragen und Antworten zu Er-sucht-Ihn",
    description: "Antworten auf häufige Fragen zur Partnersuche bei er-sucht-ihn.de. Jetzt alles zu Kosten, Sicherheit & Ablauf erfahren.",
  },
};

function withMetaOverride(page: ImportedPage): ImportedPage {
  const override = metaOverrides[page.path];
  return override ? { ...page, ...override } : page;
}

// Längere H1 (Seobility: unter ca. 20 Zeichen zu kurz); Titel und Linktexte bleiben.
const h1Overrides: Record<string, string> = {
  "/partnersuche/nordrhein-westfalen/bonn": "Er sucht Ihn in Bonn: schwule Männer kennenlernen",
  // Importierte H1 mit Emoji und „NRW“ (steht nicht im Text).
  "/partnersuche/bielefeld": "Schwule Singles in Bielefeld kennenlernen",
  "/partnersuche/muenster": "Schwule Singles in Münster kennenlernen",
  // „Gays“ stand nicht im Text.
  "/partnersuche": "Finde Männer in deiner Stadt",
};
// Markenlink „Er sucht Ihn“ auf die Startseite konkurriert mit dem gleichnamigen Glossar-Artikel; die Startseite ist ohnehin überall verlinkt.
const contentFixes: Record<string, Array<[string, string]>> = {
  "/partnersuche/nordrhein-westfalen/duesseldorf": [['<a href="/">Er sucht Ihn</a>', "Er sucht Ihn"]],
};
function safeDecode(value: string) { try { return decodeURI(value); } catch { return value; } }
function withPageFixes(page: ImportedPage): ImportedPage {
  const h1 = h1Overrides[page.path] ?? page.h1;
  let contentHtml = page.contentHtml;
  for (const [from, to] of contentFixes[page.path] ?? []) contentHtml = contentHtml.split(from).join(to);
  // Markenlink „Er sucht Ihn“ auf die Startseite (in vielen Stadttexten) konkurriert mit dem gleichnamigen Glossar-Artikel.
  contentHtml = contentHtml.replace(/<a href="\/"[^>]*>(Er sucht Ihn)<\/a>/gi, "$1");
  // Interne Links einheitlich mit Umlauten statt Prozent-Kodierung (sonst zählt Seobility zwei URLs für dieselbe Seite).
  contentHtml = contentHtml.replace(/href="(\/[^"]*%[0-9A-Fa-f]{2}[^"]*)"/g, (_m, path: string) => `href="${safeDecode(path)}"`);
  contentHtml = fixTypos(limitStrong(withoutH1Repeat(withoutEmptyHeadings(contentHtml), h1)));
  const description = fixTypos(page.description);
  return h1 === page.h1 && contentHtml === page.contentHtml && description === page.description ? page : { ...page, h1, contentHtml, description };
}

// Seiten-URLs enden auf "/" wie die ICONY-Plattform; der Import-Snapshot bleibt unverändert.
function withTrailingSlashUrls(page: ImportedPage): ImportedPage {
  return { ...page, canonical: withTrailingSlash(page.canonical), contentHtml: slashInternalLinks(page.contentHtml) };
}

// Importierte Medien liegen in public/magazine/media und kommen vom Asset-Host (nginx reicht nur Seitenrouten durch).
function withAbsoluteAssets(page: ImportedPage): ImportedPage {
  return {
    ...page,
    contentHtml: absolutizeAssetUrls(page.contentHtml),
    images: page.images.map((image) => ({ ...image, src: staticAsset(image.src) })),
  };
}

const pages = (catalog.pages as ImportedPage[]).map(withAboutPath).map(withPlatformType).map(withMetaOverride).map(withPageFixes).map(withTrailingSlashUrls).map(withAbsoluteAssets).map((page) => withPagePhoto(page, staticAsset) as ImportedPage).map((page) => withImageAlts(page, page.h1 || page.title) as ImportedPage);
const pageMap = new Map(pages.map((page) => [page.path, page]));

export const publicPages = pages.filter((page) => page.type !== "platform" && page.type !== "magazine");

export function normalizePublicPath(parts?: string[]) {
  return normalizeImportedPath(parts);
}

export function getImportedPage(path: string) {
  return pageMap.get(path) ?? null;
}

export function getFamilyPages(root: "partnersuche") {
  const prefix = `/${root}/`;
  return publicPages.filter((page) => page.path.startsWith(prefix));
}
