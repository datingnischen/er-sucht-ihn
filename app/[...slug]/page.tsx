import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFamilyPages, getImportedPage, normalizePublicPath, publicPages } from "@/lib/content";
import { selectHeroImage } from "@/lib/hero-image.mjs";
import { locationName, registrationUrl } from "@/lib/site";
import { CityCardSection } from "@/components/city-card-section";
import { removeLegacyCityLists } from "@/lib/location-hub.mjs";
import { buildBreadcrumbs, buildBreadcrumbSchema } from "@/lib/breadcrumbs.mjs";
import { buildRelatedCards } from "@/lib/related-cards.mjs";
import { RelatedCardSection } from "@/components/related-card-section";
import { buildPageEntityGraph, serializePageEntityGraph } from "@/lib/page-entities.mjs";

type Props = { params: Promise<{ slug: string[] }> };

export function generateStaticParams() {
  return publicPages.filter((page) => page.path !== "/").map((page) => ({ slug: page.path.slice(1).split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getImportedPage(normalizePublicPath(slug));
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: page.canonical }, openGraph: { title: page.title, description: page.description, url: page.canonical, images: selectHeroImage(page.images)?.src ? [selectHeroImage(page.images).src] : undefined } };
}

export default async function ImportedPageView({ params }: Props) {
  const { slug } = await params;
  const path = normalizePublicPath(slug);
  const page = getImportedPage(path);
  if (!page || page.type === "platform" || page.type === "magazine") notFound();
  const root = path.split("/")[1] as "partnersuche" | "lexikon";
  const image = selectHeroImage(page.images);
  const locationHubRoot = root === "partnersuche" && path === "/partnersuche" ? "partnersuche" : null;
  const related = !locationHubRoot && ["partnersuche", "lexikon"].includes(root) ? getFamilyPages(root).filter((item) => item.path !== path).slice(0, 6) : [];
  const relatedCards = page.type === "location" && !locationHubRoot ? buildRelatedCards(publicPages, path, root) : [];
  const contentHtml = locationHubRoot ? removeLegacyCityLists(page.contentHtml, locationHubRoot, page.h1) : page.contentHtml;
  const breadcrumbName = page.type === "location" ? undefined : page.h1;
  const breadcrumbs = buildBreadcrumbs(path, breadcrumbName);
  const breadcrumbSchema = buildBreadcrumbSchema(path, breadcrumbName);
  const pageEntityGraph = buildPageEntityGraph(page);
  return <main className="wrap page-shell">
    <article className="article-card">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{breadcrumbs.map((item, index) => <li key={item.path}>{index < breadcrumbs.length - 1 ? <Link href={item.path}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}</li>)}</ol></nav>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializePageEntityGraph(pageEntityGraph) }} />
      <div className="article-hero"><div><p className="kicker">{page.type === "location" ? "Regional kennenlernen" : page.type === "lexicon" ? "Kurz erklärt" : "Gut informiert"}</p><h1>{page.h1}</h1><p className="lead">{page.description}</p><a className="button button-green" href={registrationUrl(path)}>Jetzt kostenlos starten</a></div>{image ? <img src={image.src} alt={image.alt || page.h1} /> : null}</div>
      {page.type === "location" && page.widgetUrl ? <section className="city-singles-widget" aria-labelledby="single-maenner-widget">
        <div className="city-singles-widget-heading"><div><p className="kicker">Gerade aktiv</p><h2 id="single-maenner-widget">Single-Männer aus {locationName(path)} und Umgebung</h2></div><p>Sieh, welche Männer zuletzt bei Er-sucht-Ihn aktiv waren, und öffne ein Profil, das Dich neugierig macht.</p></div>
        <div className="city-singles-widget-body">
          <iframe src={page.widgetUrl} title={`Single-Männer aus ${locationName(path)} und Umgebung`} loading="lazy" referrerPolicy="no-referrer" />
          <div className="city-singles-widget-action"><h3>Du möchtest einen Mann kennenlernen?</h3><p>Erstelle kostenlos Dein Profil und schreib Männer an, die zu Dir passen.</p><a className="button button-green" href={registrationUrl(path)}>Kostenlos Männer kennenlernen</a></div>
        </div>
      </section> : null}
      {locationHubRoot ? <CityCardSection pages={publicPages} root={locationHubRoot} /> : null}
      <div className="rich-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />
      <aside className="inline-cta"><h2>Bereit für Deinen ersten Kontakt?</h2><p>Erstelle kostenlos Dein Profil und entdecke Männer, die ähnliche Wünsche und Werte mitbringen.</p><a className="button button-green" href={registrationUrl(path)}>Kostenlos registrieren</a></aside>
    </article>
    {relatedCards.length ? <RelatedCardSection cards={relatedCards} /> : related.length ? <aside className="related"><p className="kicker">Weiter entdecken</p><h2>Weitere passende Einstiege</h2><div className="related-grid">{related.map((item) => <Link href={item.path} key={item.path}><strong>{item.h1}</strong><span>Mehr erfahren →</span></Link>)}</div></aside> : null}
  </main>;
}
