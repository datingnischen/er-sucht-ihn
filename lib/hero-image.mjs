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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// The hero already shows this image above the content, so drop the imported copy inside the body.
// Images followed by a link or bold text are inline icons (e.g. social media bullets) and stay.
export function removeHeroImageFromContent(html = "", hero) {
  if (!hero?.src) return html;
  const blank = "(?:\\s|&nbsp;|\\u00a0)*";
  const img = `(?:<picture>${blank})?<img\\b[^>]*\\bsrc=["']${escapeRegExp(hero.src)}["'][^>]*>(?:${blank}</picture>)?`;
  const wrapped = new RegExp(`<p>${blank}${img}${blank}</p>(?:\\s*<p>${blank}</p>)?`, "i");
  if (wrapped.test(html)) return html.replace(wrapped, "");
  return html.replace(new RegExp(`${img}(?!${blank}<(?:a|strong|b|em)\\b)`, "i"), "");
}
