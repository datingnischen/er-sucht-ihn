import type { ImportedPage } from "@/lib/content";
import Link from "next/link";
import { buildCityCards, getHubPresentation } from "@/lib/location-hub.mjs";
import { CitySearchFallback } from "@/components/city-search-fallback";

type CityCard = {
  path: string;
  name: string;
  teaser: string;
  image: { src: string; alt: string } | null;
  registrationUrl: string;
};

export function CityCardSection({ pages, root }: { pages: ImportedPage[]; root: "partnersuche" }) {
  const cities = buildCityCards(pages, root) as CityCard[];
  const presentation = getHubPresentation();
  const headingId = `${root}-city-explorer-title`;

  return (
    <section className={`city-explorer city-explorer-${root}`} aria-labelledby={headingId}>
      <div className="city-explorer-heading">
        <div>
          <p className="kicker">{presentation.kicker}</p>
          <h2 id={headingId}>{presentation.heading}</h2>
        </div>
        <p>{presentation.intro}</p>
      </div>
      <div className="city-card-grid">
        {cities.map((city, index) => (
          <article className={`city-tile city-tile-tone-${index % 6}${index < 6 ? " city-tile-featured" : ""}${city.image ? "" : " city-tile-no-image"}`} key={city.path}>
            <Link href={city.path} aria-label={`Partnersuche in ${city.name} entdecken`}>
              {city.image ? <img src={city.image.src} alt={city.image.alt || `Stadtansicht von ${city.name}`} loading={index < 6 ? "eager" : "lazy"} /> : null}
              <span className="city-tile-shade" aria-hidden="true" />
              <span className="city-tile-content">
                <span className="city-tile-meta"><span className="city-pin" aria-hidden="true">⌖</span> Partnersuche vor Ort</span>
                <strong>{city.name}</strong>
                <span className="city-tile-teaser">{city.teaser}</span>
                <span className="city-tile-action">Stadt entdecken <span aria-hidden="true">→</span></span>
              </span>
            </Link>
          </article>
        ))}
      </div>
      <CitySearchFallback />
      <div className="city-explorer-cta">
        <div><strong>{presentation.ctaTitle}</strong><span>Starte kostenlos und finde Männer aus Deiner Nähe.</span></div>
        <a className="button button-green" href={cities[0]?.registrationUrl}>{presentation.ctaLabel}</a>
      </div>
    </section>
  );
}
