import type { ReactNode } from "react";

/** Aufsteigende Herzen im Hero (Positionen im 1200×240-Raster). */
export const DUSK_HEARTS = [
  { x: 60, y: 150, size: 26 },
  { x: 190, y: 90, size: 18 },
  { x: 330, y: 170, size: 30 },
  { x: 480, y: 110, size: 20 },
  { x: 610, y: 175, size: 24 },
  { x: 760, y: 95, size: 16 },
  { x: 890, y: 160, size: 28 },
  { x: 1030, y: 110, size: 20 },
  { x: 1140, y: 170, size: 24 },
];

/**
 * Setzt das letzte Vorkommen des Stadtnamens in der Überschrift als <em> (Dusk-Akzent).
 * Der Text bleibt Zeichen für Zeichen unverändert.
 */
export function emphasize(text: string, word: string): ReactNode {
  const index = word ? text.lastIndexOf(word) : -1;
  if (index < 0) return text;
  return <>{text.slice(0, index)}<em>{word}</em>{text.slice(index + word.length)}</>;
}

/** Szene-Guides aus dem Magazin je Stadt, dazu die Übersicht der Gay-Locations. Nur Pfade, die es im Magazin gibt, werden gezeigt. */
const SCENE_GUIDES: Record<string, string> = {
  "/partnersuche/berlin": "/magazin/gaylocations-berlin",
  "/partnersuche/bremen": "/magazin/gaylocations-bremen",
  "/partnersuche/sachsen/dresden": "/magazin/gaylocations-dresden",
  "/partnersuche/hessen/frankfurt": "/magazin/gaylocations-frankfurt",
  "/partnersuche/hamburg": "/magazin/gaylocations-hamburg",
  "/partnersuche/niedersachsen/hannover": "/magazin/gaylocations-hannover",
  "/partnersuche/nordrhein-westfalen/köln": "/magazin/gaylocations-koeln",
  "/partnersuche/sachsen/leipzig": "/magazin/gaylocations-leipzig",
  "/partnersuche/bayern/muenchen": "/magazin/gaylocations-muenchen",
  "/partnersuche/baden-wuerttemberg/stuttgart": "/magazin/gaylocations-stuttgart",
};

export const LOCATIONS_HUB_PATH = "/magazin/gay-locations";

export function cityMagazineTeasers(path: string): string[] {
  return [SCENE_GUIDES[path], LOCATIONS_HUB_PATH].filter((entry): entry is string => Boolean(entry));
}
