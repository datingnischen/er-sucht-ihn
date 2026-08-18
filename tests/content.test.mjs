import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { selectHeroImage } from "../lib/hero-image.mjs";

const catalog = JSON.parse(await readFile(new URL("../data/pages.json", import.meta.url), "utf8"));
const magazineCatalog = JSON.parse(await readFile(new URL("../data/magazine.json", import.meta.url), "utf8"));

test("the imported catalog preserves the complete unique sitemap inventory", () => {
  assert.equal(catalog.pages.length, 65);
  assert.equal(new Set(catalog.pages.map((page) => page.path)).size, 65);
  for (const path of [
    "/",
    "/partnersuche",
    "/partnersuche/berlin",
    "/partnersuche/nordrhein-westfalen/köln",
    "/partnersuche/bayern/muenchen",
    "/lexikon/gaychat",
  ]) assert.ok(catalog.pages.some((page) => page.path === path), `missing ${path}`);
});

test("every imported page has canonical SEO identity and source provenance", () => {
  for (const page of catalog.pages) {
    assert.ok(page.title);
    assert.ok(page.description);
    assert.match(page.sourceUrl, /^https:\/\/er-sucht-ihn\.de\//);
    assert.equal(page.canonical, `https://er-sucht-ihn.de${page.path === "/" ? "/" : page.path}`);
    assert.equal(page.sourceStatus, 200);
  }
});

test("dynamic member content and platform forms are not persisted", () => {
  const serialized = JSON.stringify(catalog);
  assert.doesNotMatch(serialized, /cdn3\.icony-hosting\.de\/user-media/);
  assert.doesNotMatch(serialized, /js\.icony\.com\/frame/);
  assert.doesNotMatch(serialized, /<iframe/i);
  assert.doesNotMatch(serialized, /<form/i);
  assert.doesNotMatch(serialized, /registration\/\?user=/i);
  assert.ok(catalog.pages.every((page) => page.widgetUrl === null));
});

test("imported HTML allows no active or privacy-leaking URLs", () => {
  const html = catalog.pages.map((page) => page.contentHtml).join("\n");
  assert.doesNotMatch(html, /(?:javascript|data|vbscript):/i);
  assert.doesNotMatch(html, /singleboersen-ueberblick\.de/i);
  assert.doesNotMatch(html, /hhttps?:/i);
  assert.doesNotMatch(html, /(?:href|src)=["']\.\.\//i);
  assert.doesNotMatch(html, /href=["']\/(?:videodate\.html|startseite)["']/i);
});

test("imported HTML has no broken internal links, insecure own-host URLs or foreign-brand leaks", () => {
  const publicPaths = new Set([
    ...catalog.pages.filter((page) => !["platform", "magazine"].includes(page.type)).map((page) => page.path),
    "/magazin",
    ...magazineCatalog.entries.map((entry) => entry.path),
    ...magazineCatalog.categories.map((category) => `/magazin/kategorie/${category.slug}`),
  ]);
  for (const page of catalog.pages) {
    for (const match of page.contentHtml.matchAll(/href=["']([^"']+)["']/gi)) {
      const href = match[1];
      assert.doesNotMatch(href, /^http:\/\/(?:www\.)?er-sucht-ihn\.de/i, page.path);
      assert.doesNotMatch(href, /^https?:\/\/(?:www\.)?flirt\.de/i, page.path);
      if (!href.startsWith("/")) continue;
      const target = decodeURIComponent(href.split(/[?#]/, 1)[0]).replace(/\/$/, "") || "/";
      assert.ok(publicPaths.has(target), `${page.path} links to missing ${target}`);
    }
  }
});

test("excluded platform links stay absolute for upstream ownership", () => {
  const html = catalog.pages.map((page) => page.contentHtml).join("\n");
  for (const root of ["registration", "login", "hilfe", "kontakt", "datenschutz.html", "impressum.html", "agb.html"]) {
    assert.doesNotMatch(html, new RegExp(`href=["']/${root}(?:[/?"'])`, "i"), `relative excluded link found for ${root}`);
  }
});

test("cross-links to the migrated magazine are internal and resolvable", () => {
  const html = catalog.pages.map((page) => page.contentHtml).join("\n");
  assert.doesNotMatch(html, /href=["']https?:\/\/(?:www\.)?er-sucht-ihn\.de\/magazin(?:[/?"'])/i);
  const owned = new Set([
    "/magazin",
    ...magazineCatalog.entries.map((entry) => entry.path),
    ...magazineCatalog.categories.map((category) => `/magazin/kategorie/${category.slug}`),
  ]);
  const links = [...html.matchAll(/href=["'](\/magazin[^"'?#]*)/gi)].map((match) => match[1].replace(/\/$/, ""));
  assert.ok(links.length > 0);
  for (const link of links) assert.ok(owned.has(link), `missing migrated magazine target ${link}`);
});

test("city heroes prefer representative city photography", () => {
  const berlin = catalog.pages.find((page) => page.path === "/partnersuche/berlin");
  const hero = selectHeroImage(berlin.images);
  assert.equal(hero.src, "https://static-cms.icony-hosting.de/cms/5C4F09A6F22A2A9B4BFCCB4824A1A79457D811AB410226AE056D9E8E62A04F92/er-sucht-ihn-berlin.jpg");
  assert.match(hero.alt, /Berlin/i);
});

test("editorial hero images never select recommendation seals", () => {
  for (const page of catalog.pages) assert.doesNotMatch(selectHeroImage(page.images)?.src || "", /singleboersen-ueberblick\.de/i, page.path);
});
