import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";
import { audioDurationLabel, audioSummaryFor, withAudioSummary } from "../lib/audio-summaries.mjs";

const summaries = JSON.parse(readFileSync(new URL("../data/audio-summaries.json", import.meta.url), "utf8"));
const texts = JSON.parse(readFileSync(new URL("../docs/audio-summaries/texte.json", import.meta.url), "utf8"));
const retired = JSON.parse(readFileSync(new URL("../data/magazine-lexikon.json", import.meta.url), "utf8")).entries;
const entries = JSON.parse(readFileSync(new URL("../data/magazine.json", import.meta.url), "utf8")).entries;
const knownPaths = new Set([...retired.map((entry) => entry.path), ...entries.map((entry) => entry.path)]);

test("every audio summary points to an existing page and a real MP3", () => {
  assert.ok(Object.keys(summaries).length >= 6);
  for (const [path, { src, seconds }] of Object.entries(summaries)) {
    assert.ok(knownPaths.has(path), `${path} ist keine bekannte Seite`);
    assert.match(src, /^\/magazine\/media\/[a-z0-9-]+-audio-zusammenfassung\.mp3$/);
    const file = new URL(`../public${src}`, import.meta.url);
    assert.ok(existsSync(file), `${src} fehlt`);
    assert.ok(statSync(file).size > 100_000, `${src} ist zu klein`);
    assert.ok(seconds >= 20 && seconds <= 120, `${path}: ${seconds} s`);
  }
});

test("every spoken text has an audio entry and stays short", () => {
  for (const [path, { text }] of Object.entries(texts)) {
    assert.ok(summaries[path], `${path} hat noch kein Audio`);
    const words = text.split(/\s+/).length;
    assert.ok(words >= 60 && words <= 170, `${path}: ${words} Wörter`);
  }
});

test("magazine articles get the audio block once, at the start", () => {
  const html = withAudioSummary("/magazin/coming-out", "<p>Text</p>");
  assert.match(html, /^<h2>Artikel kurz anhören<\/h2>/);
  assert.match(html, /<audio controls="" preload="none"><source src="\/magazine\/media\/coming-out-audio-zusammenfassung\.mp3"/);
  assert.equal(withAudioSummary("/magazin/coming-out", html), html, "kein zweites Audio");
  assert.equal(withAudioSummary("/magazin/gibt-es-nicht", "<p>x</p>"), "<p>x</p>");
});

test("lookup ignores a trailing slash and formats the duration", () => {
  assert.deepEqual(audioSummaryFor("/magazin/gaychat/"), summaries["/magazin/gaychat"]);
  assert.equal(audioDurationLabel(58), "0:58");
  assert.equal(audioDurationLabel(61), "1:01");
});
