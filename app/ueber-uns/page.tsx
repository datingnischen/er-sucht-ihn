import type { Metadata } from "next";
import Link from "next/link";
import { ABOUT_REVIEWS_PATH, ABOUT_ROOT_PATH, ABOUT_SOCIAL_PATH } from "@/lib/about-pages.mjs";
import { buildBreadcrumbs, buildBreadcrumbSchema } from "@/lib/breadcrumbs.mjs";
import { serializePageEntityGraph } from "@/lib/page-entities.mjs";
import { platform, registrationUrl, SITE_URL } from "@/lib/site";

const canonical = `${SITE_URL}${ABOUT_ROOT_PATH}`;
const title = "Über uns: Wer hinter Er-sucht-Ihn.de steht";
const description = "Lerne die Plattform hinter Er-sucht-Ihn.de kennen: Betreiber, Redaktion, Bewertungen, Erfahrungen und unsere Social-Media-Kanäle.";

const ratings = [
  { source: "Trustpilot", score: "4", scale: "5", label: "Sterne", text: "Nutzer loben die unkomplizierte Anmeldung, den klaren Fokus auf Männerkontakte und das freundliche Umfeld.", href: "https://de.trustpilot.com/review/er-sucht-ihn.de" },
  { source: "DatingReport.com", score: "7,9", scale: "10", label: "Punkte", text: "Hervorgehoben werden einfache Anmeldung, klare Zielgruppe und modernes Design – für Beziehung wie Flirt.", href: "https://www.datingreport.com/review/er-sucht-ihn-de-im-test-was-kann-das-beliebte-dating-portal-fuer-schwule/" },
  { source: "Singlebörsen-Überblick.de", score: "4,5", scale: "5", label: "Sterne", text: "Empfohlen als eine der führenden Plattformen für schwule Singles – mit sicherer Anmeldung und viel Datenschutz.", href: "https://singleboersen-ueberblick.de/testbericht/er-sucht-ihn-de" },
] as const;

const socialChannels = [
  { name: "Facebook-Seite", handle: "facebook.com/ersuchtihn", text: "Neuigkeiten, Community-Beiträge und Themen rund um Dating, Liebe und Beziehungen zwischen Männern.", href: "https://www.facebook.com/ersuchtihn/", icon: "f", profile: true },
  { name: "Facebook-Gruppe", handle: "Community-Gruppe", text: "Tausche Dich mit anderen schwulen Männern aus, knüpfe Kontakte und teile Deine Erfahrungen.", href: "https://www.facebook.com/groups/130558014269848/", icon: "f", profile: false },
  { name: "YouTube", handle: "@Er-sucht-Ihn", text: "Videos, Erfahrungen und Tipps rund um schwules Dating, Partnerschaft und Beziehungen.", href: "https://www.youtube.com/@Er-sucht-Ihn", icon: "▶", profile: true },
] as const;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title, description, url: canonical },
};

function aboutEntityGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: "Er-sucht-Ihn.de", inLanguage: "de-DE" },
      { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Er-sucht-Ihn.de", url: `${SITE_URL}/`, logo: `${SITE_URL}/brand/logo.svg`, parentOrganization: { "@type": "Organization", name: "ICONY GmbH" }, sameAs: socialChannels.filter((channel) => channel.profile).map((channel) => channel.href) },
      { "@type": "AboutPage", "@id": `${canonical}#webpage`, url: canonical, name: "Über uns", description, inLanguage: "de-DE", isPartOf: { "@id": `${SITE_URL}/#website` }, about: { "@id": `${SITE_URL}/#organization` } },
    ],
  };
}

export default function AboutPage() {
  const breadcrumbs = buildBreadcrumbs(ABOUT_ROOT_PATH, "Über uns");
  return <main className="wrap page-shell about-page">
    <article className="article-card">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{breadcrumbs.map((item, index) => <li key={item.path}>{index < breadcrumbs.length - 1 ? <Link href={item.path}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}</li>)}</ol></nav>
      <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema(ABOUT_ROOT_PATH, "Über uns"))}</script>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializePageEntityGraph(aboutEntityGraph()) }} />

      <header className="about-hero">
        <p className="kicker">Hinter den Kulissen</p>
        <h1>Über Er-sucht-Ihn und die Menschen dahinter</h1>
        <p className="lead">Seit über 20 Jahren bringen wir Männer zusammen, die Männer lieben. Hier erfährst Du, wer hinter der Plattform steht, wie andere uns bewerten und wo Du uns auf Social Media findest.</p>
        <ul className="about-chips" aria-label="Themen auf dieser Seite">
          <li><a href="#wer-wir-sind">Wer wir sind</a></li>
          <li><a href="#bewertungen">Bewertungen &amp; Erfahrungen</a></li>
          <li><a href="#social-media">Social Media</a></li>
        </ul>
      </header>

      <section className="about-section" id="wer-wir-sind" aria-labelledby="wer-wir-sind-title">
        <div className="about-section-heading">
          <p className="kicker">Wer wir sind</p>
          <h2 id="wer-wir-sind-title">Eine Community von Männern für Männer</h2>
          <p>Er-sucht-Ihn.de ist eine deutschsprachige Singlebörse für schwule und bisexuelle Männer – für die feste Beziehung genauso wie für ehrliche Flirts auf Augenhöhe.</p>
        </div>
        <div className="about-card-grid about-card-grid-duo">
          <div className="about-card">
            <img className="about-card-image" src="/about/betrieb-support.webp" alt="Mann schaut lächelnd von seinem Smartphone auf" width="720" height="450" loading="lazy" />
            <p className="kicker">Betrieb &amp; Support</p>
            <h3>Verlässlich betreut von ICONY</h3>
            <p>Die ICONY GmbH betreibt Er-sucht-Ihn.de und kümmert sich um Support, Technik und Weiterentwicklung – mit Servern in Deutschland.</p>
            <a className="about-card-link" href={platform.legal}>Zum Impressum</a>
          </div>
          <div className="about-card">
            <img className="about-card-image" src="/about/magazin-redaktion.webp" alt="Zwei Männer unterhalten sich lachend bei einem Kaffee" width="720" height="450" loading="lazy" />
            <p className="kicker">Magazin &amp; Redaktion</p>
            <h3>Wissen rund um schwules Dating</h3>
            <p>Unsere Redaktion schreibt über Dating, Beziehungen und Community-Themen – verständlich und nah an dem, was schwule Singles bewegt.</p>
            <Link className="about-card-link" href="/magazin/author/redaktion">Zur Redaktion</Link>
          </div>
        </div>
      </section>

      <section className="about-section about-reviews" id="bewertungen" aria-labelledby="bewertungen-title">
        <div className="about-section-heading">
          <p className="kicker">Bewertungen &amp; Erfahrungen</p>
          <h2 id="bewertungen-title">Vertrauen entsteht durch echte Eindrücke</h2>
          <p>Unabhängige Portale und Nutzer bewerten Er-sucht-Ihn.de regelmäßig. Hier siehst Du die wichtigsten Einordnungen auf einen Blick.</p>
        </div>
        <div className="about-card-grid">
          {ratings.map((rating) => <a className="about-rating" href={rating.href} key={rating.source} rel="nofollow noopener noreferrer" target="_blank">
            <span className="about-rating-score"><strong>{rating.score}</strong> / {rating.scale} {rating.label}</span>
            <span className="about-rating-source">{rating.source}</span>
            <span className="about-rating-text">{rating.text}</span>
          </a>)}
        </div>
        <div className="about-section-actions">
          <Link className="button button-pink" href={ABOUT_REVIEWS_PATH}>Alle Bewertungen &amp; Erfahrungen</Link>
          <img src="/trust/empfohlen-45-sterne.png" alt="Empfohlen von Singlebörsen-Überblick.de – 4,5 Sterne" width="300" height="60" />
        </div>
      </section>

      <section className="about-section about-social" id="social-media" aria-labelledby="social-media-title">
        <div className="about-section-heading">
          <p className="kicker">Social Media</p>
          <h2 id="social-media-title">Folge uns auf unseren Kanälen</h2>
          <p>Dating-Tipps, Community-Themen, Einblicke hinter die Kulissen und Neuigkeiten rund um die Plattform – dort, wo Du ohnehin unterwegs bist.</p>
        </div>
        <div className="about-card-grid">
          {socialChannels.map((channel) => <a className="about-social-card" href={channel.href} key={channel.href} rel="nofollow noopener noreferrer" target="_blank">
            <span className="about-social-icon" aria-hidden="true">{channel.icon}</span>
            <span className="about-social-name"><strong>{channel.name}</strong><small>{channel.handle}</small></span>
            <span className="about-social-text">{channel.text}</span>
          </a>)}
        </div>
        <div className="about-section-actions">
          <Link className="button button-outline" href={ABOUT_SOCIAL_PATH}>Zur Social-Media-Übersicht</Link>
        </div>
      </section>

      <aside className="inline-cta"><h2>Du willst nicht nur lesen, sondern Männer kennenlernen?</h2><p>Erstelle kostenlos Dein Profil und entdecke Männer aus Deiner Region, die ähnliche Wünsche und Werte mitbringen.</p><a className="button button-green" href={registrationUrl(ABOUT_ROOT_PATH)}>Jetzt kostenlos starten</a></aside>
    </article>
  </main>;
}
