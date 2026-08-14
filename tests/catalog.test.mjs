import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyPath,
  getLocationName,
  getRegistrationUrl,
  isMigratedPath,
  legalLinks,
  routeFamilies,
} from "../lib/site-contract.mjs";

test("location routes receive location conversion tracking", () => {
  for (const path of [
    "/partnersuche/berlin",
    "/partnersuche/nordrhein-westfalen/koeln",
    "/partnersuche/bayern/muenchen",
  ]) {
    assert.equal(classifyPath(path), "location");
    assert.equal(getRegistrationUrl(path), "https://er-sucht-ihn.de/registration/?AID=location");
  }
});

test("editorial routes receive magazine conversion tracking", () => {
  for (const path of ["/", "/dating-tipps", "/lexikon/gaychat"]) {
    assert.equal(getRegistrationUrl(path), "https://er-sucht-ihn.de/registration/?AID=magazin");
  }
});

test("location names come from the final public route segment", () => {
  assert.equal(getLocationName("/partnersuche/hessen/frankfurt"), "Frankfurt");
  assert.equal(getLocationName("/partnersuche/bayern/muenchen"), "München");
  assert.equal(getLocationName("/partnersuche/nordrhein-westfalen/koeln"), "Köln");
});

test("legal and platform links stay on the canonical live ICONY market", () => {
  assert.deepEqual(legalLinks, {
    datenschutz: "https://er-sucht-ihn.de/datenschutz.html",
    impressum: "https://er-sucht-ihn.de/impressum.html",
    agb: "https://er-sucht-ihn.de/agb.html",
  });
});

test("migration contract covers the public editorial route families", () => {
  assert.deepEqual(routeFamilies, ["partnersuche", "lexikon"]);
  assert.equal(isMigratedPath("/partnersuche/berlin"), true);
  assert.equal(isMigratedPath("/lexikon/gaychat"), true);
  assert.equal(isMigratedPath("/registration"), false);
  assert.equal(isMigratedPath("/login"), false);
});
