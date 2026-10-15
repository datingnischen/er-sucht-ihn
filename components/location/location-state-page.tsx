import Link from "@/components/link";
import { publicPages } from "@/lib/content";
import { registrationUrl } from "@/lib/site";
import { buildCityCards } from "@/lib/location-hub.mjs";
import { selectCityPhoto } from "@/lib/city-guide.mjs";
import { COUNTRY_BY_ROOT, citiesOfRoot } from "@/lib/city-geo.mjs";
import { getCountryMap, placeLabels } from "@/lib/city-map.mjs";
import { citiesOfState, statePages } from "@/lib/state-pages.mjs";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CitySearchFallback } from "@/components/city-search-fallback";
import { ArrowIcon, HeartFilledIcon, MarsPairIcon, PinIcon } from "@/components/icons";
import { emphasize } from "./city-shared";
import "./sc-city.css";
import "./sc-hub.css";

const ROOT = "partnersuche";
type MapCity = ReturnType<typeof getCountryMap>["cities"][number];

type Props = { state: { slug: string; name: string; path: string }; breadcrumbs: Array<{ name: string; path: string }> };

/** Aufzählung „A, B und C“. */
function joinNames(names: string[]) {
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} und ${names.at(-1)}` : names[0] ?? "";
}

/** Title ≤ 60, Description 110–155 Zeichen; bei vielen Städten Anzahl statt Namensliste. */
export function stateMetadata(state: { slug: string; name: string }) {
  const cities = citiesOfState(state.slug);
  const listed = `Partnersuche für Männer in ${state.name}: Stadt-Guides für ${joinNames(cities.map((city) => city.name))} mit Profilvorschauen und Date-Ideen.`;
  const counted = `Partnersuche für Männer in ${state.name}: ${cities.length} Stadt-Guides mit Profilvorschauen, Treffpunkten und Date-Ideen vor Ort.`;
  return {
    title: `Er sucht Ihn in ${state.name}: Gay-Dating nach Städten`,
    description: listed.length <= 155 && listed.length >= 110 ? listed : counted,
  };
}

/**
 * Bundesland-Seite: ICONY hatte hier keine eigenen Inhalte, die Seite bündelt die Stadtseiten des Landes
 * (Karte, Stadtkarten, weitere Bundesländer). Texte nennen nur, was die Stadtseiten tatsächlich bieten.
 */
export function LocationStatePage({ state, breadcrumbs }: Props) {
  const country = COUNTRY_BY_ROOT[ROOT];
  const cities = citiesOfState(state.slug);
  const cityPaths = new Set(cities.map((city) => city.path));
  const teasers = new Map((buildCityCards(publicPages, ROOT) as { path: string; teaser: string }[]).map((card) => [card.path, card.teaser]));
  const cards = cities.map((city) => {
    const page = publicPages.find((entry) => entry.path === city.path);
    const photo = page ? selectCityPhoto(page.images) : null;
    return { ...city, teaser: teasers.get(city.path) ?? `Männer aus ${city.name} kennenlernen.`, photo };
  });
  const map = getCountryMap(ROOT);
  const ownPins: MapCity[] = placeLabels(map.cities.filter((city) => cityPaths.has(city.path)), map.width, map.height);
  const otherPins = map.cities.filter((city) => !cityPaths.has(city.path));
  const otherStates = statePages().filter((entry) => entry.slug !== state.slug);
  const cityStates = citiesOfRoot(ROOT).filter((city) => city.region === city.name);
  const signupUrl = registrationUrl(state.path);
  const names = joinNames(cities.map((city) => city.name));
  const countLabel = `${cities.length} ${cities.length === 1 ? "Stadt" : "Städte"}`;

  return (
    <main className="sc sh">
      <section className="sc-hero sh-hero">
        <span className="sc-hero-pattern" aria-hidden="true" />
        <span className="sc-hero-glow" aria-hidden="true" />
        <div className="sc-wrap sh-hero-grid">
          <div className="sc-hero-copy">
            <Breadcrumbs items={breadcrumbs} className="sc-crumbs" />
            <span className="sc-badge"><MarsPairIcon />Partnersuche für Männer · {country.regionLabel}</span>
            <h1>{emphasize(`Er sucht Ihn in ${state.name}`, state.name)}</h1>
            <p className="sc-lead">Männer aus {state.name} kennenlernen: Hier findest Du alle Stadt-Guides von Er-sucht-Ihn.de für {names}.</p>
            <ul className="sh-stats">
              <li><strong>{cities.length}</strong><span>{cities.length === 1 ? "Stadt" : "Städte"} mit Gay-Guide</span></li>
              <li><strong><PinIcon /></strong><span>{state.name}</span></li>
              <li><strong><HeartFilledIcon /></strong><span>kostenlos anmelden</span></li>
            </ul>
            <div className="sc-actions">
              <a className="button button-green" href={signupUrl}><HeartFilledIcon />Kostenlos anmelden</a>
              <a className="button button-ghost-light" href="#staedte">Städte in {state.name} <span aria-hidden="true">↓</span></a>
            </div>
          </div>

          <div className={`sh-map-stack sh-map-${country.code}`}>
            <span className="sh-map-back" aria-hidden="true" />
            <figure className="sh-map">
              <svg viewBox={`-70 -30 ${map.width + 140} ${map.height + 60}`} role="img" aria-label={`Karte: Stadtseiten von Er-sucht-Ihn.de in ${state.name}`}>
                <defs>
                  <pattern id={`sh-dots-${state.slug}`} width="22" height="22" patternUnits="userSpaceOnUse">
                    <circle cx="11" cy="11" r="1.8" className="sh-map-dot" />
                  </pattern>
                  <linearGradient id={`sh-pin-${state.slug}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#2ec4b6" />
                    <stop offset="1" stopColor="#4f63e6" />
                  </linearGradient>
                </defs>
                <path className="sh-map-land" d={map.path} />
                <path d={map.path} fill={`url(#sh-dots-${state.slug})`} />
                {otherPins.map((city) => (
                  <Link key={city.path} className="sh-pin sh-pin-muted" href={city.path}>
                    <title>{`Er sucht Ihn in ${city.name}`}</title>
                    <circle cx={city.x} cy={city.y} r="9" />
                  </Link>
                ))}
                {ownPins.map((city, index) => (
                  <Link key={city.path} className="sh-pin" href={city.path}>
                    <title>{`Er sucht Ihn in ${city.name}`}</title>
                    <circle className="sh-pin-pulse" cx={city.x} cy={city.y} r="18" style={{ animationDelay: `${(index % 7) * 0.45}s` }} />
                    <path className="sh-pin-heart" transform={`translate(${city.x - 19} ${city.y - 19}) scale(1.6)`} d="M12 21s-8.4-5-8.4-11.3A4.8 4.8 0 0 1 12 6.8a4.8 4.8 0 0 1 8.4 2.9C20.4 16 12 21 12 21Z" fill={`url(#sh-pin-${state.slug})`} />
                    {city.label ? <text x={city.label.x} y={city.label.y} textAnchor={city.label.anchor}>{city.name}</text> : null}
                  </Link>
                ))}
              </svg>
              <figcaption><HeartFilledIcon />Herzen: Stadt-Guides in {state.name}</figcaption>
            </figure>
          </div>
        </div>
        <svg className="sc-hero-wave" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 58c220 30 470 34 720 10s520-44 720-12v34H0Z" /></svg>
      </section>

      <section id="staedte" className="sc-wrap sh-cities" aria-labelledby="sh-cities-title">
        <div className="sh-panel">
          <div className="sc-head">
            <p className="kicker">{countLabel} in {state.name}</p>
            <h2 id="sh-cities-title">Wähle Deine Stadt in {state.name}</h2>
            <p>Jede Stadtseite verbindet Profilvorschauen von Männern aus der Region mit Bars, Events, Community-Treffs und Date-Ideen vor Ort.</p>
          </div>
          <ul className="sh-chips sh-state-cities">
            {cards.map((city) => (
              <li key={city.path}>
                <div className="sh-chip has-card-link" title={city.teaser}>
                  {city.photo ? <img src={city.photo.src} alt={`Stadtansicht von ${city.name}`} loading="lazy" decoding="async" /> : <span className="sh-chip-ph" aria-hidden="true"><MarsPairIcon /></span>}
                  <span className="sh-chip-copy"><strong><Link className="card-link" href={city.path}>{city.name}</Link></strong><small>{city.teaser}</small></span>
                  <ArrowIcon className="sh-chip-go" />
                </div>
              </li>
            ))}
          </ul>
          <CitySearchFallback headingId={`${state.slug}-city-search-fallback-title`} />
        </div>
      </section>

      <section className="sc-wrap sc-section" aria-labelledby="sh-states-title">
        <div className="sc-head">
          <p className="kicker">Weitere Regionen</p>
          <h2 id="sh-states-title">Weitere Bundesländer und Stadtstaaten</h2>
        </div>
        <ul className="sh-state-links">
          {otherStates.map((entry) => (
            <li key={entry.path}><Link href={entry.path}>{entry.name}</Link></li>
          ))}
          {cityStates.map((city) => (
            <li key={city.path}><Link href={city.path}>{city.name}</Link></li>
          ))}
          <li><Link href="/partnersuche">Alle Städte in {country.name}</Link></li>
        </ul>
      </section>
    </main>
  );
}
