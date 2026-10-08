import { withTrailingSlash } from "./site-contract.mjs";

export const ABOUT_ROOT_PATH = "/ueber-uns";
export const ABOUT_REVIEWS_PATH = `${ABOUT_ROOT_PATH}/bewertungen`;
export const ABOUT_SOCIAL_PATH = `${ABOUT_ROOT_PATH}/social-media`;
/** Seitensuche: unter Über uns, weil der nginx /ueber-uns/ durchreicht und /suche/ der ICONY-Plattform gehört. */
export const ABOUT_SEARCH_PATH = `${ABOUT_ROOT_PATH}/suche`;

/** Imported legacy pages that now live below the "Über uns" area. */
export const ABOUT_PAGE_MOVES = Object.freeze({
  "/bewertungen-und-erfahrungen": ABOUT_REVIEWS_PATH,
  "/social-media": ABOUT_SOCIAL_PATH,
});

export function aboutPathForImportedPath(path) {
  return ABOUT_PAGE_MOVES[path] ?? path;
}

export const aboutRedirects = Object.freeze([
  // Der Alt-Pfad /bewertungen-und-erfahrungen wird bewusst nicht mehr bedient (404); ABOUT_PAGE_MOVES ordnet nur den Seiteninhalt zu.
  ...Object.entries(ABOUT_PAGE_MOVES).filter(([, destination]) => destination !== ABOUT_REVIEWS_PATH).map(([source, destination]) => ({ source, destination: withTrailingSlash(destination), permanent: true })),
  { source: `${ABOUT_ROOT_PATH}/erfahrungen`, destination: withTrailingSlash(ABOUT_REVIEWS_PATH), permanent: true },
]);
