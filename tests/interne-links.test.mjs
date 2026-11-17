import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Soll-Liste der internen Verlinkung: Controlling → Business → Interne Links
// (/controlling/crm/interne-links, Quelle: src/lib/crm/internal-links.json im Repo controlling).
// Verschwindet ein Link bei einem Umbau, schlaegt dieser Test fehl.
const SOLL = [
  {
    beschreibung: "Magazin gayroyal verlinkt die Camboy-Rubrik von cam-liebe",
    datei: new URL("../data/magazine.json", import.meta.url),
    ziel: "https://cam-liebe.com/camboy/",
  },
];

for (const eintrag of SOLL) {
  test(eintrag.beschreibung, () => {
    const inhalt = readFileSync(eintrag.datei, "utf8");
    assert.ok(
      inhalt.includes(eintrag.ziel),
      `Interner Link ${eintrag.ziel} fehlt. Entweder wieder einbauen oder den Eintrag in der Soll-Liste (Controlling, /crm/interne-links) entfernen.`,
    );
  });
}
