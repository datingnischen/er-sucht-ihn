// Der nginx vor er-sucht-ihn.de reicht nur Seitenrouten an Vercel weiter.
// Dateien aus public/ werden deshalb absolut vom Vercel-Host geladen.
const DEFAULT_ASSET_HOST = "https://er-sucht-ihn-two.vercel.app";
const DEFAULT_ASSET_PATH_PREFIX = "/app-assets";

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function normalizeAssetPathPrefix(value) {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  const trimmed = trimTrailingSlash(withLeadingSlash);
  return trimmed || DEFAULT_ASSET_PATH_PREFIX;
}

const isDev = process.env.NODE_ENV === "development";

export const assetHost = trimTrailingSlash(process.env.NEXT_PUBLIC_ASSET_HOST || DEFAULT_ASSET_HOST);

export const assetPathPrefix = normalizeAssetPathPrefix(
  process.env.NEXT_PUBLIC_ASSET_PATH_PREFIX || DEFAULT_ASSET_PATH_PREFIX,
);

export const assetBaseUrl = isDev ? "" : `${assetHost}${assetPathPrefix}`;

/** Macht einen root-relativen public/-Pfad absolut (in `next dev` bleibt er relativ). */
export function staticAsset(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${assetBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

// Der Import legt alle Medien unter public/magazine/media ab; Seitenrouten liegen nie darunter.
const ROOT_RELATIVE_ASSET = /(^|[\s"'(,=])(\/magazine\/media\/)/g;

/** Schreibt root-relative public/-Verweise in importiertem HTML (src, href, srcset) auf den Asset-Host um. */
export function absolutizeAssetUrls(html) {
  if (!html || !assetBaseUrl) return html;
  return html.replace(ROOT_RELATIVE_ASSET, (_match, before, path) => `${before}${assetBaseUrl}${path}`);
}
