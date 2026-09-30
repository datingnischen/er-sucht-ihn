import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { PAGE_PHOTOS, withPagePhoto } from "../lib/page-photos.mjs";
import { selectHeroImage } from "../lib/hero-image.mjs";
import { aboutPathForImportedPath } from "../lib/about-pages.mjs";

const pages = JSON.parse(readFileSync(new URL("../data/pages.json", import.meta.url), "utf8")).pages;

test("FAQ and reviews get their own men photos instead of the imported ICONY images", () => {
  for (const [path, photo] of Object.entries(PAGE_PHOTOS)) {
    const raw = pages.find((entry) => aboutPathForImportedPath(entry.path) === path);
    assert.ok(raw, path);
    const page = { ...raw, path };
    assert.ok(existsSync(new URL(`../public${photo.file}`, import.meta.url)), photo.file);
    assert.ok(existsSync(new URL(`../public${photo.source}`, import.meta.url)), `Quelle ${photo.source} liegt im Magazin`);
    assert.ok(page.images.some((image) => image.src.includes(photo.replaces)), `${path} enthält ${photo.replaces} im Import`);
    const fixed = withPagePhoto(page, (file) => `https://assets.example${file}`);
    assert.equal(selectHeroImage(fixed.images).src, `https://assets.example${photo.file}`);
    assert.ok(fixed.images.every((image) => !image.src.includes(photo.replaces)));
    assert.doesNotMatch(fixed.contentHtml, new RegExp(photo.replaces.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.ok(photo.alt.length > 20);
  }
});

test("pages without an own photo stay untouched", () => {
  const berlin = pages.find((entry) => entry.path === "/partnersuche/berlin");
  assert.equal(withPagePhoto(berlin), berlin);
});

test("the content pipeline applies the page photos", () => {
  const content = readFileSync(new URL("../lib/content.ts", import.meta.url), "utf8");
  assert.match(content, /withPagePhoto\(page, staticAsset\)/);
});
