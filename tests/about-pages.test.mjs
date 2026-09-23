import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ABOUT_PAGE_MOVES, ABOUT_REVIEWS_PATH, ABOUT_SOCIAL_PATH, aboutPathForImportedPath, aboutRedirects } from "../lib/about-pages.mjs";
import { buildBreadcrumbs } from "../lib/breadcrumbs.mjs";

const catalog = JSON.parse(readFileSync(new URL("../data/pages.json", import.meta.url), "utf8"));

test("reviews and social media live below the about area", () => {
  assert.equal(aboutPathForImportedPath("/bewertungen-und-erfahrungen"), "/ueber-uns/bewertungen");
  assert.equal(aboutPathForImportedPath("/social-media"), "/ueber-uns/social-media");
  assert.equal(aboutPathForImportedPath("/faq"), "/faq");
});

test("every moved about page exists in the imported catalog", () => {
  const paths = new Set(catalog.pages.map((page) => page.path));
  for (const legacyPath of Object.keys(ABOUT_PAGE_MOVES)) assert.ok(paths.has(legacyPath), legacyPath);
});

test("legacy about URLs redirect permanently to the nested pages", () => {
  assert.deepEqual(aboutRedirects.find((item) => item.source === "/bewertungen-und-erfahrungen"), { source: "/bewertungen-und-erfahrungen", destination: ABOUT_REVIEWS_PATH, permanent: true });
  assert.deepEqual(aboutRedirects.find((item) => item.source === "/social-media"), { source: "/social-media", destination: ABOUT_SOCIAL_PATH, permanent: true });
});

test("about breadcrumbs name the parent area", () => {
  assert.deepEqual(buildBreadcrumbs("/ueber-uns/bewertungen", "Bewertungen").map((item) => item.name), ["Start", "Über uns", "Bewertungen"]);
});

test("header and footer link the about area and its subpages", () => {
  const shell = readFileSync(new URL("../components/site-shell.tsx", import.meta.url), "utf8");
  assert.match(shell, /\["Über uns", ABOUT_ROOT_PATH\]/);
  assert.match(shell, /<FooterColumn title="Über uns" links=\{\[[^\n]*ABOUT_REVIEWS_PATH[^\n]*ABOUT_SOCIAL_PATH/);
  assert.doesNotMatch(shell, /"\/bewertungen-und-erfahrungen"|"\/social-media"/);
});
