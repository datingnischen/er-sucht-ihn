import { ABOUT_SEARCH_PATH } from "@/lib/about-pages.mjs";
import { withTrailingSlash } from "@/lib/site-contract.mjs";
import { SearchIcon } from "@/components/icons";
import "@/components/about/site-search.css";

type Props = { query?: string; id?: string; label?: string; autoFocus?: boolean };

/** GET-Formular auf die Seitensuche unter "Über uns" (nie auf /suche, das gehört ICONY); funktioniert ohne JavaScript. */
export function SiteSearchForm({ query = "", id = "site-search-q", label = "Magazin, Städte und Ratgeber durchsuchen", autoFocus = false }: Props) {
  return <form className="site-search-form ss-form" action={withTrailingSlash(ABOUT_SEARCH_PATH)} method="get" role="search">
    <label className="site-search-label ss-label" htmlFor={id}>{label}</label>
    <div className="site-search-row ss-row">
      <span className="ss-row-icon" aria-hidden="true"><SearchIcon /></span>
      <input id={id} className="site-search-input ss-input" type="search" name="q" defaultValue={query} placeholder="z. B. Köln, Coming-out, Gaychat" maxLength={100} autoComplete="off" autoFocus={autoFocus} />
      <button className="button button-pink ss-submit" type="submit">Suchen</button>
    </div>
  </form>;
}
