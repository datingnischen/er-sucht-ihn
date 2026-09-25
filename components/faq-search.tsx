"use client";

import { useRef, useState } from "react";

function normalize(value: string) {
  return value.toLocaleLowerCase("de").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}

// Filtert die serverseitig gerenderten FAQ-Karten, damit alle Antworten im HTML für Crawler sichtbar bleiben.
export function FaqSearch({ targetId, total, contactHref }: { targetId: string; total: number; contactHref: string }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState(total);
  const input = useRef<HTMLInputElement>(null);

  function search(value: string) {
    setQuery(value);
    const root = document.getElementById(targetId);
    if (!root) return;
    const needle = normalize(value.trim());
    let visible = 0;
    root.querySelectorAll<HTMLElement>("[data-faq-group]").forEach((group) => {
      let groupVisible = 0;
      group.querySelectorAll<HTMLDetailsElement>("[data-faq-item]").forEach((item) => {
        const hit = !needle || normalize(item.textContent ?? "").includes(needle);
        item.hidden = !hit;
        if (needle && hit) item.open = true;
        if (hit) groupVisible++;
      });
      group.hidden = groupVisible === 0;
      visible += groupVisible;
    });
    setMatches(visible);
  }

  return <div className="faq-search" role="search">
    <label className="faq-search-field">
      <span className="sr-only">FAQ durchsuchen</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="m20 20-3.6-3.6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
      <input ref={input} type="search" value={query} onChange={(event) => search(event.target.value)} placeholder="Frage suchen, z. B. Kosten, Profil, Fake-Profile …" autoComplete="off" />
      {query ? <button type="button" onClick={() => { search(""); input.current?.focus(); }} aria-label="Suche zurücksetzen">×</button> : null}
    </label>
    <p className="faq-search-status" aria-live="polite">
      {!query ? `${total} Antworten durchsuchbar` : matches ? `${matches} passende ${matches === 1 ? "Antwort" : "Antworten"}` : <>Keine passende Frage gefunden – <a href={contactHref}>schreib unserem Support</a>.</>}
    </p>
  </div>;
}
