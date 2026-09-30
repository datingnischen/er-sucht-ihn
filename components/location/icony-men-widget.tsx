import { MarsPairIcon, SearchIcon } from "@/components/icons";

type Props = {
  city: string;
  /** Validiertes ICONY-Frame (js.icony.com/frame, id=ersuchtihn) aus dem Import-Snapshot. */
  widgetUrl: string;
  searchUrl: string;
};

/** Profilvorschauen aktiver Männer aus der Region – das ICONY-Frame der Stadtseite im Dusk-Rahmen. */
export function IconyMenWidget({ city, widgetUrl, searchUrl }: Props) {
  const headingId = "single-maenner-widget";
  return (
    <section className="sc-widget" aria-labelledby={headingId}>
      <div className="sc-widget-head">
        <span className="sc-widget-badge" aria-hidden="true"><MarsPairIcon /></span>
        <div>
          <p className="kicker">Gerade aktiv · nur Männer</p>
          <h2 id={headingId}>Single-Männer aus {city} <em>und Umgebung</em></h2>
          <p>Sieh, welche Männer zuletzt bei Er-sucht-Ihn aktiv waren, und öffne ein Profil, das Dich neugierig macht.</p>
        </div>
      </div>
      <iframe className="sc-widget-frame" src={widgetUrl} title={`Single-Männer aus ${city} und Umgebung`} loading="lazy" referrerPolicy="no-referrer" />
      <div className="sc-widget-actions">
        <a className="button button-green" href={searchUrl}><SearchIcon />Ausführlicher in {city} suchen</a>
        <span>Kostenlos starten · Umkreis selbst festlegen · Männer, die Männer lieben</span>
      </div>
    </section>
  );
}
