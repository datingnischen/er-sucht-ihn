import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { ABOUT_SEARCH_PATH } from "../lib/about-pages.mjs";
import { classifyPath } from "../lib/site-contract.mjs";
import { buildSearchIndex, cleanSearchQuery, htmlToText, normalizeSearchText, searchIndex } from "../lib/site-search.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

test("site search lives below the about area, never on the ICONY /suche route", () => {
  assert.equal(ABOUT_SEARCH_PATH, "/ueber-uns/suche");
  assert.ok(existsSync(new URL("../app/ueber-uns/suche/page.tsx", import.meta.url)));
  assert.ok(!existsSync(new URL("../app/suche", import.meta.url)), "no root /suche route");
  assert.equal(classifyPath("/suche"), "platform");
  assert.equal(classifyPath(ABOUT_SEARCH_PATH), "editorial");
  const catalog = JSON.parse(read("../data/pages.json"));
  assert.ok(!catalog.pages.some((page) => page.path === ABOUT_SEARCH_PATH), "no imported page collides with the search route");
});

test("search page is noindex, follow with a query-free canonical and stays out of the sitemap", () => {
  const page = read("../app/ueber-uns/suche/page.tsx");
  assert.match(page, /robots: \{ index: false, follow: true \}/);
  assert.match(page, /const canonical = publicUrl\(ABOUT_SEARCH_PATH\)/);
  assert.match(page, /alternates: \{ canonical \}/);
  const sitemap = read("../app/sitemap.ts");
  assert.doesNotMatch(sitemap, /ABOUT_SEARCH_PATH|suche/);
});

test("header and about hub link the search via the path helper", () => {
  const shell = read("../components/site-shell.tsx");
  assert.match(shell, /href=\{withTrailingSlash\(ABOUT_SEARCH_PATH\)\}/);
  assert.doesNotMatch(shell, /"\/suche/);
  const hub = read("../app/ueber-uns/page.tsx");
  assert.match(hub, /<SiteSearchForm/);
  const form = read("../components/site-search-form.tsx");
  assert.match(form, /action=\{withTrailingSlash\(ABOUT_SEARCH_PATH\)\} method="get"/);
  assert.match(form, /name="q"/);
});

test("normalisation folds umlauts, ß and diacritics", () => {
  assert.equal(normalizeSearchText("Köln"), "koeln");
  assert.equal(normalizeSearchText("Straße"), "strasse");
  assert.equal(normalizeSearchText("Café Coming-Out"), "cafe coming out");
  assert.equal(htmlToText("<p>Gay&nbsp;Bars &amp; Clubs</p><script>x()</script>"), "Gay Bars & Clubs");
  assert.equal(cleanSearchQuery(["  Köln  ", "x"]), "Köln");
  assert.equal(cleanSearchQuery(undefined), "");
});

test("title hits rank before text hits, every term must match, results are capped", () => {
  const index = buildSearchIndex([
    { area: "Magazin", title: "Coming out", description: "", text: "Tipps für Köln", href: "/magazin/coming-out/" },
    { area: "Stadt", title: "Er sucht Ihn in Köln", description: "Männer aus Köln", text: "", href: "/partnersuche/nordrhein-westfalen/köln/" },
    { area: "Magazin", title: "Gaychat", description: "", text: "Chatten", href: "/magazin/gaychat/" },
  ]);
  const hits = searchIndex(index, "koeln");
  assert.deepEqual(hits.map((hit) => hit.href), ["/partnersuche/nordrhein-westfalen/köln/", "/magazin/coming-out/"]);
  assert.equal(hits[0].area, "Stadt");
  assert.deepEqual(searchIndex(index, "köln gaychat"), []);
  assert.deepEqual(searchIndex(index, ""), []);
  const many = buildSearchIndex(Array.from({ length: 80 }, (_, i) => ({ area: "Magazin", title: `Dating ${i}`, description: "", text: "", href: `/magazin/${i}/` })));
  assert.equal(searchIndex(many, "dating").length, 50);
});

test("imported snapshots are searchable: cities and magazine articles", () => {
  const pages = JSON.parse(read("../data/pages.json")).pages.filter((page) => page.type === "location");
  const magazine = JSON.parse(read("../data/magazine.json")).entries;
  const index = buildSearchIndex([
    ...magazine.map((entry) => ({ area: "Magazin", title: htmlToText(entry.title), description: htmlToText(entry.description), text: htmlToText(entry.contentHtml), href: entry.path })),
    ...pages.map((page) => ({ area: "Stadt", title: page.h1, description: page.description, text: htmlToText(page.contentHtml), href: page.path })),
  ]);
  assert.equal(searchIndex(index, "Köln")[0].area, "Stadt");
  assert.ok(searchIndex(index, "adoptieren").some((hit) => hit.area === "Magazin"));
});
