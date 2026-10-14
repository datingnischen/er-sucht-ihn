import { getLocationName, normalizePath, publicUrl } from "./site-contract.mjs";
import { cityGeo } from "./city-geo.mjs";
import { getStateByPath, stateOfCity } from "./state-pages.mjs";

const ROOT_NAMES = Object.freeze({
  partnersuche: "Partnersuche",
  "ueber-uns": "Über uns",
});

const LOCATION_NAMES = Object.freeze({});

/**
 * Stadtseiten: Start › Partnersuche › Bundesland › Stadt. Das Bundesland kommt aus der echten Region,
 * nicht aus dem ICONY-Pfad (Halberstadt → Sachsen-Anhalt, Augsburg → Bayern); Stadtstaaten ohne Landesebene.
 */
function cityBreadcrumbs(normalized) {
  const geo = cityGeo(normalized);
  if (!geo) return null;
  const state = stateOfCity(normalized);
  return [
    { name: "Start", path: "/" },
    { name: ROOT_NAMES.partnersuche, path: "/partnersuche" },
    ...(state ? [{ name: state.name, path: state.path }] : []),
    { name: geo.name, path: normalized },
  ];
}

export function buildBreadcrumbs(path, currentPageName) {
  const normalized = normalizePath(path);
  const segments = normalized.split("/").filter(Boolean);
  const breadcrumbs = [{ name: "Start", path: "/" }];
  if (!segments.length) return breadcrumbs;

  const city = cityBreadcrumbs(normalized);
  const state = getStateByPath(normalized);
  if (city) {
    breadcrumbs.splice(0, breadcrumbs.length, ...city);
  } else if (state) {
    breadcrumbs.push({ name: ROOT_NAMES.partnersuche, path: "/partnersuche" }, { name: state.name, path: normalized });
  } else {
    const root = segments[0];
    breadcrumbs.push({ name: ROOT_NAMES[root] || getLocationName(`/${root}`), path: `/${root}` });
    for (let index = 1; index < segments.length; index += 1) {
      const slug = segments[index];
      breadcrumbs.push({
        name: LOCATION_NAMES[slug] || getLocationName(`/${slug}`),
        path: `/${segments.slice(0, index + 1).join("/")}`,
      });
    }
  }
  if (currentPageName && breadcrumbs.length > 1) breadcrumbs.at(-1).name = currentPageName;
  return breadcrumbs;
}

export function buildBreadcrumbSchema(path, currentPageName) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: buildBreadcrumbs(path, currentPageName).filter((item) => item.linked !== false).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: publicUrl(item.path),
    })),
  };
}
