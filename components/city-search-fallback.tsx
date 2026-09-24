import { INDIVIDUAL_SEARCH_URL } from "@/lib/site";
import "./city-search-fallback.css";

export function CitySearchFallback() {
  return (
    <aside className="city-search-fallback" aria-labelledby="city-search-fallback-title">
      <div className="city-search-fallback-text">
        <p className="kicker">Individuelle Suche</p>
        <h2 id="city-search-fallback-title">Deine Stadt fehlt? Such dort, wo Du lebst.</h2>
        <p>Nicht jede Stadt hat eine eigene Seite – Männer, die Männer suchen, gibt es trotzdem auch in Deiner Region. In der individuellen Suche legst Du Ort, Umkreis und Alter selbst fest und siehst, wer in Deiner Nähe unterwegs ist.</p>
      </div>
      <a className="button button-pink" href={INDIVIDUAL_SEARCH_URL}>Zur individuellen Suche</a>
    </aside>
  );
}
