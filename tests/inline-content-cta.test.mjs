import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import catalog from "../data/pages.json" with { type: "json" };

const registrationAnchor = /<a\b([^>]*)href="(https:\/\/er-sucht-ihn\.de\/registration[^\"]*)"([^>]*)>([\s\S]*?)<\/a>/gi;

test("the sanitized snapshot classifies every eligible registration CTA with the page-family AID", () => {
  let decorated = 0;
  let preserved = 0;
  for (const page of catalog.pages) {
    const aid = page.type === "location" ? "location" : "magazin";
    for (const match of page.contentHtml.matchAll(registrationAnchor)) {
      const openingAttributes = `${match[1]} ${match[3]}`;
      if (/\bclass="inline-content-cta"/.test(openingAttributes)) {
        decorated += 1;
        assert.equal(match[2], `https://er-sucht-ihn.de/registration/?AID=${aid}`, page.path);
        assert.doesNotMatch(match[4], /<img\b/i, page.path);
        assert.ok(match[4].replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim(), page.path);
      } else {
        preserved += 1;
        assert.ok(/<img\b/i.test(match[4]) || !match[4].replace(/<[^>]*>/g, "").trim(), page.path);
      }
    }
  }
  assert.equal(decorated, 144);
  assert.equal(preserved, 2);
});

test("ordinary editorial links remain ordinary text links", () => {
  const page = catalog.pages.find((item) => item.path === "/lexikon/gaychat");
  assert.match(page.contentHtml, /<a href="https:\/\/er-sucht-ihn\.de\/magazin\/gay-kontakte">Gaykontakte<\/a>/);
});

test("runtime rendering does not contain a second HTML parser", () => {
  const pageSource = fs.readFileSync(new URL("../app/[...slug]/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(pageSource, /decorateInlineRegistrationCtas|inline-content-cta\.mjs/);
  assert.equal(fs.existsSync(new URL("../lib/inline-content-cta.mjs", import.meta.url)), false);
});

test("inline CTA styling is button-like, keyboard-visible and mobile-safe", () => {
  const css = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.rich-content a\.inline-content-cta\s*\{[^}]*display:inline-flex[^}]*background:/i);
  assert.match(css, /\.rich-content a\.inline-content-cta:focus-visible\s*\{[^}]*outline:/i);
  assert.match(css, /\.inline-content-cta\s*\{[^}]*max-width:100%[^}]*text-align:center/i);
});
