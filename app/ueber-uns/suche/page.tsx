import type { Metadata } from "next";
import Link from "next/link";
import { SiteSearchForm } from "@/components/site-search-form";
import { ABOUT_ROOT_PATH, ABOUT_SEARCH_PATH } from "@/lib/about-pages.mjs";
import { buildBreadcrumbs } from "@/lib/breadcrumbs.mjs";
import { publicUrl, withTrailingSlash } from "@/lib/site-contract.mjs";
import { cleanSearchQuery } from "@/lib/site-search.mjs";
import { searchSite } from "@/lib/site-search-index";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

const canonical = publicUrl(ABOUT_SEARCH_PATH);
const title = "Suche: Magazin, Städte und Ratgeber durchsuchen";
const description = "Durchsuche das Magazin, die Städteseiten und die Ratgeber von Er-sucht-Ihn.de.";

// Suchergebnisse sind keine eigenständigen Landingpages: noindex, follow und nicht in der Sitemap.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  robots: { index: false, follow: true },
};

const suggestions = ["Berlin", "Köln", "Coming-out", "Gaychat", "Gay-Locations"];

export default async function AboutSearchPage({ searchParams }: Props) {
  const query = cleanSearchQuery((await searchParams).q);
  const results = query ? searchSite(query) : [];
  const breadcrumbs = buildBreadcrumbs(ABOUT_SEARCH_PATH, "Suche");
  const searchHref = (term: string) => `${withTrailingSlash(ABOUT_SEARCH_PATH)}?q=${encodeURIComponent(term)}`;
  return <main className="wrap page-shell about-page site-search-page">
    <article className="article-card">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{breadcrumbs.map((item, index) => <li key={item.path}>{index < breadcrumbs.length - 1 ? <Link href={withTrailingSlash(item.path)}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}</li>)}</ol></nav>

      <header className="about-hero">
        <p className="kicker">Über uns · Suche</p>
        <h1>Was suchst Du?</h1>
        <p className="lead">Durchsuche unser Magazin, die Städteseiten und Ratgeber – nach Themen, Begriffen oder Deiner Stadt.</p>
        <SiteSearchForm query={query} autoFocus={!query} />
      </header>

      <section className="site-search-results" aria-live="polite" aria-labelledby="site-search-status">
        {!query ? <>
          <h2 id="site-search-status">Ein paar Ideen zum Start</h2>
          <p>Gib oben einen Begriff ein – zum Beispiel Deine Stadt oder ein Thema, das Dich gerade beschäftigt.</p>
          <ul className="about-chips" aria-label="Suchvorschläge">{suggestions.map((term) => <li key={term}><Link href={searchHref(term)}>{term}</Link></li>)}</ul>
        </> : results.length ? <>
          <h2 id="site-search-status">{results.length === 1 ? "1 Treffer" : `${results.length}${results.length >= 50 ? "+" : ""} Treffer`} für „{query}“</h2>
          <ol className="site-search-list">
            {results.map((result) => <li key={result.href}>
              <Link className="site-search-card" href={result.href}>
                <span className="kicker">{result.area}</span>
                <strong>{result.title}</strong>
                {result.excerpt ? <span className="site-search-excerpt">{result.excerpt}</span> : null}
                <span className="site-search-more">Weiterlesen <span aria-hidden="true">→</span></span>
              </Link>
            </li>)}
          </ol>
        </> : <>
          <h2 id="site-search-status">Leider nichts gefunden für „{query}“</h2>
          <p>Probier es mit einem anderen oder kürzeren Begriff – oder stöbere direkt im <Link href="/magazin/">Magazin</Link> und in der <Link href="/partnersuche/">Partnersuche nach Städten</Link>.</p>
          <ul className="about-chips" aria-label="Suchvorschläge">{suggestions.map((term) => <li key={term}><Link href={searchHref(term)}>{term}</Link></li>)}</ul>
        </>}
      </section>

      <div className="about-section-actions"><Link className="button button-outline" href={withTrailingSlash(ABOUT_ROOT_PATH)}>Zur Über-uns-Übersicht</Link></div>
    </article>
  </main>;
}
