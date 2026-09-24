import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { INDIVIDUAL_SEARCH_URL } from "../lib/site.ts";

test("individual search fallback links to the live ICONY search with AID=location", () => {
  assert.equal(INDIVIDUAL_SEARCH_URL, "https://er-sucht-ihn.de/suche/?AID=location");
});

test("the city overview renders the individual search fallback below the city grid", async () => {
  const [section, fallback, css] = await Promise.all([
    readFile(new URL("../components/city-card-section.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/city-search-fallback.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/city-search-fallback.css", import.meta.url), "utf8"),
  ]);
  assert.match(section, /import \{ CitySearchFallback \} from "@\/components\/city-search-fallback"/);
  assert.match(section, /className="city-card-grid"[\s\S]*<\/div>\s*<CitySearchFallback \/>/);
  assert.match(fallback, /href=\{INDIVIDUAL_SEARCH_URL\}/);
  assert.match(fallback, /Deine Stadt fehlt\?/);
  assert.match(fallback, /import "\.\/city-search-fallback\.css"/);
  assert.doesNotMatch(fallback, /vercel\.app/);
  assert.match(css, /@media\(max-width:720px\)\{\.city-search-fallback\{[^}]*flex-direction:column/);
});
