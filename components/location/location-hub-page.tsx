import Link from "next/link";
import { publicPages } from "@/lib/content";
import { registrationUrl } from "@/lib/site";
import { getMagazineEntry } from "@/lib/magazine";
import { buildCityCards } from "@/lib/location-hub.mjs";
import { buildCityGuide, selectCityPhoto } from "@/lib/city-guide.mjs";
import { COUNTRY_BY_ROOT, citiesOfRoot } from "@/lib/city-geo.mjs";
import { getCountryMap } from "@/lib/city-map.mjs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CitySearchFallback } from "@/components/city-search-fallback";
import { ArrowIcon, HeartFilledIcon, MarsPairIcon } from "@/components/icons";
import type { ImportedView } from "@/components/imported-view";
import { CityFinder, type FinderRegion } from "./city-finder";
import { LOCATIONS_HUB_PATH, emphasize } from "./city-shared";
import "./sc-city.css";
import "./sc-hub.css";

const ROOT = "partnersuche";

function regions(): FinderRegion[] {
  const teasers = new Map((buildCityCards(publicPages, ROOT) as { path: string; teaser: string }[]).map((card) => [card.path, card.teaser]));
  const groups = new Map<string, FinderRegion["cities"]>();
  for (const city of citiesOfRoot(ROOT)) {
    const page = publicPages.find((entry) => entry.path === city.path);
    if (!page) continue;
    const photo = selectCityPhoto(page.images);
    const list = groups.get(city.region) ?? [];
    list.push({ path: city.path, name: city.name, teaser: teasers.get(city.path) ?? `Männer aus ${city.name} kennenlernen.`, photo: photo ? { src: photo.src, alt: photo.alt } : null });
    groups.set(city.region, list);
  }
  return [...groups]
    .map(([name, cities]) => ({ name, cities }))
    .sort((a, b) => b.cities.length - a.cities.length || a.name.localeCompare(b.name, "de"));
}

/** Erstes Bild aus dem Text lösen (wird als Bogenfenster neben der Einleitung gezeigt). */
function splitFirstImage(html: string) {
  const match = html.match(/<p>\s*(<img\b[^>]*>)\s*<\/p>|(<img\b[^>]*>)/i);
  if (!match) return { html, image: null };
  const tag = match[1] ?? match[2];
  const src = tag.match(/\bsrc="([^"]+)"/i)?.[1];
  const alt = tag.match(/\balt="([^"]*)"/i)?.[1] ?? "";
  return src ? { html: html.replace(match[0], "").trim(), image: { src, alt } } : { html, image: null };
}

export function LocationHubPage({ page, path, image, contentHtml, breadcrumbs }: ImportedView) {
  const country = COUNTRY_BY_ROOT[ROOT];
  const map = getCountryMap(ROOT);
  const regionList = regions();
  const cityCount = regionList.reduce((sum, region) => sum + region.cities.length, 0);
  const signupUrl = registrationUrl(path);
  const guide = buildCityGuide({ contentHtml, path });
  const intro = splitFirstImage(guide.introHtml);
  const heroImage = image && selectCityPhoto([image]) ? image : null;
  const storyImage = intro.image ?? heroImage;
  const locations = getMagazineEntry(LOCATIONS_HUB_PATH);

  return (
    <main className="sc sh">
      <section className="sc-hero sh-hero">
        <span className="sc-hero-pattern" aria-hidden="true" />
        <span className="sc-hero-glow" aria-hidden="true" />
        <div className="sc-wrap sh-hero-grid">
          <div className="sc-hero-copy">
            <Breadcrumbs items={breadcrumbs} className="sc-crumbs" />
            <span className="sc-badge"><MarsPairIcon />Partnersuche für Männer · {country.name}</span>
            <h1>{emphasize(page.h1, "deiner Stadt")}</h1>
            <p className="sc-lead">{page.description}</p>
            <ul className="sh-stats">
              <li><strong>{cityCount}</strong><span>Städte mit Gay-Guide</span></li>
              <li><strong>{regionList.length}</strong><span>{country.regionLabelPlural}</span></li>
              <li><strong><HeartFilledIcon /></strong><span>kostenlos anmelden</span></li>
            </ul>
            <div className="sc-actions">
              <a className="button button-green" href={signupUrl}><HeartFilledIcon />Kostenlos anmelden</a>
              <a className="button button-ghost-light" href="#staedte">Deine Stadt finden <span aria-hidden="true">↓</span></a>
            </div>
          </div>

          <div className={`sh-map-stack sh-map-${country.code}`}>
          <span className="sh-map-back" aria-hidden="true" />
          <figure className="sh-map">
            <svg viewBox={`-70 -30 ${map.width + 140} ${map.height + 60}`} role="img" aria-label={`Karte: Stadtseiten von Er-sucht-Ihn.de in ${country.name}`}>
              <defs>
                <pattern id={`sh-dots-${country.code}`} width="22" height="22" patternUnits="userSpaceOnUse">
                  <circle cx="11" cy="11" r="1.8" className="sh-map-dot" />
                </pattern>
                <linearGradient id={`sh-pin-${country.code}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#2ec4b6" />
                  <stop offset="1" stopColor="#4f63e6" />
                </linearGradient>
              </defs>
              <path className="sh-map-land" d={map.path} />
              <path d={map.path} fill={`url(#sh-dots-${country.code})`} />
              {map.cities.map((city, index) => (
                <Link key={city.path} className="sh-pin" href={city.path}>
                  <title>{`Er sucht Ihn in ${city.name}`}</title>
                  <circle className="sh-pin-pulse" cx={city.x} cy={city.y} r="18" style={{ animationDelay: `${(index % 7) * 0.45}s` }} />
                  <path className="sh-pin-heart" transform={`translate(${city.x - 19} ${city.y - 19}) scale(1.6)`} d="M12 21s-8.4-5-8.4-11.3A4.8 4.8 0 0 1 12 6.8a4.8 4.8 0 0 1 8.4 2.9C20.4 16 12 21 12 21Z" fill={`url(#sh-pin-${country.code})`} />
                  {city.label ? <text x={city.label.x} y={city.label.y} textAnchor={city.label.anchor}>{city.name}</text> : null}
                </Link>
              ))}
            </svg>
            <figcaption><HeartFilledIcon />Jedes Herz führt zu einem Stadt-Guide</figcaption>
          </figure>
          </div>
        </div>
        <svg className="sc-hero-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 58c220 30 470 34 720 10s520-44 720-12v34H0Z" /></svg>
      </section>

      <section id="staedte" className="sc-wrap sh-cities" aria-labelledby="sh-cities-title">
        <div className="sh-panel">
          <div className="sc-head">
            <p className="kicker">Städteübersicht {country.name}</p>
            <h2 id="sh-cities-title">Wähle Deine Stadt – <em>und Deinen Gay-Guide</em></h2>
            <p>Jede Stadtseite verbindet Profilvorschauen von Männern aus der Region mit Bars, Events, Community-Treffs und Date-Ideen vor Ort.</p>
          </div>
          <CityFinder regions={regionList} regionLabel={country.regionLabel} countryName={country.name} />
          <CitySearchFallback headingId={`${ROOT}-city-search-fallback-title`} />
        </div>
      </section>

      <section className="sc-wrap sc-section sh-story" aria-label={`Er sucht Ihn ${country.inName}`}>
        <article className={`sh-story-card${storyImage ? "" : " sh-story-card-text"}`}>
          <div className="sh-story-copy">
            <p className="kicker">Er sucht Ihn {country.inName}</p>
            {intro.html ? <div className="sc-rich sh-story-rich" dangerouslySetInnerHTML={{ __html: intro.html }} /> : null}
            <a className="button button-green" href={signupUrl}><HeartFilledIcon />Jetzt kostenlos anmelden</a>
          </div>
          {storyImage ? (
            <figure className="sh-arch">
              <span className="sh-arch-back" aria-hidden="true" />
              <img src={storyImage.src} alt={storyImage.alt || `Männer, die Männer lieben, in ${country.name}`} loading="lazy" decoding="async" />
            </figure>
          ) : null}
        </article>
        {guide.sections.length ? (
          <div className="sh-story-sections">
            {guide.sections.map((section, index) => (
              <article key={section.id} className="sh-story-section">
                <span className="sh-story-no" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <h2>{section.heading}</h2>
                {section.html ? <div className="sc-rich" dangerouslySetInnerHTML={{ __html: section.html }} /> : null}
              </article>
            ))}
          </div>
        ) : null}
        {guide.credits.length ? (
          <p className="sh-credits">
            Bildquellen:{" "}
            {guide.credits.map((credit, index) => (
              <span key={credit.url}>{index ? ", " : ""}<a href={credit.url} target="_blank" rel="nofollow noopener noreferrer">{credit.label} {index + 1}</a></span>
            ))}
          </p>
        ) : null}
      </section>

      {locations ? (
        <section className="sc-wrap sc-section" aria-labelledby="sh-mag-title">
          <Link className="sh-topten" href={locations.path}>
            <span className="sh-topten-media">{locations.featuredImage ? <img src={locations.featuredImage} alt={`Titelbild: ${locations.title}`} loading="lazy" decoding="async" /> : <MarsPairIcon />}</span>
            <span className="sh-topten-copy">
              <small className="kicker">Aus dem Magazin</small>
              <strong id="sh-mag-title">{locations.title}</strong>
              <span>{locations.description.length > 180 ? `${locations.description.slice(0, 177).replace(/\s+\S*$/, "")} …` : locations.description}</span>
              <em>Szene-Guide lesen <ArrowIcon /></em>
            </span>
          </Link>
        </section>
      ) : null}
    </main>
  );
}
