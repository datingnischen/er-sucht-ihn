import { CITY_GEO } from "./city-geo.mjs";

/**
 * Bundesland-Seiten unter /partnersuche/<land>/: ICONY hatte dafür keine Inhalte, die Seiten listen die Stadtseiten
 * des Landes. Zugeordnet wird über die tatsächliche Region aus CITY_GEO, nicht über den ICONY-Pfad
 * (Halberstadt liegt unter /sachsen/, gehört aber nach Sachsen-Anhalt; Augsburg liegt ohne Landessegment).
 * Stadtstaaten (Berlin, Hamburg, Bremen) sind selbst Stadtseiten und bekommen keine eigene Landesseite.
 */
export const STATES = Object.freeze([
  { slug: "baden-wuerttemberg", name: "Baden-Württemberg" },
  { slug: "bayern", name: "Bayern" },
  { slug: "brandenburg", name: "Brandenburg" },
  { slug: "hessen", name: "Hessen" },
  { slug: "niedersachsen", name: "Niedersachsen" },
  { slug: "nordrhein-westfalen", name: "Nordrhein-Westfalen" },
  { slug: "rheinland-pfalz", name: "Rheinland-Pfalz" },
  { slug: "sachsen", name: "Sachsen" },
  { slug: "sachsen-anhalt", name: "Sachsen-Anhalt" },
  { slug: "schleswig-holstein", name: "Schleswig-Holstein" },
]);

/** Abweichende Schreibweisen aus ICONY-Pfaden (/partnersuche/baden-württemberg/freiburg) → kanonischer Slug. */
export const STATE_SLUG_ALIASES = Object.freeze({ "baden-württemberg": "baden-wuerttemberg" });

const ROOT = "/partnersuche";

export function statePath(slug) {
  return `${ROOT}/${slug}`;
}

export function getStateByPath(path) {
  const match = /^\/partnersuche\/([^/]+)\/?$/.exec(path);
  return match ? STATES.find((state) => state.slug === match[1]) ?? null : null;
}

export function getStateByRegion(region) {
  return STATES.find((state) => state.name === region) ?? null;
}

/** Stadtseiten eines Bundeslands, alphabetisch. */
export function citiesOfState(slug) {
  const state = STATES.find((entry) => entry.slug === slug);
  if (!state) return [];
  return Object.entries(CITY_GEO)
    .filter(([, geo]) => geo.region === state.name)
    .map(([path, geo]) => ({ path, ...geo }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

/** Nur Bundesländer mit mindestens einer Stadtseite werden ausgeliefert (keine leeren Seiten). */
export function statePages() {
  return STATES.filter((state) => citiesOfState(state.slug).length > 0).map((state) => ({ ...state, path: statePath(state.slug) }));
}

/** Bundesland-Seite einer Stadtseite (über die echte Region), sonst null (Stadtstaaten). */
export function stateOfCity(path) {
  const geo = CITY_GEO[path.replace(/\/+$/, "")];
  const state = geo ? getStateByRegion(geo.region) : null;
  return state ? { ...state, path: statePath(state.slug) } : null;
}
