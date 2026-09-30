import type { Metadata } from "next";
import Link from "next/link";
import { ABOUT_REVIEWS_PATH, ABOUT_ROOT_PATH, ABOUT_SOCIAL_PATH } from "@/lib/about-pages.mjs";
import { buildBreadcrumbs, buildBreadcrumbSchema } from "@/lib/breadcrumbs.mjs";
import { getFamilyPages } from "@/lib/content";
import { getMagazineAuthor, magazinePosts } from "@/lib/magazine";
import { categoriesWithPosts, stripHtml } from "@/components/magazine/content";
import { serializePageEntityGraph } from "@/lib/page-entities.mjs";
import { platform, registrationUrl, SITE_URL } from "@/lib/site";
import { getLocationName, publicUrl } from "@/lib/site-contract.mjs";
import { socialChannels, socialProfileUrls } from "@/lib/social-channels";
import { staticAsset } from "@/lib/static-asset.mjs";
import { AboutHero, RatingStars } from "@/components/about/about-hero";
import { ArrowIcon, BookIcon, HeartFilledIcon, HeartIcon, KeyIcon, MarsPairIcon, PinIcon, ShieldIcon, SparkIcon, StarIcon } from "@/components/icons";
import { SiteSearchForm } from "@/components/site-search-form";
import { SocialIcon } from "@/components/social-icon";

const canonical = publicUrl(ABOUT_ROOT_PATH);
const title = "Über uns: Wer hinter Er-sucht-Ihn.de steht";
const description = "Lerne die Plattform hinter Er-sucht-Ihn.de kennen: Betrieb, Redaktion, Bewertungen, Erfahrungen und unsere Social-Media-Kanäle.";

// Scores and wording come from the imported ICONY page /bewertungen-und-erfahrungen and the footer seal.
const ratings = [
  { source: "Trustpilot", score: "4", value: 4, scale: "5", label: "Sterne", text: "Nutzer loben die unkomplizierte Anmeldung, den klaren Fokus auf Männerkontakte und das freundliche Umfeld.", href: "https://de.trustpilot.com/review/er-sucht-ihn.de" },
  { source: "DatingReport.com", score: "7,9", value: null, scale: "10", label: "Punkte", text: "Hervorgehoben werden einfache Anmeldung, klare Zielgruppe und modernes Design – für Beziehung wie Flirt.", href: "https://www.datingreport.com/review/er-sucht-ihn-de-im-test-was-kann-das-beliebte-dating-portal-fuer-schwule/" },
  { source: "Singlebörsen-Überblick.de", score: "4,5", value: 4.5, scale: "5", label: "Sterne", text: "Empfohlen als eine der führenden Plattformen für schwule Singles – mit sicherer Anmeldung und viel Datenschutz.", href: "https://singleboersen-ueberblick.de/testbericht/er-sucht-ihn-de" },
] as const;

// Werte aus den Aussagen dieser Seite (Betrieb & Support, Wer wir sind) – keine neuen Versprechen.
const values = [
  { icon: <HeartIcon />, title: "Liebe, Freundschaft, Flirt", text: "Für die feste Beziehung genauso wie für neue Freundschaften und ehrliche Flirts auf Augenhöhe." },
  { icon: <ShieldIcon />, title: "Geprüfte Profile", text: "Unser Supportteam prüft zu Deiner Sicherheit jedes Profil." },
  { icon: <KeyIcon />, title: "Server in Deutschland", text: "Er-sucht-Ihn.de läuft auf Servern in Deutschland." },
  { icon: <SparkIcon />, title: "Über 20 Jahre Erfahrung", text: "Hinter Er-sucht-Ihn.de steckt über 20 Jahre Dating-Erfahrung." },
];

const FEATURED_CITIES = ["/partnersuche/berlin", "/partnersuche/hamburg", "/partnersuche/bayern/muenchen", "/partnersuche/nordrhein-westfalen/köln", "/partnersuche/hessen/frankfurt", "/partnersuche/sachsen/leipzig", "/partnersuche/baden-wuerttemberg/stuttgart", "/partnersuche/nordrhein-westfalen/duesseldorf"];

const profileChannels = socialChannels.filter((channel) => channel.profile);

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title, description, url: canonical, images: [staticAsset("/about/magazin-redaktion.webp")] },
};

function aboutEntityGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: "Er-sucht-Ihn.de", inLanguage: "de-DE" },
      { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Er-sucht-Ihn.de", url: `${SITE_URL}/`, logo: staticAsset("/brand/logo.svg"), parentOrganization: { "@type": "Organization", name: "ICONY GmbH" }, sameAs: socialProfileUrls },
      { "@type": "AboutPage", "@id": `${canonical}#webpage`, url: canonical, name: "Über uns", description, inLanguage: "de-DE", isPartOf: { "@id": `${SITE_URL}/#website` }, about: { "@id": `${SITE_URL}/#organization` } },
    ],
  };
}

function shorten(text: string, max = 230) {
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, "")} …` : text;
}

export default function AboutPage() {
  const breadcrumbs = buildBreadcrumbs(ABOUT_ROOT_PATH, "Über uns");
  const cities = getFamilyPages("partnersuche");
  const cityPaths = new Set(cities.map((city) => city.path));
  const featuredCities = FEATURED_CITIES.filter((path) => cityPaths.has(path));
  const author = getMagazineAuthor("redaktion");
  const authorText = author?.description ? shorten(stripHtml(author.description)) : "";

  return <main className="ab-page">
    <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema(ABOUT_ROOT_PATH, "Über uns"))}</script>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializePageEntityGraph(aboutEntityGraph()) }} />

    <AboutHero
      breadcrumbs={breadcrumbs}
      badge="Hinter den Kulissen"
      badgeIcon={<MarsPairIcon />}
      title={<>Über Er-sucht-Ihn und die <em>Menschen</em> dahinter</>}
      lead={<p>Seit über 20 Jahren bringen wir Männer zusammen, die Männer lieben. Hier erfährst Du, wer hinter der Plattform steht, wie andere uns bewerten und wo Du uns auf Social Media findest.</p>}
      media={<figure className="ab-collage">
        <span className="ab-arch"><img src={staticAsset("/about/betrieb-support.webp")} alt="Mann schaut lächelnd von seinem Smartphone auf" width="720" height="900" fetchPriority="high" /></span>
        <span className="ab-float-heart" aria-hidden="true"><HeartFilledIcon /></span>
        <span className="ab-float-card"><SparkIcon /><span><small>Seit über</small><strong>20 Jahren Dating-Erfahrung</strong></span></span>
      </figure>}
    >
      <ul className="ab-hero-chips" aria-label="Themen auf dieser Seite">
        <li><a href="#wer-wir-sind">Wer wir sind</a></li>
        <li><a href="#community">Community</a></li>
        <li><a href="#magazin">Magazin</a></li>
        <li><a href="#bewertungen">Bewertungen &amp; Erfahrungen</a></li>
        <li><a href="#social-media">Social Media</a></li>
      </ul>
    </AboutHero>

    <div className="wrap ab-search-float">
      <SiteSearchForm id="about-search-q" />
    </div>

    <section className="wrap ab-section" id="wer-wir-sind" aria-labelledby="wer-wir-sind-title">
      <div className="ab-head">
        <p className="kicker">Wer wir sind</p>
        <h2 id="wer-wir-sind-title">Eine Community von Männern <em>für Männer</em></h2>
        <p>Er-sucht-Ihn.de ist eine deutschsprachige Singlebörse für schwule und bisexuelle Männer – für die feste Beziehung genauso wie für ehrliche Flirts auf Augenhöhe.</p>
      </div>
      <ul className="ab-values">
        {values.map((value) => <li className="ab-value" key={value.title}>
          <span className="ab-value-icon" aria-hidden="true">{value.icon}</span>
          <strong>{value.title}</strong>
          <span>{value.text}</span>
        </li>)}
      </ul>
      <div className="ab-operator">
        <span className="ab-operator-icon" aria-hidden="true"><KeyIcon /></span>
        <div>
          <p className="kicker">Betrieb &amp; Support</p>
          <h3>Verlässlich betreut von ICONY</h3>
          <p>Die ICONY GmbH betreibt Er-sucht-Ihn.de und kümmert sich um Support, Technik und Weiterentwicklung – mit Servern in Deutschland.</p>
        </div>
        <a className="ab-link" href={platform.legal}>Zum Impressum <ArrowIcon /></a>
      </div>
    </section>

    <section className="ab-community" id="community" aria-labelledby="community-title">
      <div className="wrap ab-community-inner">
        <div>
          <p className="kicker">Community</p>
          <h2 id="community-title">Zuhause in <em>{cities.length} Städten</em></h2>
          <p>Ob Berlin, Köln oder München: Auf den Städteseiten findest Du Männer, die Männer lieben, in ganz Deutschland – mit Tipps für Deine Region.</p>
          <Link className="button button-green" href="/partnersuche">Alle Städte entdecken</Link>
        </div>
        <ul className="ab-city-chips" aria-label="Beliebte Städte">
          {featuredCities.map((path, index) => <li key={path} style={{ ["--i" as string]: index }}><Link href={path}><PinIcon />{getLocationName(path)}</Link></li>)}
        </ul>
      </div>
    </section>

    <section className="wrap ab-section" id="magazin" aria-labelledby="magazin-title">
      <div className="ab-feature ab-feature-reverse">
        <figure className="ab-feature-media ab-feature-media-tilt"><img src={staticAsset("/about/magazin-redaktion.webp")} alt="Zwei Männer unterhalten sich lachend bei einem Kaffee" width="720" height="450" loading="lazy" /></figure>
        <div>
          <p className="kicker">Magazin &amp; Redaktion</p>
          <h2 id="magazin-title">Wissen rund um <em>schwules Dating</em></h2>
          <p>Unsere Redaktion schreibt über Dating, Beziehungen und Community-Themen – verständlich und nah an dem, was schwule Singles bewegt.</p>
          <ul className="ab-stats" aria-label="Das Magazin in Zahlen">
            <li><strong>{magazinePosts.length}</strong> Artikel</li>
            <li><strong>{categoriesWithPosts().length}</strong> Rubriken</li>
          </ul>
          {author ? <Link className="ab-author" href={`/magazin/author/${author.slug}`}>
            <span className="ab-author-icon" aria-hidden="true"><BookIcon /></span>
            <span><small>Aus der Redaktion</small><strong>{author.name}</strong><span>{authorText || "Alle Beiträge unserer Redaktion über Gay-Dating, Beziehungen und Coming-out."}</span></span>
          </Link> : null}
          <Link className="ab-link" href="/magazin">Zum Magazin <ArrowIcon /></Link>
        </div>
      </div>
    </section>

    <section className="wrap ab-section" id="bewertungen" aria-labelledby="bewertungen-title">
      <div className="ab-reviews-panel">
        <div className="ab-head ab-head-light">
          <p className="kicker">Bewertungen &amp; Erfahrungen</p>
          <h2 id="bewertungen-title">Vertrauen entsteht durch <em>echte Eindrücke</em></h2>
          <p>Unabhängige Portale und Nutzer bewerten Er-sucht-Ihn.de regelmäßig. Hier siehst Du die wichtigsten Einordnungen auf einen Blick.</p>
        </div>
        <ul className="ab-ratings">
          {ratings.map((rating) => <li key={rating.source}>
            <a className="ab-rating" href={rating.href} rel="nofollow noopener noreferrer" target="_blank">
              <span className="ab-rating-top"><strong>{rating.score}</strong><span>/ {rating.scale} {rating.label}</span></span>
              {rating.value ? <RatingStars rating={rating.value} size={18} /> : <span className="ab-rating-word"><StarIcon /> Testbericht</span>}
              <span className="ab-rating-source">{rating.source}</span>
              <span className="ab-rating-text">{rating.text}</span>
            </a>
          </li>)}
        </ul>
        <div className="ab-actions">
          <Link className="button button-green" href={ABOUT_REVIEWS_PATH}>Alle Bewertungen &amp; Erfahrungen</Link>
          <img className="ab-seal" src={staticAsset("/trust/empfohlen-45-sterne.png")} alt="Empfohlen von Singlebörsen-Überblick.de – 4,5 Sterne" width="300" height="60" loading="lazy" />
        </div>
      </div>
    </section>

    <section className="wrap ab-section" id="social-media" aria-labelledby="social-media-title">
      <div className="ab-head">
        <p className="kicker">Social Media</p>
        <h2 id="social-media-title">Folge uns auf <em>unseren Kanälen</em></h2>
        <p>Dating-Tipps, Community-Themen, Einblicke hinter die Kulissen und Neuigkeiten rund um die Plattform – dort, wo Du ohnehin unterwegs bist.</p>
      </div>
      <ul className="ab-social-grid">
        {profileChannels.map((channel) => <li key={channel.href}>
          <a className={`ab-social-card ab-social-${channel.platform}`} href={channel.href} rel="nofollow noopener noreferrer" target="_blank">
            <span className="ab-social-icon" aria-hidden="true"><SocialIcon platform={channel.platform} size={24} /></span>
            <strong>{channel.name}</strong>
            <small>{channel.handle}</small>
            <span>{channel.text}</span>
            <em>{channel.cta} <ArrowIcon /></em>
          </a>
        </li>)}
      </ul>
      <div className="ab-actions ab-actions-center">
        <Link className="button button-outline" href={ABOUT_SOCIAL_PATH}>Zur Social-Media-Übersicht</Link>
      </div>
    </section>

    <section className="wrap ab-section" aria-labelledby="about-cta-title">
      <div className="ab-cta">
        <span className="ab-cta-heart" aria-hidden="true"><HeartFilledIcon /></span>
        <h2 id="about-cta-title">Du willst nicht nur lesen, sondern <em>Männer kennenlernen?</em></h2>
        <p>Erstelle kostenlos Dein Profil und entdecke Männer aus Deiner Region, die ähnliche Wünsche und Werte mitbringen.</p>
        <a className="button button-green" href={registrationUrl(ABOUT_ROOT_PATH)}>Jetzt kostenlos starten</a>
      </div>
    </section>
  </main>;
}
