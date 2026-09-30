import Link from "next/link";
import type { ReactNode } from "react";
import { MagazineBreadcrumbs } from "@/components/magazine-breadcrumbs";
import { SparkIcon } from "@/components/icons";
import { MagazineCategoryIcon } from "@/components/magazine/category-icon";
import { categoriesWithPosts } from "@/components/magazine/content";
import { MagazineCard } from "@/components/magazine/magazine-card";
import { magazinePosts, type MagazineEntry } from "@/lib/magazine";

type Stat = { value: string | number; label: string };

type HeroProps = {
  kicker: string;
  kickerIcon?: ReactNode;
  title: ReactNode;
  crumb: string;
  intro?: ReactNode;
  stats?: Stat[];
  visual?: ReactNode;
  children?: ReactNode;
};

/** Gemeinsamer Pflaume-Hero für Archiv, Kategorien und Autoren. */
export function MagazineArchiveHero({ kicker, kickerIcon, title, crumb, intro, stats = [], visual, children }: HeroProps) {
  return (
    <section className="mz-hero mz-archive-hero">
      <span className="mz-hero-glow" aria-hidden="true" />
      <div className={`wrap mz-archive-hero-grid${visual ? "" : " mz-archive-hero-solo"}`}>
        <div className="mz-hero-copy">
          <MagazineBreadcrumbs current={crumb} />
          <span className="mz-badge"><span className="mz-badge-icon" aria-hidden="true">{kickerIcon ?? <SparkIcon />}</span>{kicker}</span>
          <h1>{title}</h1>
          {intro ? <div className="mz-hero-lead">{intro}</div> : null}
          {stats.length > 0 && (
            <dl className="mz-stats">
              {stats.map((stat) => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
            </dl>
          )}
          {children}
        </div>
        {visual}
      </div>
    </section>
  );
}

/** Filterchips: alle Beiträge plus jede Kategorie mit ihrer Beitragszahl; das aktive Thema ist hervorgehoben. */
export function MagazineFilterChips({ active }: { active?: string }) {
  return (
    <nav className="wrap mz-filter" aria-label="Magazin nach Thema filtern">
      <Link className="mz-filter-chip mz-filter-all" href="/magazin/archiv" aria-current={active === "alle" ? "page" : undefined}>
        <SparkIcon />Alle<small>{magazinePosts.length}</small>
      </Link>
      {categoriesWithPosts().map((category) => (
        <Link className="mz-filter-chip" href={`/magazin/kategorie/${category.slug}`} key={category.id} aria-current={active === category.slug ? "page" : undefined}>
          <MagazineCategoryIcon slug={category.slug} />{category.name}<small>{category.total}</small>
        </Link>
      ))}
    </nav>
  );
}

export function MagazineCardGrid({ entries }: { entries: MagazineEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="mz-empty">
        <h2>Hier gibt es derzeit keine Beiträge.</h2>
        <p>Im Magazin findest Du weitere Themen rund um Dating, Beziehungen und schwules Leben.</p>
        <Link className="button button-pink" href="/magazin">Zum Magazin</Link>
      </div>
    );
  }
  return <div className="mz-grid">{entries.map((entry) => <MagazineCard entry={entry} heading="h2" key={entry.id} />)}</div>;
}

type ArchiveProps = Omit<HeroProps, "children"> & {
  entries: MagazineEntry[];
  active?: string;
  aside?: ReactNode;
  heroExtra?: ReactNode;
  listTitle?: ReactNode;
};

/** Listenseite (Kategorie, Autor): Hero, Filterchips, Karten-Grid, optional Seitenleiste. */
export function MagazineArchive({ entries, active, aside, heroExtra, listTitle, ...hero }: ArchiveProps) {
  const grid = <MagazineCardGrid entries={entries} />;
  return (
    <main className="mz-main">
      <MagazineArchiveHero {...hero}>{heroExtra}</MagazineArchiveHero>
      <MagazineFilterChips active={active} />
      <section className="wrap mz-section mz-archive-list" aria-label="Beiträge">
        {listTitle}
        {aside ? <div className="mz-archive-layout">{grid}{aside}</div> : grid}
      </section>
    </main>
  );
}
