import type { MetadataRoute } from "next";
import { publicPages } from "@/lib/content";
import { magazineEntries } from "@/lib/magazine";

export default function sitemap(): MetadataRoute.Sitemap {
  const editorial = publicPages.map((page) => ({ url: page.canonical, changeFrequency: page.path === "/" ? "weekly" as const : "monthly" as const, priority: page.path === "/" ? 1 : page.type === "location" ? 0.8 : 0.65 }));
  const magazine = [
    { url: "https://er-sucht-ihn.de/magazin", changeFrequency: "weekly" as const, priority: 0.85 },
    ...magazineEntries.map((entry) => ({ url: entry.canonical, lastModified: entry.modified, changeFrequency: "monthly" as const, priority: entry.type === "post" ? 0.7 : 0.65 })),
  ];
  return [...editorial, ...magazine];
}
