import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { CITY_GEO, COUNTRY_BY_ROOT, cityGeo, citiesOfRoot, distanceKm, nearestCities } from "../lib/city-geo.mjs";
import { getCountryMap } from "../lib/city-map.mjs";
import { CENTRAL_POSTCODES } from "../lib/site.ts";

const pages = JSON.parse(fs.readFileSync(new URL("../data/pages.json", import.meta.url), "utf8")).pages;
const cityPaths = pages.filter((page) => page.type === "location" && page.path !== "/partnersuche").map((page) => page.path).sort();

// Grobe Landesgrenzen als Plausibilitätsrahmen (Breite, Länge).
const BOUNDS = { lat: [47.2, 55.1], lon: [5.8, 15.1] };

test("every one of the 38 city pages has coordinates and a region", () => {
  assert.equal(cityPaths.length, 38);
  assert.deepEqual(Object.keys(CITY_GEO).sort(), cityPaths);
  assert.deepEqual(Object.keys(CITY_GEO).sort(), Object.keys(CENTRAL_POSTCODES).sort());
  for (const [path, geo] of Object.entries(CITY_GEO)) {
    assert.ok(geo.lat >= BOUNDS.lat[0] && geo.lat <= BOUNDS.lat[1], `${path} lat`);
    assert.ok(geo.lon >= BOUNDS.lon[0] && geo.lon <= BOUNDS.lon[1], `${path} lon`);
    assert.ok(geo.region.length > 2, `${path} region`);
    assert.ok(geo.name.length > 1, `${path} name`);
  }
  assert.equal(cityGeo("/partnersuche/berlin/").name, "Berlin");
  assert.equal(cityGeo("/partnersuche/nordrhein-westfalen/köln").region, "Nordrhein-Westfalen");
  assert.equal(cityGeo("/partnersuche/sachsen/halberstadt").region, "Sachsen-Anhalt", "Halberstadt liegt in Sachsen-Anhalt, auch wenn der ICONY-Pfad Sachsen sagt");
});

test("haversine distances match known air-line distances", () => {
  const km = (a, b) => distanceKm(CITY_GEO[a], CITY_GEO[b]);
  assert.ok(Math.abs(km("/partnersuche/berlin", "/partnersuche/hamburg") - 255) <= 5);
  assert.ok(Math.abs(km("/partnersuche/bayern/muenchen", "/partnersuche/bayern/nuernberg") - 151) <= 5);
  assert.ok(Math.abs(km("/partnersuche/nordrhein-westfalen/köln", "/partnersuche/nordrhein-westfalen/bonn") - 24) <= 3);
  assert.equal(km("/partnersuche/essen", "/partnersuche/essen"), 0);
});

test("nearest city pages are sorted and exclude the page itself", () => {
  const near = nearestCities("/partnersuche/essen", 5);
  assert.equal(near.length, 5);
  assert.ok(near.every((entry) => entry.path !== "/partnersuche/essen"));
  assert.deepEqual([...near].sort((a, b) => a.km - b.km), near);
  assert.deepEqual(near.slice(0, 2).map((entry) => entry.name), ["Bochum", "Duisburg"]);
  assert.equal(nearestCities("/partnersuche/flensburg", 1)[0].name, "Hamburg");
  assert.deepEqual(nearestCities("/partnersuche/reutlingen"), []);
});

test("the hub map places every city inside the drawing and labels most of them", () => {
  const map = getCountryMap("partnersuche");
  assert.equal(map.cities.length, citiesOfRoot("partnersuche").length);
  assert.equal(map.cities.length, 38);
  for (const city of map.cities) {
    assert.ok(city.x > 0 && city.x < map.width && city.y > 0 && city.y < map.height, `${city.path} inside map`);
  }
  const labelled = map.cities.filter((city) => city.label).length;
  assert.ok(labelled / map.cities.length >= 0.6, `${labelled} labels`);
  assert.equal(Object.keys(COUNTRY_BY_ROOT).length, 1);
});
