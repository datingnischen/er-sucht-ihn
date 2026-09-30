/**
 * Geografie der 38 Stadtseiten: nur für Entfernungen (Luftlinie), Regionsangaben und die Deutschlandkarte.
 * Koordinaten = Stadtzentrum (Rathaus/Altstadt), gerundet auf vier Nachkommastellen.
 * Die Pfade sind die ICONY-Pfade (teils mit Bundesland-Segment); `region` ist das tatsächliche Bundesland.
 * Emsland ist ein Landkreis, Bezugspunkt ist die Kreisstadt Meppen.
 */

export const COUNTRY_BY_ROOT = Object.freeze({
  partnersuche: { code: "de", name: "Deutschland", inName: "in Deutschland", icony: 49, regionLabel: "Bundesland", regionLabelPlural: "Bundesländer" },
});

/** @type {Readonly<Record<string, { name: string; lat: number; lon: number; region: string }>>} */
export const CITY_GEO = Object.freeze({
  "/partnersuche/augsburg": { name: "Augsburg", lat: 48.3705, lon: 10.8978, region: "Bayern" },
  "/partnersuche/baden-wuerttemberg/stuttgart": { name: "Stuttgart", lat: 48.7758, lon: 9.1829, region: "Baden-Württemberg" },
  "/partnersuche/baden-württemberg/freiburg": { name: "Freiburg", lat: 47.999, lon: 7.8421, region: "Baden-Württemberg" },
  "/partnersuche/baden-württemberg/heilbronn": { name: "Heilbronn", lat: 49.1427, lon: 9.2109, region: "Baden-Württemberg" },
  "/partnersuche/bayern/aschaffenburg": { name: "Aschaffenburg", lat: 49.9769, lon: 9.1582, region: "Bayern" },
  "/partnersuche/bayern/muenchen": { name: "München", lat: 48.1351, lon: 11.582, region: "Bayern" },
  "/partnersuche/bayern/nuernberg": { name: "Nürnberg", lat: 49.4521, lon: 11.0767, region: "Bayern" },
  "/partnersuche/bayern/regensburg": { name: "Regensburg", lat: 49.0134, lon: 12.1016, region: "Bayern" },
  "/partnersuche/berlin": { name: "Berlin", lat: 52.52, lon: 13.405, region: "Berlin" },
  "/partnersuche/bielefeld": { name: "Bielefeld", lat: 52.0302, lon: 8.5325, region: "Nordrhein-Westfalen" },
  "/partnersuche/bremen": { name: "Bremen", lat: 53.0793, lon: 8.8017, region: "Bremen" },
  "/partnersuche/cottbus": { name: "Cottbus", lat: 51.7563, lon: 14.3329, region: "Brandenburg" },
  "/partnersuche/duisburg": { name: "Duisburg", lat: 51.4344, lon: 6.7623, region: "Nordrhein-Westfalen" },
  "/partnersuche/essen": { name: "Essen", lat: 51.4556, lon: 7.0116, region: "Nordrhein-Westfalen" },
  "/partnersuche/flensburg": { name: "Flensburg", lat: 54.7937, lon: 9.4469, region: "Schleswig-Holstein" },
  "/partnersuche/hamburg": { name: "Hamburg", lat: 53.5511, lon: 9.9937, region: "Hamburg" },
  "/partnersuche/hessen/frankfurt": { name: "Frankfurt", lat: 50.1109, lon: 8.6821, region: "Hessen" },
  "/partnersuche/hessen/giessen": { name: "Gießen", lat: 50.5841, lon: 8.6784, region: "Hessen" },
  "/partnersuche/hessen/kassel": { name: "Kassel", lat: 51.3127, lon: 9.4797, region: "Hessen" },
  "/partnersuche/kaiserslautern": { name: "Kaiserslautern", lat: 49.4401, lon: 7.7491, region: "Rheinland-Pfalz" },
  "/partnersuche/koblenz": { name: "Koblenz", lat: 50.3569, lon: 7.589, region: "Rheinland-Pfalz" },
  "/partnersuche/muenster": { name: "Münster", lat: 51.9607, lon: 7.6261, region: "Nordrhein-Westfalen" },
  "/partnersuche/niedersachsen/braunschweig": { name: "Braunschweig", lat: 52.2689, lon: 10.5268, region: "Niedersachsen" },
  "/partnersuche/niedersachsen/cloppenburg": { name: "Cloppenburg", lat: 52.8471, lon: 8.0439, region: "Niedersachsen" },
  "/partnersuche/niedersachsen/emsland": { name: "Emsland", lat: 52.6906, lon: 7.291, region: "Niedersachsen" },
  "/partnersuche/niedersachsen/hannover": { name: "Hannover", lat: 52.3759, lon: 9.732, region: "Niedersachsen" },
  "/partnersuche/niedersachsen/hildesheim": { name: "Hildesheim", lat: 52.1548, lon: 9.958, region: "Niedersachsen" },
  "/partnersuche/niedersachsen/oldenburg": { name: "Oldenburg", lat: 53.1435, lon: 8.2146, region: "Niedersachsen" },
  "/partnersuche/nordrhein-westfalen/bochum": { name: "Bochum", lat: 51.4818, lon: 7.2162, region: "Nordrhein-Westfalen" },
  "/partnersuche/nordrhein-westfalen/bonn": { name: "Bonn", lat: 50.7374, lon: 7.0982, region: "Nordrhein-Westfalen" },
  "/partnersuche/nordrhein-westfalen/duesseldorf": { name: "Düsseldorf", lat: 51.2277, lon: 6.7735, region: "Nordrhein-Westfalen" },
  "/partnersuche/nordrhein-westfalen/krefeld": { name: "Krefeld", lat: 51.3388, lon: 6.5853, region: "Nordrhein-Westfalen" },
  "/partnersuche/nordrhein-westfalen/köln": { name: "Köln", lat: 50.9375, lon: 6.9603, region: "Nordrhein-Westfalen" },
  "/partnersuche/sachsen-anhalt/magdeburg": { name: "Magdeburg", lat: 52.1205, lon: 11.6276, region: "Sachsen-Anhalt" },
  "/partnersuche/sachsen/dresden": { name: "Dresden", lat: 51.0504, lon: 13.7373, region: "Sachsen" },
  "/partnersuche/sachsen/halberstadt": { name: "Halberstadt", lat: 51.8958, lon: 11.0498, region: "Sachsen-Anhalt" },
  "/partnersuche/sachsen/leipzig": { name: "Leipzig", lat: 51.3397, lon: 12.3731, region: "Sachsen" },
  "/partnersuche/wuppertal": { name: "Wuppertal", lat: 51.2562, lon: 7.1508, region: "Nordrhein-Westfalen" },
});

function stripSlash(path) {
  return typeof path === "string" ? path.replace(/\/+$/, "") || "/" : "";
}

export function cityGeo(path) {
  return CITY_GEO[stripSlash(path)] ?? null;
}

export function rootOf(path) {
  return stripSlash(path).split("/")[1] || "";
}

/** Luftlinie in ganzen Kilometern (Haversine, Erdradius 6371 km). */
export function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)));
}

/**
 * Nächste Stadtseiten ab `path`.
 * @returns {{ path: string; name: string; region: string; country: string; km: number }[]}
 */
export function nearestCities(path, count = 5) {
  const origin = cityGeo(path);
  if (!origin) return [];
  const self = stripSlash(path);
  return Object.entries(CITY_GEO)
    .filter(([other]) => other !== self)
    .map(([other, geo]) => ({ path: other, name: geo.name, region: geo.region, country: COUNTRY_BY_ROOT[rootOf(other)].name, km: distanceKm(origin, geo) }))
    .sort((a, b) => a.km - b.km || a.name.localeCompare(b.name, "de"))
    .slice(0, count);
}

/** Stadtseiten eines Landes (Wurzelpfad), alphabetisch. */
export function citiesOfRoot(root) {
  return Object.entries(CITY_GEO)
    .filter(([path]) => rootOf(path) === root)
    .map(([path, geo]) => ({ path, ...geo }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}
