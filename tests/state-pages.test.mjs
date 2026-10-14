import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CITY_GEO } from "../lib/city-geo.mjs";
import { citiesOfState, getStateByPath, stateOfCity, statePages } from "../lib/state-pages.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("every state with city pages gets its own page; city states and empty states do not", () => {
  assert.deepEqual(statePages().map((state) => state.path), [
    "/partnersuche/baden-wuerttemberg", "/partnersuche/bayern", "/partnersuche/brandenburg", "/partnersuche/hessen",
    "/partnersuche/niedersachsen", "/partnersuche/nordrhein-westfalen", "/partnersuche/rheinland-pfalz",
    "/partnersuche/sachsen", "/partnersuche/sachsen-anhalt", "/partnersuche/schleswig-holstein",
  ]);
  assert.equal(getStateByPath("/partnersuche/berlin"), null);
  for (const state of statePages()) assert.ok(citiesOfState(state.slug).length > 0, state.slug);
});

test("state pages list cities by their real state, not by the ICONY path segment", () => {
  assert.deepEqual(citiesOfState("bayern").map((city) => city.path), [
    "/partnersuche/bayern/aschaffenburg", "/partnersuche/augsburg", "/partnersuche/bayern/muenchen",
    "/partnersuche/bayern/nuernberg", "/partnersuche/bayern/regensburg",
  ]);
  assert.deepEqual(citiesOfState("sachsen").map((city) => city.name), ["Dresden", "Leipzig"]);
  assert.deepEqual(citiesOfState("sachsen-anhalt").map((city) => city.name), ["Halberstadt", "Magdeburg"]);
  assert.deepEqual(citiesOfState("baden-wuerttemberg").map((city) => city.name), ["Freiburg", "Heilbronn", "Stuttgart"]);
});

test("every non-city-state city page belongs to exactly one state page", () => {
  for (const [path, geo] of Object.entries(CITY_GEO)) {
    const state = stateOfCity(path);
    if (["Berlin", "Hamburg", "Bremen"].includes(geo.region)) assert.equal(state, null, path);
    else assert.ok(state && citiesOfState(state.slug).some((city) => city.path === path), path);
  }
});

test("state URLs are rendered, listed in the sitemap and no longer redirected to the hub", async () => {
  const config = await read("../next.config.ts");
  assert.doesNotMatch(config, /source: `\/partnersuche\/\$\{state\}`/);
  assert.match(config, /"\/partnersuche\/baden-w%C3%BCrttemberg", destination: "\/partnersuche\/baden-wuerttemberg\/"/);
  assert.match(await read("../app/sitemap.ts"), /statePages\(\)/);
  const route = await read("../app/[...slug]/page.tsx");
  assert.match(route, /statePages\(\)\.map/);
  assert.match(route, /<LocationStatePage /);
  const hub = await read("../components/location/location-hub-page.tsx");
  assert.match(hub, /statePath\(state\.slug\)/);
});
