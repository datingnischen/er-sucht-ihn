import type { NextConfig } from "next";
import { aboutRedirects } from "./lib/about-pages.mjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  async redirects() {
    return [
      ...aboutRedirects,
      { source: "/magazin/wp-sitemap.xml", destination: "/magazin/sitemap.xml", permanent: true },
      { source: "/magazin/sitemap_index.xml", destination: "/magazin/sitemap.xml", permanent: true },
      { source: "/magazin/post-sitemap.xml", destination: "/magazin/sitemap.xml", permanent: true },
      { source: "/magazin/page-sitemap.xml", destination: "/magazin/sitemap.xml", permanent: true },
      { source: "/magazin/tv-show-prince-charming-staffel-1", destination: "/magazin/prince-charming-2019-staffel-1", permanent: true },
      { source: "/magazin/tv-show-prince-charming-staffel-2", destination: "/magazin/prince-charming-2020-staffel-2", permanent: true },
      { source: "/magazin/tv-show-prince-charming-staffel-3", destination: "/magazin/prince-charming-2021-staffel-3", permanent: true },
      { source: "/magazin/geschlechtsumwandlung-alles-was-du-wissen-musst", destination: "/magazin/geschlechtsumwandlung", permanent: true },
      { source: "/magazin/page/1", destination: "/magazin", permanent: true },
      { source: "/magazin/page/2", destination: "/magazin", permanent: true },
      { source: "/magazin/page/3", destination: "/magazin", permanent: true },
      { source: "/magazin/page/4", destination: "/magazin", permanent: true },
      { source: "/magazin/page/5", destination: "/magazin", permanent: true },
      { source: "/magazin/page/6", destination: "/magazin", permanent: true },
    ];
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

export default nextConfig;
