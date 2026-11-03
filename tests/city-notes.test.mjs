import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { cityNoteFor } from "../lib/city-notes.mjs";

const pages = JSON.parse(fs.readFileSync(new URL("../data/pages.json", import.meta.url), "utf8")).pages;
const cityPages = pages.filter((page) => page.type === "location");

test("only the Kassel page carries the hint to the Kassel-Single-Check", () => {
  const note = cityNoteFor("/partnersuche/hessen/kassel");
  assert.ok(note);
  assert.equal(note.anchor, "Kassel-Single-Check");
  assert.equal(note.href, "https://kasseler-singles.de/#quiz");
  assert.ok(cityNoteFor("/partnersuche/hessen/kassel/"));
  assert.ok(cityPages.some((page) => page.path === "/partnersuche/hessen/kassel"));
  const withNote = cityPages.filter((page) => cityNoteFor(page.path)).map((page) => page.path);
  assert.deepEqual(withNote, ["/partnersuche/hessen/kassel"]);
});

test("the city hint stays a normal follow link before the collapsed sources", () => {
  const source = fs.readFileSync(new URL("../components/location/location-city-page.tsx", import.meta.url), "utf8");
  assert.match(source, /<a href=\{note\.href\} target="_blank" rel="noopener">/);
  assert.doesNotMatch(source, /note\.href\}[^>]*(nofollow|sponsored)/);
  assert.ok(source.indexOf("{section === firstSources ? noteBox : null}") < source.indexOf('className="sc-source-disclosure'));
});
