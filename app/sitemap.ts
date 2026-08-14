import type { MetadataRoute } from "next";
import { publicPages } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map((page) => ({ url: page.canonical, changeFrequency: page.path === "/" ? "weekly" : "monthly", priority: page.path === "/" ? 1 : page.type === "location" ? 0.8 : 0.65 }));
}
