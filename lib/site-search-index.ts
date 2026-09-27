import { publicPages } from "./content";
import { magazineEntries } from "./magazine";
import { ABOUT_ROOT_PATH } from "./about-pages.mjs";
import { withTrailingSlash } from "./site-contract.mjs";
import { buildSearchIndex, htmlToText, searchIndex } from "./site-search.mjs";

// Durchsucht die vorhandenen Snapshots (data/pages.json, data/magazine*.json) – keine Live-Requests pro Anfrage.
function areaForPage(path: string, type: string) {
  if (type === "location") return path === "/partnersuche" ? "Partnersuche" : "Stadt";
  if (path.startsWith(`${ABOUT_ROOT_PATH}/`)) return "Über uns";
  return "Seite";
}

const index = buildSearchIndex([
  ...magazineEntries.map((entry) => ({
    area: "Magazin",
    title: htmlToText(entry.title),
    description: htmlToText(entry.description),
    text: htmlToText(entry.contentHtml),
    href: withTrailingSlash(entry.path),
  })),
  ...publicPages.map((page) => ({
    area: areaForPage(page.path, page.type),
    title: htmlToText(page.h1 || page.title),
    description: htmlToText(page.description),
    text: htmlToText(page.contentHtml),
    href: withTrailingSlash(page.path),
  })),
]);

export type SiteSearchResult = { area: string; title: string; href: string; excerpt: string };

export function searchSite(query: string): SiteSearchResult[] {
  return searchIndex(index, query);
}
