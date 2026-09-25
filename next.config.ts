import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";
import { aboutRedirects } from "./lib/about-pages.mjs";

// Der nginx vor er-sucht-ihn.de reicht nur Seitenrouten an Vercel weiter; /_next/* und public/-Dateien
// kommen deshalb absolut vom Vercel-Host (per NEXT_PUBLIC_ASSET_HOST ueberschreibbar).
const DEFAULT_ASSET_HOST = "https://er-sucht-ihn-two.vercel.app";
const DEFAULT_ASSET_PATH_PREFIX = "/app-assets";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeAssetPathPrefix(value: string) {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  const trimmed = trimTrailingSlash(withLeadingSlash);
  return trimmed || DEFAULT_ASSET_PATH_PREFIX;
}

export default function nextConfig(phase: string): NextConfig {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  const assetHost = trimTrailingSlash(process.env.NEXT_PUBLIC_ASSET_HOST || DEFAULT_ASSET_HOST);
  const assetPathPrefix = normalizeAssetPathPrefix(
    process.env.NEXT_PUBLIC_ASSET_PATH_PREFIX || DEFAULT_ASSET_PATH_PREFIX,
  );

  return {
    poweredByHeader: false,
    // Seiten-URLs enden auf "/" wie die ICONY-Plattform; Next leitet Pfade ohne Schrägstrich per 308 um
    // (relativ, Dateien wie /sitemap.xml und Bild-URLs bleiben ohne).
    trailingSlash: true,
    assetPrefix: isDev ? undefined : `${assetHost}${assetPathPrefix}`,
    turbopack: { root: process.cwd() },
    async redirects() {
      return [
        ...aboutRedirects,
        { source: "/lexikon", destination: "/magazin/", permanent: true },
        { source: "/lexikon/:slug", destination: "/magazin/:slug/", permanent: true },
        { source: "/magazin/wp-sitemap.xml", destination: "/magazin/sitemap.xml", permanent: true },
        { source: "/magazin/sitemap_index.xml", destination: "/magazin/sitemap.xml", permanent: true },
        { source: "/magazin/post-sitemap.xml", destination: "/magazin/sitemap.xml", permanent: true },
        { source: "/magazin/page-sitemap.xml", destination: "/magazin/sitemap.xml", permanent: true },
        { source: "/magazin/tv-show-prince-charming-staffel-1", destination: "/magazin/prince-charming-2019-staffel-1/", permanent: true },
        { source: "/magazin/tv-show-prince-charming-staffel-2", destination: "/magazin/prince-charming-2020-staffel-2/", permanent: true },
        { source: "/magazin/tv-show-prince-charming-staffel-3", destination: "/magazin/prince-charming-2021-staffel-3/", permanent: true },
        { source: "/magazin/geschlechtsumwandlung-alles-was-du-wissen-musst", destination: "/magazin/geschlechtsumwandlung/", permanent: true },
        { source: "/magazin/page/1", destination: "/magazin/", permanent: true },
        { source: "/magazin/page/2", destination: "/magazin/", permanent: true },
        { source: "/magazin/page/3", destination: "/magazin/", permanent: true },
        { source: "/magazin/page/4", destination: "/magazin/", permanent: true },
        { source: "/magazin/page/5", destination: "/magazin/", permanent: true },
        { source: "/magazin/page/6", destination: "/magazin/", permanent: true },
      ];
    },
    async rewrites() {
      return [{ source: `${assetPathPrefix}/:path*`, destination: "/:path*" }];
    },
    async headers() {
      return [{
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      }];
    },
    images: {
      remotePatterns: [
        { protocol: "https", hostname: "static-cms.icony-hosting.de" },
        { protocol: "https", hostname: "static2.icony-hosting.de" },
      ],
    },
  };
}
