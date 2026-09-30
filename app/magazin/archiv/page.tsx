import type { Metadata } from "next";
import Link from "next/link";
import { BookIcon } from "@/components/icons";
import { MagazineArchiveHero, MagazineFilterChips } from "@/components/magazine-archive";
import { categoriesWithPosts } from "@/components/magazine/content";
import { MagazineCard } from "@/components/magazine/magazine-card";
import { magazinePostsByYear, magazinePosts } from "@/lib/magazine";

export const metadata: Metadata = {
  title: "Alle Artikel im Magazin – Inhaltsverzeichnis",
  description: "Alle Artikel aus dem Er-sucht-Ihn Magazin nach Jahren sortiert: Gay-Dating, Beziehungen, Coming-out, TV-Shows und Szene.",
  alternates: { canonical: "https://er-sucht-ihn.de/magazin/archiv/" },
};

export default function MagazineArchivePage() {
  const years = magazinePostsByYear();
  const categories = categoriesWithPosts();
  const firstYear = years.at(-1)?.year;
  const covers = magazinePosts.filter((entry) => entry.featuredImage).slice(0, 3);
  return (
    <main className="mz-main">
      <MagazineArchiveHero
        kicker="Inhaltsverzeichnis"
        kickerIcon={<BookIcon />}
        title={<>Alle Artikel im <em>Magazin</em></>}
        crumb="Alle Artikel"
        intro={<p>Alle Beiträge auf einen Blick, die neuesten zuerst. Spring direkt zu einem Jahrgang oder stöbere nach Thema.</p>}
        stats={[
          { value: magazinePosts.length, label: "Artikel" },
          { value: years.length, label: "Jahrgänge" },
          { value: categories.length, label: "Themen" },
          ...(firstYear ? [{ value: firstYear, label: "Seit" }] : []),
        ]}
        visual={covers.length === 3 ? (
          <div className="mz-hero-stack" aria-hidden="true">
            {covers.map((entry) => <img src={entry.featuredImage ?? ""} alt={`Titelbild: ${entry.title}`} key={entry.id} decoding="async" />)}
          </div>
        ) : undefined}
      />
      <MagazineFilterChips active="alle" />

      <nav className="wrap mz-years" aria-label="Zu Jahrgang springen">
        <span>Jahrgang</span>
        {years.map(({ year, posts }) => <a href={`#jahr-${year}`} key={year}>{year}<small>{posts.length}</small></a>)}
      </nav>

      <div className="wrap mz-year-list">
        {years.map(({ year, posts }) => (
          <section className="mz-year" id={`jahr-${year}`} aria-labelledby={`jahr-${year}-titel`} key={year}>
            <header className="mz-year-head">
              <h2 id={`jahr-${year}-titel`}>{year}</h2>
              <p>{posts.length} Artikel</p>
            </header>
            <div className="mz-grid mz-grid-compact">
              {posts.map((entry) => <MagazineCard entry={entry} variant="compact" showExcerpt={false} key={entry.id} />)}
            </div>
          </section>
        ))}
      </div>

      <section className="wrap mz-section">
        <div className="mz-archive-cta">
          <div>
            <p className="kicker">Zurück zum Anfang</p>
            <h2>Neues, Szene-Guides und <em>Begriffe</em></h2>
            <p>Auf der Magazin-Startseite findest Du die neuesten Beiträge, Gay-Locations nach Städten und das Glossar.</p>
          </div>
          <Link className="button button-green" href="/magazin">Zur Magazin-Startseite</Link>
        </div>
      </section>
    </main>
  );
}
