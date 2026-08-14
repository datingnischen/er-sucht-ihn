import test from "node:test";
import assert from "node:assert/strict";
import { buildBreadcrumbs, buildBreadcrumbSchema } from "../lib/breadcrumbs.mjs";

test("nested German city pages expose state and city hierarchy", () => {
  assert.deepEqual(buildBreadcrumbs("/partnersuche/nordrhein-westfalen/köln"), [
    { name: "Start", path: "/" },
    { name: "Partnersuche", path: "/partnersuche" },
    { name: "Nordrhein Westfalen", path: "/partnersuche/nordrhein-westfalen" },
    { name: "Köln", path: "/partnersuche/nordrhein-westfalen/köln" },
  ]);
});

test("regional breadcrumb names preserve German spelling", () => {
  assert.deepEqual(buildBreadcrumbs("/partnersuche/bayern/muenchen").map((item) => item.name), ["Start", "Partnersuche", "Bayern", "München"]);
  assert.deepEqual(buildBreadcrumbs("/partnersuche/baden-wuerttemberg/stuttgart").map((item) => item.name), ["Start", "Partnersuche", "Baden Württemberg", "Stuttgart"]);
});

test("breadcrumb presentation is semantic, keyboard visible and mobile safe", async () => {
  const pageSource = await import("node:fs").then(({ readFileSync }) => readFileSync(new URL("../app/[...slug]/page.tsx", import.meta.url), "utf8"));
  const css = await import("node:fs").then(({ readFileSync }) => readFileSync(new URL("../app/globals.css", import.meta.url), "utf8"));
  assert.match(pageSource, /<nav className="breadcrumbs" aria-label="Breadcrumb"><ol>/);
  assert.match(pageSource, /aria-current="page"/);
  assert.match(css, /\.breadcrumbs ol\s*\{[^}]*display:flex[^}]*flex-wrap:wrap/i);
  assert.match(css, /\.breadcrumbs a:focus-visible\s*\{[^}]*outline:/i);
});

test("top-level editorial breadcrumbs use catalog labels instead of implementation slugs", () => {
  assert.deepEqual(buildBreadcrumbs("/faq", "Häufige Fragen").map((item) => item.name), ["Start", "Häufige Fragen"]);
  assert.deepEqual(buildBreadcrumbs("/fragenflirt.html", "Fragenflirt").map((item) => item.name), ["Start", "Fragenflirt"]);
  assert.equal(buildBreadcrumbSchema("/sicherheit-und-datenschutz.html", "Sicherheit und Datenschutz").itemListElement.at(-1).name, "Sicherheit und Datenschutz");
});

test("breadcrumb structured data uses canonical absolute item URLs", () => {
  assert.deepEqual(buildBreadcrumbSchema("/partnersuche/bayern/muenchen"), {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Start", item: "https://er-sucht-ihn.de/" },
      { "@type": "ListItem", position: 2, name: "Partnersuche", item: "https://er-sucht-ihn.de/partnersuche" },
      { "@type": "ListItem", position: 3, name: "Bayern", item: "https://er-sucht-ihn.de/partnersuche/bayern" },
      { "@type": "ListItem", position: 4, name: "München", item: "https://er-sucht-ihn.de/partnersuche/bayern/muenchen" },
    ],
  });
});
