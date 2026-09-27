import { ABOUT_SEARCH_PATH } from "@/lib/about-pages.mjs";
import { withTrailingSlash } from "@/lib/site-contract.mjs";

// Schlichtes GET-Formular: funktioniert ohne JavaScript und landet immer auf /ueber-uns/suche/?q=…
export function SiteSearchForm({ query = "", autoFocus = false, label = "Seite durchsuchen" }: { query?: string; autoFocus?: boolean; label?: string }) {
  return <form className="site-search-form" action={withTrailingSlash(ABOUT_SEARCH_PATH)} method="get" role="search">
    <label className="faq-search-field">
      <span className="sr-only">{label}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="m20 20-3.6-3.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
      <input type="search" name="q" defaultValue={query} placeholder="z. B. Köln, Coming-out, Gaychat …" autoComplete="off" maxLength={100} autoFocus={autoFocus} />
    </label>
    <button className="button button-pink" type="submit">Suchen</button>
  </form>;
}
