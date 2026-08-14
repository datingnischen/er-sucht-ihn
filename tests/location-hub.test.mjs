import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildCityCards, getHubPresentation, removeLegacyCityLists } from "../lib/location-hub.mjs";

const catalog = JSON.parse(await readFile(new URL("../data/pages.json", import.meta.url), "utf8"));
const pages = catalog.pages;
const globalCss = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("the German partnersuche hub exposes every discovered city as a visual card", () => {
  const cards = buildCityCards(pages, "partnersuche");
  assert.equal(cards.length, 38);
  assert.deepEqual(cards.slice(0, 6).map((card) => card.name), ["Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart"]);
  for (const card of cards) {
    assert.match(card.path, /^\/partnersuche\/(?:[\p{L}0-9-]+\/)*[\p{L}0-9-]+$/u);
    assert.ok(card.name);
    assert.ok(card.teaser.length > 20);
    assert.doesNotMatch(card.teaser, /Frauen|Lesben/i);
    assert.equal(card.registrationUrl, "https://er-sucht-ihn.de/registration/?AID=location");
    if (card.image) {
      assert.match(card.image.src, /^https:\/\/static-cms\.icony-hosting\.de\//);
      assert.doesNotMatch(card.image.src, /statistik|statistics|flagge|singleboersen-ueberblick/i);
    }
  }
});

test("city cards use representative source photography and location tracking", () => {
  const cards = buildCityCards(pages, "partnersuche");
  const stuttgart = cards.find((card) => card.path === "/partnersuche/baden-wuerttemberg/stuttgart");
  assert.match(stuttgart.image.src, /er-sucht-ihn-stuttgart1\.jpg$/);
  assert.equal(stuttgart.registrationUrl, "https://er-sucht-ihn.de/registration/?AID=location");
  assert.equal(cards.find((card) => card.path === "/partnersuche/bielefeld").image, null);
});

test("the visual hub replaces the legacy city list and duplicate title image without touching prose", () => {
  const hub = pages.find((page) => page.path === "/partnersuche");
  const cleaned = removeLegacyCityLists(hub.contentHtml, "partnersuche", hub.h1);
  assert.doesNotMatch(cleaned, /<ul>[\s\S]*href=["']\/partnersuche\//i);
  assert.match(cleaned, /Willkommen bei <strong>Er-sucht-Ihn<\/strong>/);
  assert.match(cleaned, /Vielfalt der schwulen Community/);
  assert.doesNotMatch(cleaned, /er-sucht-ihn-de-titelbild/);
});

test("the German hub presents male-audience copy", () => {
  assert.deepEqual(getHubPresentation("partnersuche"), {
    kicker: "Deutschland entdecken",
    heading: "Wähle Deine Stadt",
    intro: "Von Berlin bis Freiburg: Entdecke Datingtipps, Treffpunkte und Männer aus Deiner Region.",
    ctaTitle: "Deine Stadt ist schon dabei.",
    ctaLabel: "Männer in meiner Region finden",
  });
});

test("long imported source URLs wrap inside the editorial content column", () => {
  assert.match(globalCss, /\.rich-content\s*\{[^}]*overflow-wrap\s*:\s*anywhere/i);
});

test("city cards disable motion when the visitor requests reduced motion", () => {
  assert.match(globalCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.city-tile img[^}]*transition:\s*none[^}]*transform:\s*none/i);
  assert.match(globalCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.city-tile-action[^}]*transition:\s*none[^}]*transform:\s*none/i);
});
