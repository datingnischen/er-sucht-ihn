import type { CSSProperties } from "react";
import Link from "next/link";
import { publicPages } from "@/lib/content";
import { CENTRAL_POSTCODES, citySearchUrl, registrationUrl } from "@/lib/site";
import { getMagazineEntry } from "@/lib/magazine";
import { staticAsset } from "@/lib/static-asset.mjs";
import { getLocationName } from "@/lib/site-contract.mjs";
import { buildCityGuide, selectCityPhoto, TOPIC_LABELS } from "@/lib/city-guide.mjs";
import { COUNTRY_BY_ROOT, cityGeo, nearestCities } from "@/lib/city-geo.mjs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ArrowIcon, ClockIcon, HeartFilledIcon, HeartIcon, MarsPairIcon, PinIcon, SearchIcon } from "@/components/icons";
import type { ImportedView } from "@/components/imported-view";
import { CityTopicIcon } from "./city-topic-icon";
import { IconyMenWidget } from "./icony-men-widget";
import { DUSK_HEARTS, cityMagazineTeasers, emphasize } from "./city-shared";
import "./sc-city.css";

const DATE_IDEAS: { topics: string[]; key: string; title: string; text: string; cta: string }[] = [
  { key: "bar", topics: ["bar"], title: "Bar-Date mit Szene-Flair", text: "Ein Drink, gute Musik, offene Türen: In schwulen und queerfreundlichen Bars kommt man ganz nebenbei ins Gespräch.", cta: "Bars & Clubs ansehen" },
  { key: "food", topics: ["food"], title: "Café-Date ohne Druck", text: "Ein Kaffee, ein Tisch für zwei – das klassische erste Treffen: entspannt, kurz oder ganz lang.", cta: "Cafés & Genuss" },
  { key: "nature", topics: ["nature", "boat", "mountain"], title: "Spaziergang zu zweit", text: "Nebeneinander gehen statt gegenübersitzen: Ufer, Parks und Aussichtspunkte nehmen die Nervosität.", cta: "Orte im Grünen" },
  { key: "event", topics: ["event"], title: "Pride, Partys & Events", text: "Bei CSD, Festivals und queeren Events ist die Community sichtbar – neue Gesichter sind willkommen.", cta: "Termine & Events" },
  { key: "culture", topics: ["culture"], title: "Kultur-Date", text: "Ausstellung, Kino oder Theater liefern den Gesprächsstoff gleich mit – ideal zum ersten Beschnuppern.", cta: "Kultur-Tipps" },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function pagePhoto(path: string) {
  const page = publicPages.find((entry) => entry.path === path);
  return page ? selectCityPhoto(page.images) : null;
}

export function LocationCityPage({ page, path, contentHtml, breadcrumbs }: ImportedView) {
  const country = COUNTRY_BY_ROOT.partnersuche;
  const geo = cityGeo(path);
  const cityName = geo?.name ?? getLocationName(path);
  // Stadtstaaten (Berlin, Hamburg, Bremen): statt „Berlin, Berlin“ das Land nennen.
  const regionName = geo && geo.region !== cityName ? geo.region : country.name;
  const photo = selectCityPhoto(page.images);
  const guide = buildCityGuide({ contentHtml, path, heroSrc: photo?.src ?? null });
  const credit = guide.credits[0] ?? null;
  const signupUrl = registrationUrl(path);
  const searchUrl = citySearchUrl(path);
  const nearby = nearestCities(path, 5).map((entry) => ({ ...entry, photo: pagePhoto(entry.path) }));
  const maxKm = Math.max(...nearby.map((entry) => entry.km), 1);
  const within100 = nearestCities(path, 40).filter((entry) => entry.km <= 100).length;
  const chapters = guide.sections.filter((section) => !section.isPart);
  const ideas = DATE_IDEAS.map((idea) => ({ ...idea, section: chapters.find((section) => idea.topics.includes(section.topic)) }))
    .filter((idea) => idea.section)
    .slice(0, 4);
  const importedLinks = guide.related.links.filter((link) => !link.isHub);
  const relatedLinks = importedLinks.length
    ? importedLinks
    : nearby.slice(0, 4).map((entry) => ({ name: entry.name, href: entry.path, isHub: false }));
  const relatedHeading = guide.related.heading || "Diese Städte könnten auch interessant für dich sein:";
  const magazine = cityMagazineTeasers(path).map((entryPath) => getMagazineEntry(entryPath)).filter((entry) => entry != null);
  const totalCities = Object.keys(CENTRAL_POSTCODES).length;

  return (
    <main className="sc">
      <section className={`sc-hero ${photo ? "sc-hero-photo" : "sc-hero-plain"}`}>
        {photo ? <img className="sc-hero-img" src={photo.src} alt={photo.alt?.trim() || `Stadtansicht von ${cityName}`} fetchPriority="high" decoding="async" /> : <span className="sc-hero-pattern" aria-hidden="true" />}
        <span className="sc-hero-glow" aria-hidden="true" />
        <svg className="sc-hero-hearts" viewBox="0 0 1200 240" aria-hidden="true" preserveAspectRatio="none">
          {DUSK_HEARTS.map((heart, index) => (
            <use key={index} href="#sc-heart" x={heart.x} y={heart.y} width={heart.size} height={heart.size} style={{ animationDelay: `${index * 0.55}s` }} />
          ))}
          <defs>
            <symbol id="sc-heart" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-8.4-5-8.4-11.3A4.8 4.8 0 0 1 12 6.8a4.8 4.8 0 0 1 8.4 2.9C20.4 16 12 21 12 21Z" /></symbol>
          </defs>
        </svg>
        <div className="sc-wrap sc-hero-grid">
          <div className="sc-hero-copy">
            <Breadcrumbs items={breadcrumbs} className="sc-crumbs" />
            <span className="sc-badge"><MarsPairIcon />Gay-Guide · {regionName}</span>
            <h1>{emphasize(page.h1, cityName)}</h1>
            <p className="sc-lead">{page.description}</p>
            <div className="sc-actions">
              <a className="button button-green" href={signupUrl}><HeartFilledIcon />Männer in {cityName} kennenlernen</a>
              <a className="button button-ghost-light" href="#guide">Zum Stadt-Guide <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <div className="sc-card-stack">
          <span className="sc-card-back" aria-hidden="true" />
          <aside className="sc-card" aria-label={`Steckbrief ${cityName}`}>
            <span className="sc-card-seal" aria-hidden="true"><MarsPairIcon /></span>
            <span className="sc-card-kicker">Schwuler Steckbrief</span>
            <strong className="sc-card-city">{cityName}</strong>
            <span className="sc-card-region"><PinIcon />{regionName === country.name ? country.name : `${regionName}, ${country.name}`}</span>
            <dl className="sc-card-stats">
              <div><dt>Kapitel</dt><dd>{Math.max(guide.chapterCount, 1)}</dd></div>
              <div><dt>Min. Lesen</dt><dd>{guide.readingMinutes}</dd></div>
              {within100 ? <div><dt>Städte bis 100 km</dt><dd>{within100}</dd></div> : nearby[0] ? <div><dt>km zur Nachbarstadt</dt><dd>{nearby[0].km}</dd></div> : null}
            </dl>
            {guide.topics.length ? (
              <ul className="sc-card-topics" aria-label="Themen im Guide">
                {guide.topics.slice(0, 6).map((topic) => <li key={topic}><CityTopicIcon topic={topic} />{TOPIC_LABELS[topic as keyof typeof TOPIC_LABELS]}</li>)}
              </ul>
            ) : null}
          </aside>
          </div>
        </div>
        {photo && credit ? <a className="sc-credit" href={credit.url} target="_blank" rel="nofollow noopener noreferrer">Bild: {credit.label}</a> : null}
        <svg className="sc-hero-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 58c220 30 470 34 720 10s520-44 720-12v34H0Z" /></svg>
      </section>

      <div className="sc-wrap">
        <ul className="sc-facts">
          <li><PinIcon /><span><small>Suchort</small><strong>{cityName}, {regionName}</strong></span></li>
          {nearby[0] ? <li><MarsPairIcon /><span><small>Nächste Stadtseite</small><strong>{nearby[0].name} · {nearby[0].km} km</strong></span></li> : null}
          <li><ClockIcon /><span><small>Lesezeit Guide</small><strong>ca. {guide.readingMinutes} {guide.readingMinutes === 1 ? "Minute" : "Minuten"}</strong></span></li>
          <li><HeartIcon /><span><small>Anmeldung</small><strong>kostenlos</strong></span></li>
        </ul>
      </div>

      {page.widgetUrl ? (
        <div className="sc-wrap sc-section-tight">
          <IconyMenWidget city={cityName} widgetUrl={page.widgetUrl} searchUrl={searchUrl} />
        </div>
      ) : null}

      {ideas.length >= 2 ? (
        <section className="sc-wrap sc-section sc-ideas" aria-labelledby="sc-ideas-title">
          <div className="sc-head">
            <p className="kicker">Aus dem Stadt-Guide</p>
            <h2 id="sc-ideas-title">Date-Ideen in <em>{cityName}</em></h2>
            <p>Abgeleitet aus unseren Kapiteln: Orte, an denen Männer, die Männer lieben, ganz natürlich ins Gespräch kommen.</p>
          </div>
          <div className="sc-ideas-grid">
            {ideas.map((idea, index) => (
              <a key={idea.key} className={`sc-idea sc-t-${idea.section!.topic}`} href={`#${idea.section!.id}`} style={{ "--tilt": `${index % 2 ? 1.4 : -1.4}deg` } as CSSProperties}>
                <span className="sc-idea-icon"><CityTopicIcon topic={idea.section!.topic} /></span>
                <strong>{idea.title}</strong>
                <span>{idea.text}</span>
                <em>{idea.cta} <ArrowIcon /></em>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section id="guide" className={`sc-wrap sc-section sc-guide${guide.chapterCount > 1 ? "" : " sc-guide-single"}`} aria-label={`Stadt-Guide für ${cityName}`}>
        {guide.chapterCount > 1 ? (
          <aside className="sc-toc">
            <span className="sc-toc-kicker"><MarsPairIcon />Gay-Guide</span>
            <strong>{cityName} für Männer, die Männer lieben</strong>
            <ol>
              {chapters.map((section) => (
                <li key={section.id}><a href={`#${section.id}`}><CityTopicIcon topic={section.topic} /><span>{section.heading}</span><small>{pad(section.no)}</small></a></li>
              ))}
            </ol>
            <a className="button button-green sc-toc-cta" href={signupUrl}>Kostenlos anmelden</a>
          </aside>
        ) : null}
        <div className="sc-chapters">
          {guide.introHtml ? <article className="sc-chapter sc-intro"><div className="sc-rich" dangerouslySetInnerHTML={{ __html: guide.introHtml }} /></article> : null}
          {guide.sections.map((section) => {
            const Heading = section.level === 3 ? "h3" : "h2";
            if (section.isPart) {
              return <div key={section.id} id={section.id} className="sc-part"><span aria-hidden="true"><HeartFilledIcon /></span><Heading>{section.heading}</Heading></div>;
            }
            return (
              <article key={section.id} id={section.id} className={`sc-chapter sc-t-${section.topic}`}>
                <header>
                  <span className="sc-chapter-icon"><CityTopicIcon topic={section.topic} /></span>
                  <span className="sc-chapter-no" aria-hidden="true">{pad(section.no)}</span>
                  <span className="sc-chapter-kicker">{TOPIC_LABELS[section.topic as keyof typeof TOPIC_LABELS]}</span>
                  <Heading>{section.heading}</Heading>
                </header>
                {section.html ? <div className="sc-rich" dangerouslySetInnerHTML={{ __html: section.html }} /> : null}
              </article>
            );
          })}
        </div>
      </section>

      {nearby.length ? (
        <section className="sc-wrap sc-section sc-near" aria-labelledby="sc-near-title">
          <div className="sc-head">
            <p className="kicker">Luftlinie ab {cityName}</p>
            <h2 id="sc-near-title">Männer <em>in Reichweite</em></h2>
            <p>Die nächsten Stadtseiten mit eigenem Gay-Guide.</p>
          </div>
          <ol className="sc-near-list">
            {nearby.map((entry) => (
              <li key={entry.path}>
                <Link className="sc-near-row" href={entry.path}>
                  {entry.photo ? <img src={entry.photo.src} alt={`Stadtansicht von ${entry.name}`} loading="lazy" decoding="async" /> : <span className="sc-near-ph" aria-hidden="true"><MarsPairIcon /></span>}
                  <span className="sc-near-name"><small>Männer in {entry.region}</small><strong>{entry.name}</strong></span>
                  <span className="sc-near-bar" aria-hidden="true"><i style={{ width: `${Math.max(14, (entry.km / maxKm) * 100)}%` }} /></span>
                  <span className="sc-near-km">{entry.km} km</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {magazine.length ? (
        <section className="sc-wrap sc-section sc-mag" aria-labelledby="sc-mag-title">
          <div className="sc-head">
            <p className="kicker">Aus dem Magazin</p>
            <h2 id="sc-mag-title">Weiterlesen <em>vor dem Date</em></h2>
          </div>
          <div className={`sc-mag-grid${magazine.length === 1 ? " sc-mag-grid-single" : ""}`}>
            {magazine.map((entry, index) => (
              <Link key={entry.path} className="sc-mag-card" href={entry.path} style={{ "--tilt": `${index % 2 ? 1 : -1}deg` } as CSSProperties}>
                <span className="sc-mag-media">{entry.featuredImage ? <img src={entry.featuredImage} alt={`Titelbild: ${entry.title}`} loading="lazy" decoding="async" /> : <MarsPairIcon />}</span>
                <span className="sc-mag-body">
                  <small>Magazin</small>
                  <strong>{entry.title}</strong>
                  <span>{teaser(entry.description)}</span>
                  <em>Artikel lesen <ArrowIcon /></em>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="sc-wrap sc-section sc-related" aria-labelledby="sc-related-title">
        <h2 id="sc-related-title">{relatedHeading}</h2>
        <ul>
          {relatedLinks.map((link) => <li key={link.href}><Link href={link.href}><HeartIcon />{link.name}</Link></li>)}
          <li><Link className="sc-chip-all" href="/partnersuche">Alle Städte {country.inName} <ArrowIcon /></Link></li>
        </ul>
      </section>

      <section className="sc-wrap sc-section">
        <div className="sc-cta">
          <div className="sc-cta-copy">
            <p className="kicker">Umkreissuche</p>
            <h2>Bereit für Dein erstes Date <em>in {cityName}?</em></h2>
            <p>Lege Umkreis und Alter selbst fest und entdecke Männer aus Deiner Nähe – Registrierung und Profil sind kostenlos. {cityName} ist eine von {totalCities} Stadtseiten in Deutschland.</p>
            <div className="sc-actions">
              <a className="button button-green" href={signupUrl}><HeartFilledIcon />Kostenlos registrieren</a>
              <a className="button button-ghost-light" href={searchUrl}><SearchIcon />Männer in {cityName} suchen</a>
            </div>
          </div>
          <a className="sc-cta-radar" href={searchUrl}>
            <img src={staticAsset("/brand/umkreissuche-radar.svg")} alt={`Umkreissuche: Männer in der Nähe von ${cityName} finden`} width={320} height={480} loading="lazy" decoding="async" />
          </a>
        </div>
      </section>
    </main>
  );
}

function teaser(text: string) {
  return text.length > 150 ? `${text.slice(0, 147).replace(/\s+\S*$/, "")} …` : text;
}
