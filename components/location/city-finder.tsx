"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowIcon, PinIcon, SearchIcon, MarsPairIcon } from "@/components/icons";

export type FinderCity = { path: string; name: string; teaser: string; photo: { src: string; alt: string } | null };
export type FinderRegion = { name: string; cities: FinderCity[] };

type Props = { regions: FinderRegion[]; regionLabel: string; countryName: string };

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss");
}

/**
 * Städtesuche der Übersicht: filtert Regionskarten und Stadt-Chips im Browser.
 * Ohne JavaScript wird die vollständige Liste serverseitig ausgeliefert, alle Links bleiben sichtbar.
 */
export function CityFinder({ regions, regionLabel, countryName }: Props) {
  const [query, setQuery] = useState("");
  const total = regions.reduce((sum, region) => sum + region.cities.length, 0);
  const visible = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return regions;
    return regions
      .map((region) => (normalize(region.name).includes(q) ? region : { ...region, cities: region.cities.filter((city) => normalize(city.name).includes(q)) }))
      .filter((region) => region.cities.length);
  }, [regions, query]);
  const count = visible.reduce((sum, region) => sum + region.cities.length, 0);

  return (
    <div className="sh-finder">
      <label className="sh-search">
        <SearchIcon />
        <span className="sh-sr">Stadt oder {regionLabel} suchen</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Stadt oder ${regionLabel} in ${countryName} suchen …`} autoComplete="off" />
      </label>
      <p className="sh-count" aria-live="polite">{query.trim() ? `${count} von ${total} Städten` : `${total} Städte in ${regions.length} ${regionLabel === "Kanton" ? "Kantonen" : "Bundesländern"}`}</p>
      <ul className="sh-regions">
        {visible.map((region, index) => (
          <li key={region.name} className="sh-region" style={{ ["--i" as string]: index }}>
            <div className="sh-region-head">
              <span className="sh-region-icon" aria-hidden="true"><PinIcon /></span>
              <h3>{region.name}</h3>
              <span className="sh-region-count">{region.cities.length} {region.cities.length === 1 ? "Stadt" : "Städte"}</span>
            </div>
            <ul className="sh-chips">
              {region.cities.map((city) => (
                <li key={city.path}>
                  <Link className="sh-chip" href={city.path} title={city.teaser}>
                    {city.photo ? <img src={city.photo.src} alt={`Stadtansicht von ${city.name}`} loading="lazy" decoding="async" /> : <span className="sh-chip-ph" aria-hidden="true"><MarsPairIcon /></span>}
                    <span className="sh-chip-copy"><strong>{city.name}</strong><small>{city.teaser}</small></span>
                    <ArrowIcon className="sh-chip-go" />
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {!visible.length ? <p className="sh-empty">Keine Stadtseite gefunden – die individuelle Suche direkt darunter findet Männer an jedem Ort.</p> : null}
    </div>
  );
}
