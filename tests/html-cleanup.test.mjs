import test from "node:test";
import assert from "node:assert/strict";
import { limitStrong, withoutHeadingSkips } from "../lib/html-cleanup.mjs";

test("heading levels never skip and siblings stay siblings", () => {
  assert.equal(
    withoutHeadingSkips("<h2>A</h2><h4>B</h4><h4>C</h4><h3>D</h3><h2>E</h2><h5>F</h5>"),
    "<h2>A</h2><h3>B</h3><h3>C</h3><h3>D</h3><h2>E</h2><h3>F</h3>",
  );
  assert.equal(withoutHeadingSkips('<h3 id="x">Erste</h3>'), '<h2 id="x">Erste</h2>');
});

test("an empty strong between two words keeps the space", () => {
  assert.equal(limitStrong("Nachhaltige<strong> </strong>französische"), "Nachhaltige französische");
});

test("doppelt verschachtelte Hervorhebungen ergeben gültiges HTML", () => {
  assert.equal(limitStrong("<strong>a</strong><strong>a</strong><strong><strong>T</strong></strong>"), "<strong>a</strong><span class=\"em-strong\">a</span><strong>T</strong>");
});
