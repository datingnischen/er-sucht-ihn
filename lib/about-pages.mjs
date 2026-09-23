export const ABOUT_ROOT_PATH = "/ueber-uns";
export const ABOUT_REVIEWS_PATH = `${ABOUT_ROOT_PATH}/bewertungen`;
export const ABOUT_SOCIAL_PATH = `${ABOUT_ROOT_PATH}/social-media`;

/** Imported legacy pages that now live below the "Über uns" area. */
export const ABOUT_PAGE_MOVES = Object.freeze({
  "/bewertungen-und-erfahrungen": ABOUT_REVIEWS_PATH,
  "/social-media": ABOUT_SOCIAL_PATH,
});

export function aboutPathForImportedPath(path) {
  return ABOUT_PAGE_MOVES[path] ?? path;
}

export const aboutRedirects = Object.freeze([
  ...Object.entries(ABOUT_PAGE_MOVES).map(([source, destination]) => ({ source, destination, permanent: true })),
  { source: `${ABOUT_ROOT_PATH}/bewertungen-und-erfahrungen`, destination: ABOUT_REVIEWS_PATH, permanent: true },
  { source: `${ABOUT_ROOT_PATH}/erfahrungen`, destination: ABOUT_REVIEWS_PATH, permanent: true },
]);
