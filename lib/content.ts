import catalog from "@/data/pages.json";
import { normalizeImportedPath } from "./imported-path.mjs";
import { aboutPathForImportedPath } from "./about-pages.mjs";
import { SITE_URL } from "./site-contract.mjs";

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

const pages = (catalog.pages as ImportedPage[]).map(withAboutPath);
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
