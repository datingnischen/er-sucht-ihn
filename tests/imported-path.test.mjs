import test from "node:test";
import assert from "node:assert/strict";
import { normalizeImportedPath } from "../lib/imported-path.mjs";

test("encoded Unicode route segments resolve to the canonical imported path", () => {
  assert.equal(normalizeImportedPath(["partnersuche", "nordrhein-westfalen", "k%C3%B6ln"]), "/partnersuche/nordrhein-westfalen/köln");
  assert.equal(normalizeImportedPath(["partnersuche", "baden-w%C3%BCrttemberg", "freiburg"]), "/partnersuche/baden-württemberg/freiburg");
  assert.equal(normalizeImportedPath(["partnersuche", "nordrhein-westfalen", "k%25C3%25B6ln"]), "/partnersuche/nordrhein-westfalen/köln");
});

test("already decoded segments remain stable", () => {
  assert.equal(normalizeImportedPath(["partnersuche", "nordrhein-westfalen", "köln"]), "/partnersuche/nordrhein-westfalen/köln");
  assert.equal(normalizeImportedPath(), "/");
});

test("malformed percent encodings fail closed without throwing", () => {
  assert.equal(normalizeImportedPath(["partnersuche", "%E0%A4%A"]), "/__invalid_imported_path__");
});
