import { getLocationName, normalizePath, SITE_URL } from "./site-contract.mjs";

const ROOT_NAMES = Object.freeze({
  partnersuche: "Partnersuche",
  "ueber-uns": "Über uns",
});

const LOCATION_NAMES = Object.freeze({});

export function buildBreadcrumbs(path, currentPageName) {
  const normalized = normalizePath(path);
  const segments = normalized.split("/").filter(Boolean);
  const breadcrumbs = [{ name: "Start", path: "/" }];
  if (!segments.length) return breadcrumbs;

  const root = segments[0];
  breadcrumbs.push({ name: ROOT_NAMES[root] || getLocationName(`/${root}`), path: `/${root}` });

  for (let index = 1; index < segments.length; index += 1) {
    const slug = segments[index];
    breadcrumbs.push({
      name: LOCATION_NAMES[slug] || getLocationName(`/${slug}`),
      path: `/${segments.slice(0, index + 1).join("/")}`,
    });
  }
  if (currentPageName && breadcrumbs.length > 1) breadcrumbs.at(-1).name = currentPageName;
  return breadcrumbs;
}

export function buildBreadcrumbSchema(path, currentPageName) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: buildBreadcrumbs(path, currentPageName).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
