import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import test from "node:test";
import { ensureImageAlts, withImageAlts } from "../lib/image-alt.mjs";

const pages = JSON.parse(readFileSync(new URL("../data/pages.json", import.meta.url), "utf8")).pages;
const entries = JSON.parse(readFileSync(new URL("../data/magazine.json", import.meta.url), "utf8")).entries;
const MISSING_OR_EMPTY_ALT = /<img\b(?![^>]*\salt\s*=)[^>]*>|<img\b[^>]*\salt\s*=\s*(["'])\s*\1/i;

test("ensureImageAlts fills missing and empty alt texts and keeps existing ones", () => {
  assert.equal(ensureImageAlts('<img src="a.jpg"/>', "Berlin"), '<img alt="Berlin" src="a.jpg"/>');
  assert.equal(ensureImageAlts('<img alt="" src="a.jpg">', 'Er "sucht" Ihn'), '<img alt="Er &quot;sucht&quot; Ihn" src="a.jpg">');
  assert.equal(ensureImageAlts('<img alt="Dom" src="a.jpg">', "Köln"), '<img alt="Dom" src="a.jpg">');
});

test("no imported page or magazine image is rendered without alt text", () => {
  for (const page of pages) {
    const fixed = withImageAlts(page, page.h1 || page.title);
    assert.doesNotMatch(fixed.contentHtml, MISSING_OR_EMPTY_ALT, page.path);
    assert.ok(fixed.images.every((image) => image.alt.trim()), page.path);
  }
  for (const entry of entries) assert.doesNotMatch(withImageAlts(entry, entry.title).contentHtml, MISSING_OR_EMPTY_ALT, entry.path);
});

test("components never render an empty alt attribute", () => {
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = new URL(name, dir);
      if (statSync(path).isDirectory()) walk(new URL(`${name}/`, dir));
      else if (name.endsWith(".tsx")) files.push(path);
    }
  };
  walk(new URL("../app/", import.meta.url));
  walk(new URL("../components/", import.meta.url));
  for (const file of files) assert.doesNotMatch(readFileSync(file, "utf8"), /alt=""|alt=\{""\}/, file.pathname);
});
