import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { publicUrl, slashInternalLinks, withTrailingSlash } from "../lib/site-contract.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("page paths end with a slash, files keep their extension", () => {
  assert.equal(withTrailingSlash("/"), "/");
  assert.equal(withTrailingSlash("/magazin"), "/magazin/");
  assert.equal(withTrailingSlash("/magazin/"), "/magazin/");
  assert.equal(withTrailingSlash("/partnersuche/bayern/muenchen"), "/partnersuche/bayern/muenchen/");
  assert.equal(withTrailingSlash("/registration?AID=magazin"), "/registration/?AID=magazin");
  assert.equal(withTrailingSlash("/magazin/gaychat#chat"), "/magazin/gaychat/#chat");
  for (const file of ["/sitemap.xml", "/robots.txt", "/agb.html", "/magazin/sitemap.xml", "/magazine/media/1552-bild.jpg", "/magazin/wp-content/uploads/2021/01/bild-300x200.jpg"]) {
    assert.equal(withTrailingSlash(file), file);
  }
});

test("public URLs for canonicals, sitemaps and JSON-LD end with a slash", () => {
  assert.equal(publicUrl("/"), "https://er-sucht-ihn.de/");
  assert.equal(publicUrl("/ueber-uns"), "https://er-sucht-ihn.de/ueber-uns/");
  assert.equal(publicUrl("/partnersuche/nordrhein-westfalen/köln"), "https://er-sucht-ihn.de/partnersuche/nordrhein-westfalen/köln/");
  assert.equal(publicUrl("/sitemap.xml"), "https://er-sucht-ihn.de/sitemap.xml");
});

test("internal links in imported HTML get the slash, files and foreign hosts stay untouched", () => {
  const html = [
    '<a href="/magazin/gaychat">a</a>',
    '<a href="/partnersuche/nordrhein-westfalen/k%C3%B6ln">b</a>',
    '<a href="https://er-sucht-ihn.de/registration?AID=location">c</a>',
    '<a href="/">d</a>',
    '<a href="/gay.html">e</a>',
    '<a href="/magazine/media/1552-bild.jpg">f</a>',
    '<a href="https://www.gettyimages.com/foto">g</a>',
    '<a href="#faq">h</a>',
    '<a href="//cdn.example.org/x">i</a>',
  ].join("");
  const out = slashInternalLinks(html);
  assert.match(out, /href="\/magazin\/gaychat\/"/);
  assert.match(out, /href="\/partnersuche\/nordrhein-westfalen\/k%C3%B6ln\/"/);
  assert.match(out, /href="https:\/\/er-sucht-ihn\.de\/registration\/\?AID=location"/);
  assert.match(out, /href="\/"/);
  assert.match(out, /href="\/gay\.html"/);
  assert.match(out, /href="\/magazine\/media\/1552-bild\.jpg"/);
  assert.match(out, /href="https:\/\/www\.gettyimages\.com\/foto"/);
  assert.match(out, /href="#faq"/);
  assert.match(out, /href="\/\/cdn\.example\.org\/x"/);
});

test("Next redirects page paths without slash itself and loaders normalise imported URLs", async () => {
  const config = await read("../next.config.ts");
  assert.match(config, /trailingSlash: true/);
  assert.doesNotMatch(config, /skipTrailingSlashRedirect/);
  for (const match of config.matchAll(/destination: "([^"]+)"/g)) {
    const destination = match[1];
    if (destination.startsWith("/:path")) continue;
    assert.ok(destination.endsWith("/") || /\.[a-z0-9]+$/i.test(destination), destination);
  }
  const content = await read("../lib/content.ts");
  assert.match(content, /canonical: withTrailingSlash\(page\.canonical\), contentHtml: slashInternalLinks\(page\.contentHtml\)/);
  const magazine = await read("../lib/magazine.ts");
  assert.match(magazine, /canonical: withTrailingSlash\(entry\.canonical\)/);
  assert.match(magazine, /slashInternalLinks\(entry\.contentHtml\)/);
});
