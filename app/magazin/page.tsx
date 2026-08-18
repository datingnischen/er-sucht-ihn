import type { Metadata } from "next";
import Link from "next/link";
import { magazinePages, magazinePosts } from "@/lib/magazine";

export const metadata: Metadata = {
  title: "Magazin für schwule Männer – Dating, Liebe & Community",
  description: "Ratgeber, Geschichten und Orientierung rund um schwules Dating, Beziehungen, Coming-out und queeres Leben.",
  alternates: { canonical: "https://er-sucht-ihn.de/magazin" },
  openGraph: {
    type: "website",
    url: "https://er-sucht-ihn.de/magazin",
    title: "Das Er-sucht-Ihn Magazin",
    description: "Datingwissen, Beziehungen und Community-Themen für Männer, die Männer lieben.",
  },
};

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(date));
}

export default function MagazinePage() {
  const featured = magazinePosts.slice(0, 3);
  const morePosts = magazinePosts.slice(3);
  return (
    <main className="magazine-main">
      <section className="magazine-hero">
        <div className="wrap magazine-hero-inner">
          <p className="kicker">Er-sucht-Ihn Magazin</p>
          <h1>Dating, Liebe und queeres Leben</h1>
          <p>Wissen, Erfahrungen und neue Perspektiven für Männer, die Männer lieben – verständlich, offen und ohne unnötige Umwege.</p>
        </div>
      </section>

      <section className="wrap magazine-section" aria-labelledby="aktuell">
        <div className="magazine-heading"><div><p className="kicker">Neu im Magazin</p><h2 id="aktuell">Aktuelle Beiträge</h2></div><p>Neue Entwicklungen, hilfreiche Einordnungen und Themen aus der Community.</p></div>
        <div className="magazine-feature-grid">
          {featured.map((entry, index) => (
            <article className={`magazine-feature-card ${index === 0 ? "magazine-feature-lead" : ""}`} key={entry.id}>
              <Link href={entry.path} aria-label={`${entry.title} lesen`}>
                <MagazineImage entry={entry} />
                <div className="magazine-card-copy">
                  <span>{entry.categories[0]?.name || "Magazin"}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                  <time dateTime={entry.date}>{dateLabel(entry.date)}</time>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap magazine-section" aria-labelledby="alle-beitraege">
        <div className="magazine-heading"><div><p className="kicker">Weiterlesen</p><h2 id="alle-beitraege">Alle Beiträge</h2></div><p>Von Partnersuche und Coming-out bis zu Kultur, Sicherheit und Beziehungsthemen.</p></div>
        <div className="magazine-card-grid">
          {morePosts.map((entry) => (
            <article className="magazine-card" key={entry.id}>
              <Link href={entry.path}>
                <MagazineImage entry={entry} />
                <div className="magazine-card-copy">
                  <span>{entry.categories[0]?.name || "Ratgeber"}</span>
                  <h3>{entry.title}</h3>
                  <p>{entry.description}</p>
                  <time dateTime={entry.date}>{dateLabel(entry.date)}</time>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap magazine-section magazine-guides" aria-labelledby="guides">
        <div className="magazine-heading"><div><p className="kicker">Dauerhaft hilfreich</p><h2 id="guides">Guides und Gay-Locations</h2></div><p>Stadt-Guides, Glossar und weitere feste Einstiege für Deine Orientierung.</p></div>
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
