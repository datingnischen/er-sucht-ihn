// Redaktionelle Hinweise für einzelne Stadtseiten (nur die hier genannten Pfade, nie für alle Städte).
// Steht im Guide nach dem letzten Kapitel und vor dem eingeklappten Quellenblock.
const CITY_NOTES = Object.freeze({
  "/partnersuche/hessen/kassel": Object.freeze({
    before: "Du suchst in Kassel einen Mann, mit dem dich auch ein Hobby verbindet? Der ",
    anchor: "Kassel-Single-Check",
    href: "https://kasseler-singles.de/#quiz",
    after: " auf kasseler-singles.de zeigt dir, welche Kasseler Nischenbörsen dazu passen.",
  }),
});

export function cityNoteFor(path = "") {
  return CITY_NOTES[path.replace(/\/+$/, "")] ?? null;
}
