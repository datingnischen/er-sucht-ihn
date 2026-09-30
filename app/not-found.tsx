import Link from "next/link";
import { ArrowIcon, HeartFilledIcon, HeartIcon, PinIcon, QuestionIcon, SparkIcon } from "@/components/icons";
import { SiteSearchForm } from "@/components/site-search-form";
import "@/components/about/about.css";
import "@/components/about/site-search.css";

const WAYS = [
  { href: "/partnersuche", icon: <PinIcon />, kicker: "Partnersuche", title: "Männer in Deiner Stadt", text: "Von Flensburg bis München: Städteseiten mit Gay-Guide und Tipps für Deine Umgebung." },
  { href: "/magazin", icon: <SparkIcon />, kicker: "Magazin", title: "Dating, Liebe & schwules Leben", text: "Ratgeber, Szene-Guides und Hintergründe für Männer, die Männer lieben." },
  { href: "/faq", icon: <QuestionIcon />, kicker: "FAQ", title: "Häufige Fragen", text: "Kosten, Sicherheit und Ablauf der Partnersuche – kurz und ehrlich beantwortet." },
];

/** Freundliche 404-Seite im Dusk-Look mit Seitensuche und Wegweisern. */
export default function NotFound() {
  return <main className="ab-page ss-page">
    <header className="ab-hero ss-nf-hero">
      <div className="wrap ab-hero-grid">
        <div className="ab-hero-copy">
          <p className="ab-badge"><HeartIcon /> Fehler 404</p>
          <h1>Diese Seite hat sich leider <em>verabschiedet</em></h1>
          <div className="ab-hero-lead"><p>Vielleicht ist der Link veraltet oder die Seite ist umgezogen. Kein Grund für Herzschmerz – mit der Suche oder den Wegweisern unten findest Du schnell zurück.</p></div>
          <div className="ss-box"><SiteSearchForm id="not-found-q" label="Seite suchen" /></div>
        </div>
        <div className="ss-nf-art" aria-hidden="true">
          <span>4</span>
          <span className="ss-nf-heart"><HeartFilledIcon /></span>
          <span>4</span>
        </div>
      </div>
    </header>

    <section className="wrap ab-section ab-section-first" aria-labelledby="nf-ways-title">
      <div className="ab-head">
        <p className="kicker">Wegweiser</p>
        <h2 id="nf-ways-title">Hier geht’s <em>weiter</em></h2>
      </div>
      <ul className="ss-nf-ways">
        {WAYS.map((way) => <li key={way.href}>
          <Link className="ss-nf-way" href={way.href}>
            <span className="ss-nf-way-icon" aria-hidden="true">{way.icon}</span>
            <small>{way.kicker}</small>
            <strong>{way.title}</strong>
            <span>{way.text}</span>
            <em>Entdecken <ArrowIcon /></em>
          </Link>
        </li>)}
      </ul>
      <p className="ss-nf-home"><Link className="text-link" href="/">Zur Startseite →</Link></p>
    </section>
  </main>;
}
