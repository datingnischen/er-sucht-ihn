import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { MagazineBreadcrumbs } from "@/components/magazine-breadcrumbs";
import { ArrowIcon, BookIcon, ClockIcon, GlassIcon, HeartFilledIcon, HeartIcon, MarsPairIcon, PhoneIcon, PinIcon, RainbowIcon, SparkIcon, TvIcon } from "@/components/icons";
import { MagazineCategoryIcon } from "@/components/magazine/category-icon";
import { BIO_PAGE_SLUGS, categoriesWithPosts, guideCity, isSceneGuide, readingMinutes } from "@/components/magazine/content";
import { MagazineCard, MagazineMedia } from "@/components/magazine/magazine-card";
import { getMagazineEntry, magazinePages, magazinePosts } from "@/lib/magazine";
import { registrationUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Magazin für schwule Männer – Dating, Liebe & schwules Leben",
  description: "Artikel über Gay-Dating, Beziehungen, Coming-out, Gay-Locations und das Leben als schwuler Mann.",
  alternates: { canonical: "https://er-sucht-ihn.de/magazin/" },
  openGraph: {
    type: "website",
    url: "https://er-sucht-ihn.de/magazin/",
    title: "Das Er-sucht-Ihn Magazin",
    description: "Artikel über Gay-Dating, Beziehungen, Coming-out und schwules Leben.",
  },
};

// Landing shows the newest posts only; everything else lives in /magazin/archiv.
const LANDING_POST_COUNT = 15;

type EntryPoint = { path: string; label: string; teaser: string; icon: ReactNode; size?: "big" | "banner" };

// Kuratierte Einstiege; die Bilder kommen aus den verlinkten Beiträgen.
const ENTRY_POINTS: EntryPoint[] = [
  { path: "/magazin/coming-out", label: "Coming-out & Identität", teaser: "Bin ich schwul, bi oder queer? Worte für das, was Du fühlst – und Mut für den eigenen Weg.", icon: <MarsPairIcon />, size: "big" },
  { path: "/magazin/schwule-maenner-suchen", label: "Liebe & Beziehung", teaser: "Männer suchen, finden und halten – Tipps für Dating und Partnerschaft", icon: <HeartIcon /> },
  { path: "/magazin/gay-locations", label: "Szene & Nachtleben", teaser: "Gay-Bars, Clubs und Treffpunkte in Deutschland", icon: <GlassIcon /> },
  { path: "/magazin/kategorie/tv-shows-fuer-gays", label: "TV & Kultur", teaser: "Prince Charming, Kuppelshows und Gay-Kino", icon: <TvIcon /> },
  { path: "/magazin/kategorie/gay-dating", label: "Dating-Apps & Portale", teaser: "Grindr, Romeo & Co. im Vergleich", icon: <PhoneIcon /> },
  { path: "/magazin/pride-month", label: "Pride, CSD & Sichtbarkeit", teaser: "Pride Month, Regenbogenflagge und die Geschichte der Bewegung", icon: <RainbowIcon />, size: "banner" },
];

// Begriffe aus dem Glossar, die zu eigenen Magazin-Erklärungen führen.
const GLOSSARY_TERMS = ["bin-ich-schwul", "bisexuelle-maenner", "coming-out", "gaysauna", "gay-cruising", "homophobie", "homo-ehe", "geschlechtsumwandlung", "transgender-singleboerse", "shemale", "pride-month", "gaychat"];

function glossaryLinks() {
  const glossary = getMagazineEntry("/magazin/glossar");
  if (!glossary) return [];
  const labels = new Map([...glossary.contentHtml.matchAll(/<a href="\/magazin\/([^"/]+)\/?">([^<]+)<\/a>/g)].map((match) => [match[1], match[2].replace(/&amp;/g, "&")]));
  return GLOSSARY_TERMS.filter((slug) => labels.has(slug)).map((slug) => ({ path: `/magazin/${slug}`, label: labels.get(slug) as string }));
}

export default function MagazinePage() {
  const featured = magazinePosts.slice(0, 3);
  const morePosts = magazinePosts.slice(3, LANDING_POST_COUNT);
  const olderCount = magazinePosts.length - LANDING_POST_COUNT;
  const guides = magazinePages.filter((entry) => !BIO_PAGE_SLUGS.has(entry.slug));
  const sceneGuides = guides.filter(isSceneGuide);
  // Städte als Bogenfenster; die Deutschland-Übersicht ohne Bild steht darunter.
  const cityGuides = sceneGuides.filter((entry) => guideCity(entry));
  const sceneHubs = sceneGuides.filter((entry) => !cityGuides.includes(entry));
  const knowledgeGuides = guides.filter((entry) => !isSceneGuide(entry));
  const categories = categoriesWithPosts();
  const [newest, ...leads] = featured;
  const entryPoints = ENTRY_POINTS.map((entry) => ({ ...entry, image: getMagazineEntry(entry.path)?.featuredImage ?? null }));
  const terms = glossaryLinks();
  const glossary = knowledgeGuides.find((entry) => entry.slug === "glossar");
  return (
    <main className="mz-main">
      <section className="mz-hero mz-home-hero">
        <span className="mz-hero-glow" aria-hidden="true" />
        <div className="wrap mz-home-hero-grid">
          <div className="mz-hero-copy">
            <MagazineBreadcrumbs />
            <span className="mz-badge"><span className="mz-badge-icon" aria-hidden="true"><MarsPairIcon /></span>Er-sucht-Ihn Magazin</span>
            <h1>Dating, Liebe und <em>schwules Leben</em></h1>
            <p className="mz-hero-lead">Hier geht es um Dates mit Männern, Beziehungen, Coming-out und das Leben als schwuler Mann – mit Gay-Locations in Deiner Stadt.</p>
            <dl className="mz-stats">
              <div><dt>Beiträge</dt><dd>{magazinePosts.length}</dd></div>
              <div><dt>Themen</dt><dd>{categories.length}</dd></div>
              <div><dt>Szene-Guides</dt><dd>{sceneGuides.length}</dd></div>
            </dl>
            <div className="mz-hero-actions">
              <a className="button button-green" href={registrationUrl("/magazin")}>Kostenlos registrieren</a>
              <a className="button button-ghost-light" href="#einstiege">Magazin entdecken <span className="mz-down" aria-hidden="true">↓</span></a>
            </div>
          </div>

          {newest && (
            <Link className="mz-feature" href={newest.path}>
              <span className="mz-feature-pin" aria-hidden="true"><HeartFilledIcon /></span>
              <MagazineMedia entry={newest} className="mz-feature-media" eager />
              <span className="mz-feature-body">
                <span className="mz-feature-kicker"><SparkIcon />Neu im Magazin</span>
                <strong>{newest.title}</strong>
                <span className="mz-feature-excerpt">{newest.description}</span>
                <span className="mz-feature-meta">
                  <span><ClockIcon />{readingMinutes(newest.contentHtml)} Min. Lesezeit</span>
                  <span className="mz-go">Jetzt lesen <ArrowIcon /></span>
                </span>
              </span>
            </Link>
          )}
        </div>
      </section>

      <nav className="wrap mz-topics" aria-label="Magazin-Themen">
        <Link className="mz-topic mz-topic-index" href="/magazin/archiv">
          <span className="mz-topic-icon" aria-hidden="true"><BookIcon /></span>
          <span><strong>Alles von A–Z</strong><small>{magazinePosts.length} Beiträge nach Jahren</small></span>
        </Link>
        {categories.map((category) => (
          <Link className="mz-topic" href={`/magazin/kategorie/${category.slug}`} key={category.id}>
            <span className="mz-topic-icon" aria-hidden="true"><MagazineCategoryIcon slug={category.slug} /></span>
            <span><strong>{category.name}</strong><small>{category.total} {category.total === 1 ? "Beitrag" : "Beiträge"}</small></span>
          </Link>
        ))}
      </nav>

      <section id="einstiege" className="wrap mz-section" aria-labelledby="mz-einstiege-titel">
        <div className="mz-head">
          <p className="kicker">Wichtige Einstiege</p>
          <h2 id="mz-einstiege-titel">Wo möchtest Du <em>anfangen?</em></h2>
          <p>Die großen Themen des Magazins – vom Coming-out bis zur Gay-Bar um die Ecke.</p>
        </div>
        <div className="mz-bento">
          {entryPoints.map((entry, index) => (
            <Link
              key={entry.path}
              href={entry.path}
              className={["mz-tile", entry.size ? `mz-tile-${entry.size}` : "", entry.image ? "" : "mz-tile-plain"].filter(Boolean).join(" ")}
              style={{ ["--tilt" as string]: `${index % 2 ? 0.8 : -0.8}deg` }}
            >
              {entry.image ? <img src={entry.image} alt={`Magazin-Thema ${entry.label}`} loading="lazy" decoding="async" /> : null}
              <span className="mz-tile-icon" aria-hidden="true">{entry.icon}</span>
              <span className="mz-tile-copy">
                <strong>{entry.label}</strong>
                <small>{entry.teaser}</small>
              </span>
              <span className="mz-tile-arrow" aria-hidden="true"><ArrowIcon /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap mz-section" aria-labelledby="aktuell">
        <div className="mz-head mz-head-split">
          <div><p className="kicker">Neu im Magazin</p><h2 id="aktuell">Aktuelle <em>Beiträge</em></h2></div>
          <p>Neue Artikel über Gay-Dating, Beziehungen und Coming-out.</p>
        </div>
        <div className="mz-lead-grid">
          {leads.map((entry) => <MagazineCard entry={entry} variant="lead" key={entry.id} />)}
        </div>
        <div className="mz-grid">
          {morePosts.slice(0, 6).map((entry) => <MagazineCard entry={entry} key={entry.id} />)}
        </div>
      </section>

      {sceneGuides.length > 0 && (
        <section className="mz-scene" aria-labelledby="guides">
          <div className="wrap">
            <div className="mz-head mz-head-split mz-head-light">
              <div>
                <p className="kicker">Szene-Guides</p>
                <h2 id="guides">Gay-Bars und Clubs <em>in Deiner Stadt</em></h2>
              </div>
              <p>Finde Gay-Locations in Deiner Stadt – mit Adressen, Atmosphäre und Tipps für den Abend.</p>
            </div>
            <div className="mz-city-grid">
              {cityGuides.map((entry, index) => (
                <Link className="mz-city" href={entry.path} key={entry.id} style={{ ["--tilt" as string]: `${index % 2 ? 1.2 : -1.2}deg` }}>
                  <MagazineMedia entry={entry} className="mz-city-arch" />
                  <span className="mz-city-copy">
                    <small><PinIcon />Gay-Locations in</small>
                    <strong>{guideCity(entry)}</strong>
                    <span className="mz-city-go">Guide öffnen <ArrowIcon /></span>
                  </span>
                </Link>
              ))}
            </div>
            {sceneHubs.length > 0 && (
              <div className="mz-scene-hubs">
                {sceneHubs.map((entry) => (
                  <Link className="mz-scene-hub" href={entry.path} key={entry.id}>
                    <span className="mz-scene-hub-icon" aria-hidden="true"><GlassIcon /></span>
                    <span><strong>{entry.title}</strong><small>Deutschlands bekannteste Gay-Locations · {readingMinutes(entry.contentHtml)} Min. Lesezeit</small></span>
                    <ArrowIcon className="mz-scene-hub-arrow" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="wrap mz-section" aria-labelledby="alle-beitraege">
        <div className="mz-head mz-head-split">
          <div><p className="kicker">Weiterlesen</p><h2 id="alle-beitraege">Weitere <em>Beiträge</em></h2></div>
          <p>Lies über Partnersuche, Coming-out, Sex, Sicherheit, Beziehungen und schwule Kultur.</p>
        </div>
        <div className="mz-grid">
          {morePosts.slice(6).map((entry) => <MagazineCard entry={entry} key={entry.id} />)}
        </div>
        {olderCount > 0 && (
          <div className="mz-archive-cta">
            <div>
              <p className="kicker">Inhaltsverzeichnis</p>
              <h2>Noch {olderCount} ältere <em>Artikel</em></h2>
              <p>Alle {magazinePosts.length} Beiträge nach Jahren sortiert, mit Themenübersicht.</p>
            </div>
            <Link className="button button-green" href="/magazin/archiv">Alle Artikel ansehen <ArrowIcon /></Link>
          </div>
        )}
      </section>

      {knowledgeGuides.length > 0 && (
        <section className="wrap mz-section mz-knowledge" aria-labelledby="begriffe">
          <div className="mz-knowledge-card">
            <div className="mz-knowledge-copy">
              <p className="kicker">Wissen &amp; Begriffe</p>
              <h2 id="begriffe">Von Coming-out bis <em>Cruising</em></h2>
              <p>Begriffe aus Dating und Community verständlich erklärt – im Glossar von A bis Z.</p>
              {terms.length > 0 && (
                <ul className="mz-terms">
                  {terms.map((term) => <li key={term.path}><Link href={term.path}>{term.label}</Link></li>)}
                </ul>
              )}
              {glossary && <Link className="button button-green" href={glossary.path}>Zum Glossar <ArrowIcon /></Link>}
            </div>
            <ul className="mz-knowledge-list">
              {knowledgeGuides.map((entry) => (
                <li key={entry.id}>
                  <Link href={entry.path}>
                    <MagazineMedia entry={entry} className="mz-knowledge-thumb" />
                    <span><strong>{entry.title}</strong><small>{entry.slug === "glossar" ? "Begriffe von A bis Z" : `${readingMinutes(entry.contentHtml)} Min. Lesezeit`}</small></span>
                    <ArrowIcon />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

    </main>
  );
}
