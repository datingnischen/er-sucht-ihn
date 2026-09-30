import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildCityGuide, extractCredits, plainText, selectCityPhoto, topicFor } from "../lib/city-guide.mjs";

const pages = JSON.parse(fs.readFileSync(new URL("../data/pages.json", import.meta.url), "utf8")).pages;
const cityPages = pages.filter((page) => page.type === "location" && page.path !== "/partnersuche");

function guideText(guide) {
  return plainText([
    guide.introHtml,
    ...guide.sections.map((section) => `<h2>${section.headingHtml}</h2>${section.html}`),
    guide.related.heading,
    ...guide.related.links.map((link) => link.name),
  ].join(" "));
}

test("the imported city texts stay word for word: every paragraph, list item and heading survives the chapter split", () => {
  for (const page of cityPages) {
    const photo = selectCityPhoto(page.images);
    const guide = buildCityGuide({ contentHtml: page.contentHtml, path: page.path, heroSrc: photo?.src });
    const text = guideText(guide);
    const blocks = [...page.contentHtml.matchAll(/<(p|li|h2|h3)\b[^>]*>([\s\S]*?)<\/\1>/g)]
      .map((match) => plainText(match[2]))
      .filter((value) => value && !/^Bildquelle/.test(value) && !/^https?:\/\//.test(value));
    for (const block of blocks) {
      if (block === page.path) continue;
      const wanted = block.replace(/^·\s*/, "");
      assert.ok(text.includes(wanted), `${page.path}: „${wanted.slice(0, 60)}…“ fehlt`);
    }
  }
});

test("wrappers, duplicate CTA wrappers, statistic graphics and image credits are lifted out of the guide", () => {
  for (const page of cityPages) {
    const photo = selectCityPhoto(page.images);
    const guide = buildCityGuide({ contentHtml: page.contentHtml, path: page.path, heroSrc: photo?.src });
    const html = [guide.introHtml, ...guide.sections.map((section) => section.html)].join("");
    assert.doesNotMatch(html, /<\/?(?:div|section)\b/, page.path);
    assert.doesNotMatch(html, /Bildquelle/, page.path);
    assert.doesNotMatch(html, /<img[^>]*statistik/i, page.path);
    assert.doesNotMatch(html, /<p>\s*<\/p>/, page.path);
    if (photo) assert.ok(!html.includes(photo.src), `${page.path}: Hero-Bild doppelt`);
    assert.doesNotMatch(photo?.src ?? "", /statistik/i, page.path);
  }
});

test("the related link list becomes chips and keeps its original heading", () => {
  const berlin = pages.find((page) => page.path === "/partnersuche/berlin");
  const guide = buildCityGuide({ contentHtml: berlin.contentHtml, path: berlin.path });
  assert.equal(guide.related.heading, "Diese Städte könnten auch interessant für dich sein:");
  assert.deepEqual(guide.related.links.map((link) => link.name), ["Alle Städte", "Kassel", "Bochum"]);
  assert.ok(guide.related.links.find((link) => link.name === "Alle Städte").isHub);
  assert.ok(guide.sections.every((section) => !/interessant für dich/.test(section.heading)));
  for (const page of cityPages) {
    const cityGuide = buildCityGuide({ contentHtml: page.contentHtml, path: page.path });
    assert.ok(cityGuide.related.links.length >= 1, `${page.path} hat keine Linkliste`);
  }
});

test("chapters split at h2 and fall back to h3 for texts structured mainly with h3", () => {
  const kassel = pages.find((page) => page.path === "/partnersuche/hessen/kassel");
  const guide = buildCityGuide({ contentHtml: kassel.contentHtml, path: kassel.path });
  assert.ok(guide.chapterCount >= 6);
  assert.ok(guide.sections.some((section) => section.level === 3));
  const koblenz = pages.find((page) => page.path === "/partnersuche/koblenz");
  const kGuide = buildCityGuide({ contentHtml: koblenz.contentHtml, path: koblenz.path });
  assert.equal(kGuide.chapterCount, 7);
  assert.ok(kGuide.sections.every((section) => section.level === 2));
});

test("image credits are extracted with a readable label", () => {
  const { credits, html } = extractCredits('<p>Text</p><hr/><p><small>Bildquelle: https://www.pexels.com/de-de/foto/x-1/</small></p>');
  assert.deepEqual(credits, [{ url: "https://www.pexels.com/de-de/foto/x-1/", label: "Pexels" }]);
  assert.equal(html, "<p>Text</p>");
});

test("chapter symbols follow the keyword rules", () => {
  assert.equal(topicFor("Party, Kultur und Wellness"), "bar");
  assert.equal(topicFor("CSD in Koblenz"), "event");
  assert.equal(topicFor("Café-Date am Rheinufer"), "food");
  assert.equal(topicFor("Jemanden Online kennen lernen"), "online");
  assert.equal(topicFor("Kultur & Museen"), "culture");
  assert.equal(topicFor("Treffpunkte für die Single Suche"), "community");
  assert.equal(topicFor("Er sucht Ihn in Berlin – Fazit"), "love");
  assert.equal(topicFor("Romantische Date-Ideen in Bonn"), "tip");
  assert.equal(topicFor("Berlin – Gay Hauptstadt Europas"), "place");
});
