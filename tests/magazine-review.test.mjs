import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { magazineReview, buildMagazineSchema } from "../lib/magazine-review.mjs";

const entries = JSON.parse(readFileSync(new URL("../data/magazine.json", import.meta.url))).entries;
const entry = (slug) => entries.find((item) => item.slug === slug);

test("provider review uses its own visible rating, not five-star alternatives", () => {
  const review = magazineReview(entry("boytrap"));
  assert.equal(review.rating, 3);
  const graph = buildMagazineSchema(entry("boytrap"), "https://er-sucht-ihn.de")["@graph"];
  const app = graph.find((node) => node["@type"] === "SoftwareApplication");
  assert.equal(app.name, "Boytrap");
  assert.equal(app.review.reviewRating.ratingValue, 3);
  assert.equal(app.review.reviewRating.bestRating, 5);
  assert.equal(app.review.author["@type"], "Organization");
  assert.equal(app.offers.price, 0);
  assert.equal(app.offers.priceCurrency, "EUR");
  assert.equal(JSON.stringify(graph).includes("AggregateRating"), false);
  assert.equal(JSON.stringify(graph).includes("ratingCount"), false);
});

test("all eleven existing provider ratings produce one linked editorial review", () => {
  for (const slug of ["boytrap", "gay-de", "gayparship", "gayroyal", "grindr", "growlr", "my-homo", "poppen-de", "romeo-com", "scruff", "travesta"]) {
    const article = entry(slug);
    const graph = buildMagazineSchema(article, "https://er-sucht-ihn.de")["@graph"];
    const app = graph.find((node) => node["@type"] === "SoftwareApplication");
    assert.ok(app, slug);
    assert.equal(app.review.reviewRating.ratingValue, slug === "boytrap" ? 3 : 4, slug);
    assert.equal(graph[0].about["@id"], app["@id"]);
    assert.equal(app.review.url, article.canonical.replace(/\/?$/, "/"));
    assert.equal(app.review.author.name, article.author.name);
    assert.ok(app.review.reviewBody.includes("Redaktionelle Bewertung"));
  }
});

test("unrated, comparison and non-provider articles retain article schema without reviews", () => {
  for (const slug of ["badoo-und-lovoo", "mennation", "kleine-pride-events-gay-dating"]) {
    assert.equal(magazineReview(entry(slug)), null);
    assert.equal(buildMagazineSchema(entry(slug), "https://er-sucht-ihn.de")["@type"], "Article");
  }
  const unrated = { ...entry("boytrap"), contentHtml: "<p>Alternative ★★★★★</p>" };
  assert.equal(magazineReview(unrated), null);
  assert.equal(magazineReview({ ...entry("boytrap"), type: "page" }), null);
  assert.equal(magazineReview({ ...entry("boytrap"), author: null }), null);
  assert.equal(magazineReview({ ...entry("boytrap"), contentHtml: '<table><tr><td>Gesamteindruck:</td><td>★★★★★★</td></tr></table>' }), null);
});
