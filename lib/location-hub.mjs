import { selectHeroImage } from "./hero-image.mjs";
import { getLocationName, getRegistrationUrl } from "./site-contract.mjs";

const HUB_CONFIG = Object.freeze({
  featured: ["berlin", "hamburg", "muenchen", "köln", "frankfurt", "stuttgart"],
  teasers: {
    berlin: "Großstadtmomente, Kiezleben und neue Begegnungen.",
    hamburg: "Zwischen Alster, Elbe und ehrlichen Gesprächen.",
    muenchen: "Gemeinsam Lieblingsorte in der Isarmetropole entdecken.",
    "köln": "Offen, herzlich und voller Möglichkeiten zum Kennenlernen.",
    frankfurt: "Neue Kontakte zwischen Mainufer und Skyline.",
    stuttgart: "Datingideen zwischen Kessel, Kultur und Weinbergen.",
    kassel: "Entspannt kennenlernen mitten in Nordhessen.",
    nuernberg: "Charmante Altstadtmomente und neue Verbindungen.",
    leipzig: "Kreative Viertel und viel Raum für neue Nähe.",
    hannover: "Grüne Stadt, kurze Wege und schöne erste Dates.",
    bremen: "Norddeutsche Gelassenheit für echte Begegnungen.",
    duesseldorf: "Rheinpromenade, Kultur und ein erstes Kennenlernen.",
    dresden: "Romantische Kulissen und lebendige Viertel entdecken.",
    duisburg: "Industriekultur und neue Kontakte im westlichen Ruhrgebiet.",
    augsburg: "Historische Gassen und entspannte Datingmomente.",
    freiburg: "Sonnige Plätze und queeres Leben im Breisgau.",
    essen: "Kultur, Grün und Community mitten im Ruhrgebiet.",
    magdeburg: "Neue Lieblingsorte an der Elbe entdecken.",
  },
});

const HUB_PRESENTATION = Object.freeze({
  kicker: "Deutschland entdecken",
  heading: "Wähle Deine Stadt",
  intro: "Von Berlin bis Freiburg: Entdecke Datingtipps, Treffpunkte und Männer aus Deiner Region.",
  ctaTitle: "Deine Stadt ist schon dabei.",
  ctaLabel: "Männer in meiner Region finden",
});

const CARD_IMAGE_EXCLUSIONS = /statistik|statistics|dating-statistik|flirt-statistik|community-in-|flagge|testbericht|singleboersen-ueberblick/i;

function citySlug(path) {
  return path.split("/").filter(Boolean).at(-1) || "";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getHubPresentation() {
  return HUB_PRESENTATION;
}

export function buildCityCards(pages, root = "partnersuche") {
  const prefix = `/${root}/`;
  return pages
    .filter((page) => page.type === "location" && page.path.startsWith(prefix))
    .map((page) => {
      const slug = citySlug(page.path);
      const selectedImage = selectHeroImage(page.images);
      const image = selectedImage && !CARD_IMAGE_EXCLUSIONS.test(`${selectedImage.src} ${selectedImage.alt || ""}`) ? selectedImage : null;
      const name = getLocationName(page.path);
      return {
        path: page.path,
        name,
        teaser: HUB_CONFIG.teasers[slug] || `Männer aus ${name} kennenlernen und lokale Datingtipps entdecken.`,
        image,
        registrationUrl: getRegistrationUrl(page.path),
        featuredOrder: HUB_CONFIG.featured.indexOf(slug),
      };
    })
    .sort((a, b) => {
      const aFeatured = a.featuredOrder >= 0;
      const bFeatured = b.featuredOrder >= 0;
      if (aFeatured && bFeatured) return a.featuredOrder - b.featuredOrder;
      if (aFeatured) return -1;
      if (bFeatured) return 1;
      return a.name.localeCompare(b.name, "de");
    });
}

export function removeLegacyCityLists(html, root = "partnersuche", heading = "") {
  const cityLink = new RegExp(`href=["']/${root}/`, "i");
  let cleaned = html.replace(/<ul(?:\s[^>]*)?>[\s\S]*?<\/ul>/gi, (list) => (cityLink.test(list) ? "" : list));
  if (heading) cleaned = cleaned.replace(new RegExp(`<h1>${escapeRegExp(heading)}</h1>`, "i"), "");
  if (root === "partnersuche") cleaned = cleaned.replace(/<p><img[^>]+er-sucht-ihn-de-titelbild[^>]*\/>\s*<\/p>/i, "");
  return cleaned;
}
