import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = async (path) => readFile(new URL(path, import.meta.url), "utf8");
const pages = JSON.parse(await read("../data/pages.json")).pages;
const magazine = JSON.parse(await read("../data/magazine.json"));
const retired = JSON.parse(await read("../data/magazine-lexikon.json")).entries;
const SLUGS = ["gaychat", "seitensprung-affaere", "singleboerse-seitensprung"];

test("the former lexicon articles are magazine posts with canonical magazine URLs", () => {
  assert.deepEqual(retired.map((entry) => entry.slug), SLUGS);
  const categories = new Map(magazine.categories.map((category) => [category.slug, category.id]));
  const wordpressIds = new Set(magazine.entries.map((entry) => entry.id));
  const wordpressPaths = new Set(magazine.entries.map((entry) => entry.path));
  for (const entry of retired) {
    assert.equal(entry.type, "post");
    assert.equal(entry.path, `/magazin/${entry.slug}`);
    assert.equal(entry.canonical, `https://er-sucht-ihn.de/magazin/${entry.slug}`);
    assert.ok(!wordpressIds.has(entry.id) && !wordpressPaths.has(entry.path), entry.slug);
    assert.ok(entry.categories.length && entry.categories.every((category) => categories.get(category.slug) === category.id), entry.slug);
    assert.match(entry.featuredImage, /^https:\/\/static-cms\.icony-hosting\.de\//);
    assert.doesNotMatch(entry.contentHtml, /<\/?div\b|<p>\s*<\/p>|<h2>\s*<\/h2>|er-sucht-ihn\.de<\/h/);
    assert.doesNotMatch(entry.contentHtml, new RegExp(`src="${entry.featuredImage}"`), "hero image is not repeated in the body");
  }
});

test("no public page or magazine entry links to the retired lexicon", () => {
  assert.equal(pages.some((page) => page.path === "/lexikon" || page.path.startsWith("/lexikon/")), false);
  for (const item of [...pages, ...magazine.entries, ...retired]) assert.doesNotMatch(item.contentHtml, /href="\/lexikon/, item.path);
});

test("lexicon URLs redirect permanently into the magazine and leave the navigation", async () => {
  const config = await read("../next.config.ts");
  assert.match(config, /\{ source: "\/lexikon", destination: "\/magazin\/", permanent: true \}/);
  assert.match(config, /\{ source: "\/lexikon\/:slug", destination: "\/magazin\/:slug\/", permanent: true \}/);
  const shell = await read("../components/site-shell.tsx");
  const llms = await read("../app/llms.txt/route.ts");
  assert.doesNotMatch(shell + llms, /Lexikon|\/lexikon/);
  assert.match(await read("../lib/magazine.ts"), /magazine-lexikon\.json/);
});
