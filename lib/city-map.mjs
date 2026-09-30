import maps from "../data/country-maps.json" with { type: "json" };
import { COUNTRY_BY_ROOT, citiesOfRoot } from "./city-geo.mjs";

/**
 * Landeskarte der Städteübersicht ohne Kartenbibliothek: Umriss aus data/country-maps.json
 * (scripts/build_country_maps.py, Natural Earth, Public Domain), Städte mit derselben Projektion.
 */

const LABEL_SIZE = 34;
const PIN_RADIUS = 19;

export function projectPoint(map, lat, lon) {
  const { k, minX, minY, scale, pad } = map.projection;
  return { x: (lon * k - minX) * scale + pad, y: (-lat - minY) * scale + pad };
}

const overlaps = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;

/** Beschriftungen gierig platzieren: rechts, links, oben, unten – sonst weglassen (der Pin bleibt klickbar, Titel als Tooltip). */
export function placeLabels(cities, width, height) {
  const pins = cities.map((city) => ({ x1: city.x - PIN_RADIUS, y1: city.y - PIN_RADIUS, x2: city.x + PIN_RADIUS, y2: city.y + PIN_RADIUS }));
  const placed = [];
  // Große Städte zuerst beschriften, damit sie im Gedränge (Ruhrgebiet, Rhein-Main) Vorrang haben.
  const order = cities.map((city, index) => ({ city, index })).sort((a, b) => (b.city.priority ?? 0) - (a.city.priority ?? 0) || a.index - b.index);
  const labels = new Array(cities.length).fill(null);
  for (const { city, index } of order) {
    const w = city.name.length * LABEL_SIZE * 0.58;
    const h = LABEL_SIZE;
    const gap = PIN_RADIUS + 7;
    const options = [
      { box: { x1: city.x + gap, y1: city.y - h / 2, x2: city.x + gap + w, y2: city.y + h / 2 }, label: { x: city.x + gap, y: city.y + 12, anchor: "start" } },
      { box: { x1: city.x - gap - w, y1: city.y - h / 2, x2: city.x - gap, y2: city.y + h / 2 }, label: { x: city.x - gap, y: city.y + 12, anchor: "end" } },
      { box: { x1: city.x - w / 2, y1: city.y - gap - h, x2: city.x + w / 2, y2: city.y - gap }, label: { x: city.x, y: city.y - gap - 8, anchor: "middle" } },
      { box: { x1: city.x - w / 2, y1: city.y + gap, x2: city.x + w / 2, y2: city.y + gap + h }, label: { x: city.x, y: city.y + gap + 27, anchor: "middle" } },
    ];
    const fit = options.find(({ box }) =>
      box.x1 >= -60 && box.x2 <= width + 60 && box.y1 >= -20 && box.y2 <= height + 20
      && !placed.some((other) => overlaps(box, other))
      && !pins.some((pin, pinIndex) => pinIndex !== index && overlaps(box, pin)));
    if (fit) {
      placed.push(fit.box);
      labels[index] = fit.label;
    }
  }
  return cities.map((city, index) => ({ ...city, label: labels[index] }));
}

/** Größere Städte zuerst beschriften (grobe Rangfolge, nur für die Kartenbeschriftung). */
const LABEL_PRIORITY = [
  "berlin", "hamburg", "muenchen", "köln", "frankfurt", "stuttgart", "duesseldorf", "leipzig", "essen", "bremen",
  "dresden", "hannover", "nuernberg", "duisburg", "bochum", "wuppertal", "bielefeld", "bonn", "muenster", "augsburg",
  "freiburg", "magdeburg", "kassel", "braunschweig", "regensburg", "flensburg", "cottbus", "koblenz", "kaiserslautern",
];

/**
 * @typedef {{ x: number; y: number; anchor: "start" | "end" | "middle" }} MapLabel
 * @typedef {{ path: string; name: string; region: string; x: number; y: number; priority: number; label: MapLabel | null }} MapCity
 */

/**
 * Kartendaten einer Übersicht.
 * @param {"partnersuche"} root
 * @returns {{ width: number; height: number; path: string; cities: MapCity[] }}
 */
export function getCountryMap(root) {
  const country = COUNTRY_BY_ROOT[root];
  const map = maps[country.code];
  const cities = citiesOfRoot(root).map((city) => {
    const point = projectPoint(map, city.lat, city.lon);
    const slug = city.path.split("/").at(-1);
    const rank = LABEL_PRIORITY.indexOf(slug);
    return { path: city.path, name: city.name, region: city.region, x: Math.round(point.x), y: Math.round(point.y), priority: rank < 0 ? 0 : LABEL_PRIORITY.length - rank };
  });
  return { width: map.width, height: map.height, path: map.path, cities: placeLabels(cities, map.width, map.height) };
}

/**
 * Nur der Umriss (für Mini-Silhouetten der Länder-Einstiegskarten).
 * @returns {{ width: number; height: number; path: string }}
 */
export function getCountryOutline(root) {
  const map = maps[COUNTRY_BY_ROOT[root].code];
  return { width: map.width, height: map.height, path: map.path };
}
