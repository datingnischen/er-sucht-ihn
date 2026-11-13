import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Prüfsperre: Zeitstempel erscheinen in JSON-LD, Sitemap und /magazin/wp-json und dürfen nicht nach Automatik aussehen.
// Neue Werte: unregelmäßige Uhrzeit (keine volle/halbe Stunde, Sekunde ≠ 00), nie für mehrere Beiträge gleich.
const read = (file) => JSON.parse(readFileSync(new URL(`../data/${file}`, import.meta.url), "utf8")).entries;
const entries = [...read("magazine.json"), ...read("magazine-lexikon.json")];
const posts = entries.filter((entry) => entry.type === "post");

// Datumsgebundene Beiträge, die bewusst am selben Tag erschienen sind: Prince-Charming-Staffelberichte und
// Sendungs-/Wahlberichte vom 18.01.2023, die sich auf Termine dieses Tages beziehen.
const SAME_DAY_EXCEPTIONS = new Set([
  "/magazin/prince-charming-2019-staffel-1",
  "/magazin/prince-charming-2020-staffel-2",
  "/magazin/prince-charming-2021-staffel-3",
]);

const berlinNow = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
};
const isRound = (stamp) => /T\d\d:(00|30):00/.test(stamp) || /T00:00:\d\d/.test(stamp);

test("modified liegt nie vor date und nichts in der Zukunft", () => {
  const now = berlinNow();
  for (const entry of entries) {
    assert.match(entry.date, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/, `${entry.path} date`);
    if (entry.modified) assert.match(entry.modified, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/, `${entry.path} modified`);
    assert.ok(!entry.modified || entry.modified >= entry.date, `${entry.path}: modified vor date`);
    assert.ok(entry.date <= now && (entry.modified || "") <= now, `${entry.path}: Zeitstempel in der Zukunft`);
  }
});

test("Zeitstempel ab 2026 sind nicht rund und nicht doppelt", () => {
  const seen = new Map();
  for (const entry of entries) {
    for (const field of ["date", "modified"]) {
      const stamp = entry[field];
      if (!stamp || stamp < "2026") continue;
      assert.ok(!isRound(stamp), `${entry.path} ${field}: runde Uhrzeit ${stamp}`);
      if (field === "modified" && stamp === entry.date) continue;
      assert.ok(!seen.has(stamp), `${entry.path} ${field}: gleiche Sekunde wie ${seen.get(stamp)}`);
      seen.set(stamp, entry.path);
    }
  }
});

test("keine Sammel-Aktualisierung vieler Beiträge am selben Tag", () => {
  const limit = posts.length < 30 ? 4 : 8;
  const perDay = new Map();
  for (const entry of posts) {
    const day = (entry.modified || "").slice(0, 10);
    if (day > entry.date.slice(0, 10)) perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  for (const [day, count] of perDay) assert.ok(count <= limit, `${count} Beiträge mit modified am ${day}`);
});

test("höchstens zwei Beiträge je Erscheinungstag", () => {
  const perDay = new Map();
  for (const entry of posts) {
    if (SAME_DAY_EXCEPTIONS.has(entry.path)) continue;
    const day = entry.date.slice(0, 10);
    perDay.set(day, [...(perDay.get(day) ?? []), entry.path]);
  }
  for (const [day, paths] of perDay) assert.ok(paths.length <= 2, `${paths.length} Beiträge am ${day}: ${paths.join(", ")}`);
});
