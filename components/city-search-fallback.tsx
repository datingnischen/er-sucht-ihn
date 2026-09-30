import { INDIVIDUAL_SEARCH_URL } from "@/lib/site";

export function CitySearchFallback({ headingId = "city-search-fallback-title" }: { headingId?: string }) {
  return (
    <aside className="city-search-fallback" aria-labelledby={headingId}>
      <div className="city-search-fallback-copy">
        <p className="kicker">Individuelle Suche</p>
        <h2 id={headingId}>Deine Stadt fehlt? Such dort, wo Du lebst.</h2>
        <p>
          Nicht jede Stadt hat eine eigene Seite – Männer, die Männer suchen, gibt es trotzdem auch in Deiner Region.
          In der individuellen Suche legst Du Ort, Umkreis und Alter selbst fest und siehst, wer in Deiner Nähe unterwegs ist.
        </p>
      </div>
      <a className="button button-pink" href={INDIVIDUAL_SEARCH_URL}>Zur individuellen Suche</a>
    </aside>
  );
}
