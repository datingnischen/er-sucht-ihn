import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import catalog from "../data/pages.json" with { type: "json" };
import { buildPageEntityGraph, serializePageEntityGraph } from "../lib/page-entities.mjs";

const SITE = "https://er-sucht-ihn.de";

test("imported article fragments do not duplicate the page main landmark or h1", () => {
  const offenders = catalog.pages.filter((page) => page.type !== "platform" && /<(?:main|h1)\b/i.test(page.contentHtml));
  assert.deepEqual(offenders.map((page) => page.path), []);
});

test("lexicon routes remain factual canonical WebPages without unsupported term claims", () => {
  const graph = buildPageEntityGraph({
    path: "/lexikon/gaychat",
    canonical: `${SITE}/lexikon/gaychat`,
    type: "lexicon",
    h1: "Gaychat",
    description: "Informationen zu Gaychats und sicherem Kennenlernen für Männer.",
  });
  assert.equal(graph["@context"], "https://schema.org");
  const webpage = graph["@graph"].find((node) => node["@type"] === "WebPage");
  assert.deepEqual(webpage, {
    "@type": "WebPage",
    "@id": `${SITE}/lexikon/gaychat#webpage`,
    url: `${SITE}/lexikon/gaychat`,
    name: "Gaychat",
    description: "Informationen zu Gaychats und sicherem Kennenlernen für Männer.",
    inLanguage: "de-DE",
    isPartOf: { "@id": `${SITE}/#website` },
  });
  assert.equal(graph["@graph"].some((node) => node["@type"] === "DefinedTerm"), false);
  assert.equal(webpage.mainEntity, undefined);
});

test("location pages stay factual WebPages without invented Place or Article claims", () => {
  const graph = buildPageEntityGraph({ path: "/partnersuche/berlin", canonical: `${SITE}/partnersuche/berlin`, type: "location", h1: "Er sucht ihn in Berlin", description: "Männer in Berlin kennenlernen." });
  assert.deepEqual(graph["@graph"].map((node) => node["@type"]), ["WebSite", "WebPage"]);
  assert.doesNotMatch(JSON.stringify(graph), /Article|Place|author|datePublished/);
});

test("JSON-LD serialization escapes HTML tag boundaries", () => {
  const graph = buildPageEntityGraph({ path: "/lexikon/test", canonical: `${SITE}/lexikon/test`, type: "lexicon", h1: "Test", description: "</script><script>alert(1)</script>" });
  const serialized = serializePageEntityGraph(graph);
  assert.doesNotMatch(serialized, /</);
  assert.match(serialized, /\\u003c\/script>/);
});

test("llms.txt is concise, canonical and does not claim to control model training", () => {
  const source = fs.readFileSync(new URL("../app/llms.txt/route.ts", import.meta.url), "utf8");
  assert.match(source, /https:\/\/er-sucht-ihn\.de\/sitemap\.xml/);
  for (const path of ["/partnersuche", "/lexikon"]) assert.match(source, new RegExp(`https://er-sucht-ihn\\.de${path}`));
  assert.doesNotMatch(source, /sie-sucht-sie|lesbische|Frauen|oesterreich|schweiz/i);
  assert.match(source, /Content-Type[^\n]*text\/plain; charset=utf-8/i);
  assert.match(source, /export const dynamic = "force-static"/);
  assert.doesNotMatch(source, /training|trainingsdaten|garantiert|ranking/i);
});
