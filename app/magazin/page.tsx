import type { Metadata } from "next";
import Link from "next/link";
import { magazinePages, magazinePosts, magazineUpdatedDate, magazineUpdatedLabel } from "@/lib/magazine";

export const metadata: Metadata = {
  title: "Magazin für schwule Männer – Dating, Liebe & schwules Leben",
  description: "Artikel über Gay-Dating, Beziehungen, Coming-out und das Leben als schwuler Mann.",
  alternates: { canonical: "https://er-sucht-ihn.de/magazin/" },
  openGraph: {
    type: "website",
    url: "https://er-sucht-ihn.de/magazin/",
    title: "Das Er-sucht-Ihn Magazin",
    description: "Artikel über Gay-Dating, Beziehungen, Coming-out und schwules Leben.",
  },
};

export default function MagazinePage() {
  const featured = magazinePosts.slice(0, 3);
  const morePosts = magazinePosts.slice(3);
  return (
    <main className="magazine-main">
      <section className="magazine-hero">
        <div className="wrap magazine-hero-inner">
          <p className="kicker">Er-sucht-Ihn Magazin</p>
          <h1>Dating, Liebe und schwules Leben</h1>
          <p>Hier geht es um Dates mit Männern, Beziehungen, Coming-out und das Leben als schwuler Mann.</p>
        </div>
      </section>

      <section className="wrap magazine-section" aria-labelledby="aktuell">
        <div className="magazine-heading"><div><p className="kicker">Neu im Magazin</p><h2 id="aktuell">Aktuelle Beiträge</h2></div><p>Neue Artikel über Gay-Dating, Beziehungen und Coming-out.</p></div>
        <div className="magazine-feature-grid">
          {featured.map((entry, index) => (
            <article className={`magazine-feature-card ${index === 0 ? "magazine-feature-lead" : ""}`} key={entry.id}>
              <Link href={entry.path} aria-label={`${entry.title} lesen`}>
                <MagazineImage entry={entry} />
                <div className="magazine-card-copy">
                  <span>{entry.categories[0]?.name || "Magazin"}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                  <time dateTime={magazineUpdatedDate(entry)}>{magazineUpdatedLabel(entry)}</time>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap magazine-section" aria-labelledby="alle-beitraege">
        <div className="magazine-heading"><div><p className="kicker">Weiterlesen</p><h2 id="alle-beitraege">Alle Beiträge</h2></div><p>Lies über Partnersuche, Coming-out, Sex, Sicherheit, Beziehungen und schwule Kultur.</p></div>
        <div className="magazine-card-grid">
          {morePosts.map((entry) => (
            <article className="magazine-card" key={entry.id}>
              <Link href={entry.path}>
                <MagazineImage entry={entry} />
                <div className="magazine-card-copy">
                  <span>{entry.categories[0]?.name || "Ratgeber"}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                  <time dateTime={magazineUpdatedDate(entry)}>{magazineUpdatedLabel(entry)}</time>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap magazine-section magazine-guides" aria-labelledby="guides">
        <div className="magazine-heading"><div><p className="kicker">Schnell gefunden</p><h2 id="guides">Gay-Locations, Begriffe und mehr</h2></div><p>Finde Gay-Locations in Deiner Stadt und lies Begriffe aus Dating und schwulem Leben nach.</p></div>
        <div className="magazine-guide-grid">
          {magazinePages.map((entry) => <Link href={entry.path} key={entry.id}><strong>{entry.title}</strong><span>Guide öffnen →</span></Link>)}
        </div>
      </section>
    </main>
  );
}

function MagazineImage({ entry }: { entry: (typeof magazinePosts)[number] }) {
  return entry.featuredImage
    ? <span className="magazine-card-media"><img src={entry.featuredImage} alt="" loading="lazy" /></span>
    : <span className="magazine-card-media magazine-card-fallback" aria-hidden="true" />;
}
