const EXCLUDED_HERO_MARKERS = [
  "singleboersen-ueberblick",
  "empfohlen-siegel",
  "testbericht",
  "statistik",
  "statistics",
  "flagge",
];

function heroScore(image) {
  const value = `${image?.src || ""} ${image?.alt || ""}`.toLowerCase();
  if (!image?.src) return Number.NEGATIVE_INFINITY;
  if (EXCLUDED_HERO_MARKERS.some((marker) => value.includes(marker))) return -100;

  let score = 0;
  if (/partnersuche in|er sucht ihn in|gay dating|schwule in/.test(value)) score += 30;
  if (/\/[^/]+l\.jpg(?:$|\?)/i.test(image.src) || /\b[a-zäöüß]+l\b/i.test(image.alt || "")) score -= 20;
  if (/static-cms\.icony-hosting\.de/.test(image.src)) score += 5;
  return score;
}

export function selectHeroImage(images = []) {
  return images
    .map((image, index) => ({ image, index, score: heroScore(image) }))
    .filter(({ score }) => score > -100)
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.image;
}
