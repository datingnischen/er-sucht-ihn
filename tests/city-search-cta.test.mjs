import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CENTRAL_POSTCODES, citySearchUrl } from "../lib/site.ts";

const catalog = JSON.parse(await readFile(new URL("../data/pages.json", import.meta.url), "utf8"));
const detailPaths = catalog.pages
  .filter((page) => page.type === "location" && page.path !== "/partnersuche")
  .map((page) => page.path)
  .sort();

test("central postcodes cover exactly all 38 location detail routes", () => {
  assert.equal(detailPaths.length, 38);
  assert.deepEqual(Object.keys(CENTRAL_POSTCODES).sort(), detailPaths);
  for (const path of detailPaths) {
    assert.match(CENTRAL_POSTCODES[path], /^\d{5}$/, path);
    assert.equal(citySearchUrl(path), `https://er-sucht-ihn.de/suche/?plz=${CENTRAL_POSTCODES[path]}&AID=location`);
  }
});

test("city search URLs use central rather than widget-locality postcodes", () => {
  assert.equal(citySearchUrl("/partnersuche/berlin"), "https://er-sucht-ihn.de/suche/?plz=10117&AID=location");
  assert.equal(citySearchUrl("/partnersuche/hamburg"), "https://er-sucht-ihn.de/suche/?plz=20095&AID=location");
  assert.equal(citySearchUrl("/partnersuche/hessen/frankfurt"), "https://er-sucht-ihn.de/suche/?plz=60311&AID=location");
  assert.equal(citySearchUrl("/partnersuche/niedersachsen/emsland"), "https://er-sucht-ihn.de/suche/?plz=49716&AID=location");
});

test("city search URL creation fails closed for a missing route mapping", () => {
  assert.throws(() => citySearchUrl("/partnersuche"), /Missing central postcode.*\/partnersuche/);
  assert.throws(() => citySearchUrl("/partnersuche/unknown"), /Missing central postcode.*\/partnersuche\/unknown/);
});

test("city search URL creation fails closed for malformed configured postcodes", () => {
  assert.throws(
    () => citySearchUrl("/partnersuche/berlin", { "/partnersuche/berlin": "1011" }),
    /Invalid central postcode.*1011.*\/partnersuche\/berlin/,
  );
  assert.throws(
    () => citySearchUrl("/partnersuche/berlin", { "/partnersuche/berlin": "ABCDE" }),
    /Invalid central postcode.*ABCDE.*\/partnersuche\/berlin/,
  );
});

test("the city-search CTA renders beside the widget only for location details", async () => {
  const [renderer, css] = await Promise.all([
    readFile(new URL("../app/[...slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(renderer, /import \{[^}]*citySearchUrl[^}]*\} from "@\/lib\/site"/);
  assert.match(renderer, /const isLocationDetail = page\.type === "location" && path !== "\/partnersuche"/);
  assert.match(
    renderer,
    /isLocationDetail && page\.widgetUrl[\s\S]*href=\{citySearchUrl\(path\)\}[\s\S]*Ausführlicher in \{locationName\(path\)\} suchen[\s\S]*<\/section>/,
  );
  assert.equal(renderer.match(/citySearchUrl\(path\)/g)?.length, 1);
  assert.equal(renderer.match(/href=\{registrationUrl\(path\)\}/g)?.length, 3);
  assert.match(css, /\.city-singles-widget-action \.button\s*\+\s*\.button\s*\{[^}]*margin-top:/);
});
