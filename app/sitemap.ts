import type { MetadataRoute } from "next";
import { publicPages } from "@/lib/content";
import { magazineEntries } from "@/lib/magazine";
import { ABOUT_ROOT_PATH } from "@/lib/about-pages.mjs";
import { publicUrl } from "@/lib/site-contract.mjs";

export default function sitemap(): MetadataRoute.Sitemap {
  const editorial = publicPages.map((page) => ({ url: page.canonical, changeFrequency: page.path === "/" ? "weekly" as const : "monthly" as const, priority: page.path === "/" ? 1 : page.type === "location" ? 0.8 : 0.65 }));
  const magazine = [
    { url: "https://er-sucht-ihn.de/magazin/", changeFrequency: "weekly" as const, priority: 0.85 },
    ...magazineEntries.map((entry) => ({ url: entry.canonical, lastModified: entry.modified, changeFrequency: "monthly" as const, priority: entry.type === "post" ? 0.7 : 0.65 })),
  ];
  const about = { url: publicUrl(ABOUT_ROOT_PATH), changeFrequency: "monthly" as const, priority: 0.6 };
  return [...editorial, about, ...magazine];
}
