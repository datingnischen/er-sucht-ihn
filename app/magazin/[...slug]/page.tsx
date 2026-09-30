import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { MagazineBreadcrumbs } from "@/components/magazine-breadcrumbs";
import { ArrowIcon, BookIcon, CalendarIcon, ClockIcon, HeartFilledIcon, MarsPairIcon, PinIcon } from "@/components/icons";
import { MagazineCategoryIcon } from "@/components/magazine/category-icon";
import { authorProfile, BIO_PAGE_SLUGS, initials, isSceneGuide, prepareArticleHtml, readingMinutes } from "@/components/magazine/content";
import { MagazineCard, MagazineMedia } from "@/components/magazine/magazine-card";
import {
  articleUpdatedDate,
  getMagazineAttachment,
  getMagazineEntry,
  magazineStaticParams,
  relatedMagazineEntries,
} from "@/lib/magazine";
import { registrationUrl, SITE_URL } from "@/lib/site";
import { staticAsset } from "@/lib/static-asset.mjs";

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
  const updated = entry.type === "post" ? articleUpdatedDate(entry) : "";
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
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
  const category = entry.categories[0] ?? null;
  const isBio = entry.type === "page" && BIO_PAGE_SLUGS.has(entry.slug);
  const isGuide = entry.type === "page" && isSceneGuide(entry);
  const { html, headings } = prepareArticleHtml(entry.contentHtml);
  const minutes = readingMinutes(entry.contentHtml);
  const author = entry.author && !isBio ? { ...entry.author, ...authorProfile(entry.author.slug) } : null;
  const badge = category?.name || (isBio ? "Magazin-Autor" : isGuide ? "Szene-Guide" : "Magazin-Seite");
  const badgeIcon = category ? <MagazineCategoryIcon slug={category.slug} /> : isGuide ? <PinIcon /> : isBio ? <MarsPairIcon /> : <BookIcon />;
  return (
    <main className={`mz-main mz-article-main${entry.type === "page" ? " mz-article-page" : ""}`}>
      <section className="mz-hero mz-article-hero">
        <span className="mz-hero-glow" aria-hidden="true" />
        <div className="wrap mz-article-grid">
          <div className="mz-hero-copy">
            <MagazineBreadcrumbs current={entry.title} trail={category ? [{ name: category.name, path: `/magazin/kategorie/${category.slug}` }] : []} />
            {category
              ? <Link className="mz-badge mz-badge-link" href={`/magazin/kategorie/${category.slug}`}><span className="mz-badge-icon" aria-hidden="true">{badgeIcon}</span>{badge}</Link>
              : <span className="mz-badge"><span className="mz-badge-icon" aria-hidden="true">{badgeIcon}</span>{badge}</span>}
            <h1>{entry.title}</h1>
            <p className="mz-hero-lead mz-article-deck">{entry.description}</p>
            <div className="mz-byline">
              {author && (
                <span className="mz-byline-author">
                  {author.portrait
                    ? <img src={author.portrait} alt={`Porträt von ${author.name}`} width={44} height={44} />
                    : <span className="mz-byline-initials" aria-hidden="true">{initials(author.name)}</span>}
                  <span>Von <Link href={`/magazin/author/${author.slug}`}>{author.name}</Link></span>
                </span>
              )}
              {updated && <span className="mz-byline-item"><CalendarIcon />Aktualisiert am <time dateTime={updated}>{dateLabel(updated)}</time></span>}
              <span className="mz-byline-item"><ClockIcon />{minutes} Min. Lesezeit</span>
            </div>
          </div>
          <figure className="mz-article-figure">
            <MagazineMedia entry={entry} className="mz-article-arch" eager />
            <span className="mz-hero-arch-icon" aria-hidden="true"><HeartFilledIcon /></span>
          </figure>
        </div>
      </section>

      <div className="wrap mz-article-layout" id="inhalt">
        <article className="mz-article">
          {headings.length >= 3 && (
            <nav className="mz-toc" aria-labelledby="mz-toc-titel">
              <p className="mz-toc-title" id="mz-toc-titel"><BookIcon />Inhalt · {headings.length} Abschnitte</p>
              <ol>
                {headings.map((heading) => <li key={heading.id}><a href={`#${heading.id}`}>{heading.text}</a></li>)}
              </ol>
            </nav>
          )}
          <div className="rich-content mz-prose" dangerouslySetInnerHTML={{ __html: html }} />

          {author && (
            <aside className="mz-author-box" aria-label="Über den Autor">
              {author.portrait
                ? <img src={author.portrait} alt={`Porträt von ${author.name}`} width={96} height={96} loading="lazy" />
                : <span className="mz-author-box-initials" aria-hidden="true">{initials(author.name)}</span>}
              <div>
                <p className="kicker">Geschrieben von</p>
                <h2>{author.name}</h2>
                {author.role && <p className="mz-author-box-role">{author.role}</p>}
                {author.bioLead && <p>{author.bioLead}</p>}
                <div className="mz-author-box-links">
                  <Link className="text-link" href={`/magazin/author/${author.slug}`}>Alle Beiträge <ArrowIcon /></Link>
                  {author.bioEntry && <Link className="text-link" href={author.bioEntry.path}>Mehr über {author.slug === "redaktion" ? "unsere Redaktion" : author.name.split(" ")[0]} <ArrowIcon /></Link>}
                </div>
              </div>
            </aside>
          )}
        </article>

        <aside className="mz-side" aria-label="Kostenlos registrieren">
          <div className="mz-side-sticky">
            <div className="mz-side-cta">
              <span className="mz-side-cta-icon" aria-hidden="true"><MarsPairIcon /></span>
              <p className="kicker">Männer kennenlernen</p>
              <h2>Bereit für neue <em>Kontakte?</em></h2>
              <p>Entdecke Männer, die zu Dir und Deinen Wünschen passen.</p>
              <a className="button button-green" href={registrationUrl(path)}>Kostenlos registrieren</a>
            </div>
            <a className="mz-radar-card" href={registrationUrl(path)}>
              <img src={staticAsset("/brand/umkreissuche-radar.svg")} alt="Umkreissuche: Männer in Deiner Nähe – kostenlos anmelden" width={320} height={480} loading="lazy" decoding="async" />
            </a>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mz-related" aria-labelledby="weiterlesen">
          <div className="wrap">
            <div className="mz-head mz-head-split">
              <div><p className="kicker">Passend dazu</p><h2 id="weiterlesen">Weiterlesen im <em>Magazin</em></h2></div>
              <Link className="button button-outline" href="/magazin/archiv">Alle Artikel</Link>
            </div>
            <div className="mz-grid">
              {related.map((item) => <MagazineCard entry={item} key={item.id} />)}
            </div>
          </div>
        </section>
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </main>
  );
}
