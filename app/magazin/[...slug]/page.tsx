import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getMagazineAttachment,
  getMagazineEntry,
  magazineStaticParams,
  relatedMagazineEntries,
} from "@/lib/magazine";
import { registrationUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return magazineStaticParams();
}

type Props = { params: Promise<{ slug: string[] }> };

function pathFrom(slug: string[]) {
  return `/magazin/${slug.join("/")}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = getMagazineEntry(pathFrom(slug));
  if (!entry) return { robots: { index: false, follow: false } };
  return {
    title: entry.title,
    description: entry.description,
    alternates: { canonical: entry.canonical },
    openGraph: {
      type: "article",
      url: entry.canonical,
      title: entry.title,
      description: entry.description,
      publishedTime: entry.date,
      modifiedTime: entry.modified,
      images: entry.featuredImage ? [{ url: entry.featuredImage }] : undefined,
    },
  };
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(date));
}

export default async function MagazineDetailPage({ params }: Props) {
  const { slug } = await params;
  const path = pathFrom(slug);
  const entry = getMagazineEntry(path);
  if (!entry) {
    const attachment = getMagazineAttachment(path);
    if (attachment) permanentRedirect(attachment.target);
    notFound();
  }
  const related = relatedMagazineEntries(entry);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": entry.type === "post" ? "Article" : "WebPage",
    "@id": `${entry.canonical}#article`,
    url: entry.canonical,
    headline: entry.title,
    description: entry.description,
    datePublished: entry.date,
    dateModified: entry.modified,
    image: entry.featuredImage || undefined,
    author: entry.author ? { "@type": "Person", name: entry.author.name } : undefined,
    isPartOf: { "@id": "https://er-sucht-ihn.de/#website" },
  };
  return (
    <main className="magazine-main magazine-article-main">
      <div className="wrap">
        <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Startseite</Link><span aria-hidden="true">›</span><Link href="/magazin">Magazin</Link><span aria-hidden="true">›</span><span aria-current="page">{entry.title}</span></nav>
        <article className="magazine-article">
          <header className="magazine-article-header">
            <p className="kicker">{entry.categories[0] ? <Link href={`/magazin/kategorie/${entry.categories[0].slug}`}>{entry.categories[0].name}</Link> : (entry.type === "page" ? "Guide" : "Magazin")}</p>
            <h1>{entry.title}</h1>
            <p className="magazine-article-deck">{entry.description}</p>
            <div className="magazine-byline">
              {entry.author?.name && <span>Von <Link href={`/magazin/author/${entry.author.slug}`}>{entry.author.name}</Link></span>}
              {entry.date && <time dateTime={entry.date}>{dateLabel(entry.date)}</time>}
            </div>
          </header>
          {entry.featuredImage && <figure className="magazine-article-hero"><img src={entry.featuredImage} alt="" /></figure>}
          <div className="magazine-article-layout">
            <div className="rich-content magazine-rich-content" dangerouslySetInnerHTML={{ __html: entry.contentHtml }} />
            <aside className="magazine-side">
              <div className="magazine-side-cta">
                <p className="kicker">Männer kennenlernen</p>
                <h2>Bereit für neue Kontakte?</h2>
                <p>Entdecke Männer, die zu Dir und Deinen Wünschen passen.</p>
                <a className="button button-green" href={registrationUrl(path)}>Kostenlos registrieren</a>
              </div>
              <a className="magazine-radar-card" href={registrationUrl(path)}>
                <img src="/brand/umkreissuche-radar.svg" alt="Umkreissuche: Männer in Deiner Nähe – kostenlos anmelden" width={320} height={480} loading="lazy" decoding="async" />
              </a>
            </aside>
          </div>
        </article>
        {related.length > 0 && <section className="magazine-related" aria-labelledby="weiterlesen"><p className="kicker">Passend dazu</p><h2 id="weiterlesen">Weiterlesen im Magazin</h2><div className="magazine-related-grid">{related.map((item) => <Link href={item.path} key={item.id}>{item.featuredImage ? <img src={item.featuredImage} alt="" loading="lazy" /> : <span aria-hidden="true" />}<strong>{item.title}</strong><small>Artikel lesen →</small></Link>)}</div></section>}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </main>
  );
}
