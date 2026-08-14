import { selectHeroImage } from "./hero-image.mjs";
import { getLocationName } from "./site-contract.mjs";

const UNSUITABLE_PREVIEW = /statistik|statistics|community|profil|profile|flagge|testbericht|singleboersen-ueberblick|empfohlen-siegel/i;

function selectRelatedImage(page) {
  const image = selectHeroImage(page.images);
  return image && !UNSUITABLE_PREVIEW.test(`${image.src} ${image.alt}`)
    ? { src: image.src, alt: `${getLocationName(page.path)} entdecken` }
    : null;
}

export function buildRelatedCards(pages, currentPath, root, limit = 6) {
  return pages
    .filter((page) => page.type === "location" && page.path.startsWith(`/${root}/`) && page.path !== currentPath)
    .slice(0, limit)
    .map((page, index) => ({
      path: page.path,
      title: page.h1,
      location: getLocationName(page.path),
      image: selectRelatedImage(page),
      tone: index % 6,
    }));
}
