import catalog from "@/data/pages.json";
import { normalizeImportedPath } from "./imported-path.mjs";
import { aboutPathForImportedPath } from "./about-pages.mjs";
import { classifyPath, SITE_URL } from "./site-contract.mjs";
import { absolutizeAssetUrls, staticAsset } from "./static-asset.mjs";

export type ImportedPage = {
  path: string;
  sourceUrl: string;
  canonical: string;
  type: "location" | "editorial" | "magazine" | "platform";
  title: string;
  description: string;
  h1: string;
  contentHtml: string;
  images: Array<{ src: string; alt: string }>;
  widgetUrl: string | null;
  sourceStatus: number;
};

function withAboutPath(page: ImportedPage): ImportedPage {
  const path = aboutPathForImportedPath(page.path);
  return path === page.path ? page : { ...page, path, canonical: `${SITE_URL}${path}` };
}

// Pages that ICONY still serves on the live domain are never rendered here.
function withPlatformType(page: ImportedPage): ImportedPage {
  return classifyPath(page.path) === "platform" ? { ...page, type: "platform" } : page;
}

// Gezielte Korrekturen am ICONY-Import, die ein erneuter Import sonst wieder zurücksetzen würde.
const metaOverrides: Record<string, Pick<ImportedPage, "title" | "description">> = {
  "/faq": {
    title: "FAQ er-sucht-ihn.de: Kosten, Sicherheit & Ablauf erklärt",
    description: "Antworten auf häufige Fragen zur Partnersuche bei er-sucht-ihn.de. Jetzt alles zu Kosten, Sicherheit & Ablauf erfahren.",
  },
};

function withMetaOverride(page: ImportedPage): ImportedPage {
  const override = metaOverrides[page.path];
  return override ? { ...page, ...override } : page;
}

// Importierte Medien liegen in public/magazine/media und kommen vom Asset-Host (nginx reicht nur Seitenrouten durch).
function withAbsoluteAssets(page: ImportedPage): ImportedPage {
  return {
    ...page,
    contentHtml: absolutizeAssetUrls(page.contentHtml),
    images: page.images.map((image) => ({ ...image, src: staticAsset(image.src) })),
  };
}

const pages = (catalog.pages as ImportedPage[]).map(withAboutPath).map(withPlatformType).map(withMetaOverride).map(withAbsoluteAssets);
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
