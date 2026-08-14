import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildRelatedCards } from "../lib/related-cards.mjs";

const catalog = JSON.parse(await readFile(new URL("../data/pages.json", import.meta.url), "utf8"));
const pages = catalog.pages;

test("Berlin related cards use six existing German city pages", () => {
  const cards = buildRelatedCards(pages, "/partnersuche/berlin", "partnersuche");
  assert.equal(cards.length, 6);
  assert.equal(cards.some((card) => card.path === "/partnersuche/berlin"), false);
  for (const card of cards) {
    assert.ok(pages.some((page) => page.path === card.path));
    assert.match(card.path, /^\/partnersuche\//);
    assert.doesNotMatch(card.image?.src || "", /statistik|statistics|community|profil|flagge|testbericht|singleboersen-ueberblick/i);
  }
});

test("related card renderer provides lazy thumbnails and a deliberate fallback", async () => {
  const source = await readFile(new URL("../components/related-card-section.tsx", import.meta.url), "utf8");
  assert.match(source, /loading="lazy"/);
  assert.match(source, /related-card-fallback/);
});

test("compact related cards have cropped media, visible focus and reduced-motion protection", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.related-card-media img\{[^}]*object-fit:cover/i);
  assert.match(css, /\.related-card:focus-visible\{[^}]*outline:/i);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.related-grid a\.related-card\{[^}]*transition:none/i);
});
