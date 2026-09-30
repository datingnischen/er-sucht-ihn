import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ABOUT_SOCIAL_PATH } from "@/lib/about-pages.mjs";
import { getImportedPage, normalizePublicPath, publicPages } from "@/lib/content";
import { removeHeroImageFromContent, selectHeroImage } from "@/lib/hero-image.mjs";
import { buildFaqMainEntity, extractFaq } from "@/lib/faq.mjs";
import { removeLegacyCityLists } from "@/lib/location-hub.mjs";
import { buildBreadcrumbs, buildBreadcrumbSchema } from "@/lib/breadcrumbs.mjs";
import { buildPageEntityGraph, serializePageEntityGraph } from "@/lib/page-entities.mjs";
import { LocationHubPage } from "@/components/location/location-hub-page";
import { LocationCityPage } from "@/components/location/location-city-page";
import { ContentPage } from "@/components/editorial/content-page";

type Props = { params: Promise<{ slug: string[] }> };

// Paths with their own route under app/ instead of the imported-page template.
const dedicatedRoutes = new Set([ABOUT_SOCIAL_PATH]);
const HUB_PATH = "/partnersuche";

export function generateStaticParams() {
  return publicPages.filter((page) => page.path !== "/" && !dedicatedRoutes.has(page.path)).map((page) => ({ slug: page.path.slice(1).split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getImportedPage(normalizePublicPath(slug));
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: page.canonical }, openGraph: { title: page.title, description: page.description, url: page.canonical, images: selectHeroImage(page.images)?.src ? [selectHeroImage(page.images).src] : undefined } };
}

/**
 * Verteilt die importierten ICONY-Seiten auf drei Vorlagen:
 * Städteübersicht (/partnersuche), Stadtseiten und Inhaltsseiten (FAQ, Bewertungen, Ratgeber).
 */
export default async function ImportedPageView({ params }: Props) {
  const { slug } = await params;
  const path = normalizePublicPath(slug);
  const page = getImportedPage(path);
  if (!page || page.type === "platform" || page.type === "magazine") notFound();
  const isHub = path === HUB_PATH;
  const image = selectHeroImage(page.images);
  const contentHtml = removeHeroImageFromContent(isHub ? removeLegacyCityLists(page.contentHtml, "partnersuche", page.h1) : page.contentHtml, image);
  const faq = extractFaq(contentHtml);
  const breadcrumbName = page.type === "location" ? undefined : page.h1;
  const breadcrumbs = buildBreadcrumbs(path, breadcrumbName);
  const pageEntityGraph = buildPageEntityGraph(page, { faqEntities: faq ? buildFaqMainEntity(faq.groups) : [], breadcrumb: buildBreadcrumbSchema(path, breadcrumbName) });
  const view = { page, path, image, contentHtml, faq, breadcrumbs };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializePageEntityGraph(pageEntityGraph) }} />
    {isHub ? <LocationHubPage {...view} />
      : page.type === "location" ? <LocationCityPage {...view} />
      : <ContentPage {...view} />}
  </>;
}
