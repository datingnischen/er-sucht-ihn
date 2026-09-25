import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { balanceHtml, buildFaqMainEntity, extractFaq } from "../lib/faq.mjs";
import { removeHeroImageFromContent } from "../lib/hero-image.mjs";

const catalog = JSON.parse(await readFile(new URL("../data/pages.json", import.meta.url), "utf8"));
const pages = Array.isArray(catalog) ? catalog : catalog.pages;
const faqPage = pages.find((page) => page.path === "/faq");

test("FAQ page is split into topic groups with unique question anchors", () => {
  const faq = extractFaq(faqPage.contentHtml);
  assert.ok(faq);
  assert.equal(faq.groups.length, 6);
  const items = faq.groups.flatMap((group) => group.items);
  assert.equal(items.length, (faqPage.contentHtml.match(/\?\s*<div>/g) || []).length);
  assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  for (const item of items) assert.match(item.question, /\?$/);
  assert.match(faq.beforeHtml, /Du interessierst dich für/);
  assert.match(faq.afterHtml, /registration/);
});

test("FAQ JSON-LD carries every visible question as plain text", () => {
  const faq = extractFaq(faqPage.contentHtml);
  const entities = buildFaqMainEntity(faq.groups);
  assert.equal(entities.length, faq.groups.flatMap((group) => group.items).length);
  for (const entity of entities) {
    assert.equal(entity["@type"], "Question");
    assert.equal(entity.acceptedAnswer["@type"], "Answer");
    assert.doesNotMatch(entity.acceptedAnswer.text, /<|&[a-z]+;/);
    assert.ok(entity.acceptedAnswer.text.length > 30);
  }
});

test("FAQ help link stays on er-sucht-ihn.de", async () => {
  const source = await readFile(new URL("../components/faq-section.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /sie-sucht-sie/);
  assert.match(source, /\$\{SITE_URL\}\/hilfe\//);
});

test("balanceHtml closes open tags and drops stray closers", () => {
  assert.equal(balanceHtml("<div><p>a"), "<div><p>a</p></div>");
  assert.equal(balanceHtml("</div><p>b</p></div>"), "<p>b</p>");
});

test("removeHeroImageFromContent drops the duplicated hero but keeps inline icons", () => {
  const hero = { src: "/img/hero.jpg" };
  assert.equal(removeHeroImageFromContent('<p><img src="/img/hero.jpg" alt=""></p><p>Text</p>', hero), "<p>Text</p>");
  const icon = '<p><img src="/img/hero.jpg" alt=""><a href="/x">Link</a></p>';
  assert.equal(removeHeroImageFromContent(icon, hero), icon);
  assert.equal(removeHeroImageFromContent("<p>ohne</p>", null), "<p>ohne</p>");
});

test("FAQ metadata names the own .de domain and drops the legacy title suffix", async () => {
  const source = await readFile(new URL("../lib/content.ts", import.meta.url), "utf8");
  const override = source.match(/"\/faq": \{([\s\S]*?)\}/)?.[1] ?? "";
  assert.match(override, /er-sucht-ihn\.de/);
  assert.doesNotMatch(override, /er-sucht-ihn\.ch|die Helfen/);
});
