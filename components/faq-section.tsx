"use client";

import { useMemo, useState, type ReactNode } from "react";
import { SITE_URL } from "@/lib/site";
import { BookIcon, HeartIcon, MarsPairIcon, PhoneIcon, SearchIcon, ShieldIcon, StarIcon } from "@/components/icons";

type FaqGroup = {
  id: string;
  title: string;
  items: Array<{ id: string; question: string; answerHtml: string }>;
};

// Hilfe und Kontakt sind ICONY-Plattformseiten und werden absolut verlinkt.
const HELP_URL = `${SITE_URL}/hilfe/`;

// Eigene Symbole für Profil und Kosten (gleicher Strich wie components/icons.tsx).
const svgProps = { viewBox: "0 0 24 24", width: "1em", height: "1em", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, focusable: false };
const UserIcon = () => <svg {...svgProps}><circle cx="12" cy="8.2" r="3.8" /><path d="M4.8 20c.8-3.9 3.6-6.2 7.2-6.2s6.4 2.3 7.2 6.2" /></svg>;
const TagIcon = () => <svg {...svgProps}><path d="M3.8 12.6V4.8a1 1 0 0 1 1-1h7.8l7.6 7.6a1.5 1.5 0 0 1 0 2.1l-6.3 6.3a1.5 1.5 0 0 1-2.1 0Z" /><circle cx="8.4" cy="8.4" r="1.5" /></svg>;

function topicIcon(title: string): ReactNode {
  const value = title.toLowerCase();
  if (/sicherheit|seriosit/.test(value)) return <ShieldIcon />;
  if (/erfahrung|bewertung/.test(value)) return <StarIcon />;
  if (/kosten|mitgliedschaft|anmeldung/.test(value)) return <TagIcon />;
  if (/profil/.test(value)) return <UserIcon />;
  if (/nutzung|funktion|technik/.test(value)) return <PhoneIcon />;
  if (/konto|recht/.test(value)) return <BookIcon />;
  if (/allgemein/.test(value)) return <MarsPairIcon />;
  return <HeartIcon />;
}

/** Chip-Text ohne „… über/von/zu er-sucht-ihn.de“. */
function topicLabel(title: string) {
  return title.replace(/\s+(über|von|zu|bei)\s+er-sucht-ihn\.de\s*$/i, "").trim();
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/g, " ")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Durchsuchbares FAQ-Akkordeon. Ohne JavaScript sind alle Fragen sichtbar und aufklappbar;
 * mit JavaScript filtert die Suche Frage und Antwort und klappt Treffer automatisch auf.
 */
export function FaqSection({ groups, helpHref = HELP_URL }: { groups: FaqGroup[]; helpHref?: string }) {
  const [query, setQuery] = useState("");
  const indexed = useMemo(() => groups.map((group, groupIndex) => ({
    ...group,
    groupIndex,
    items: group.items.map((item) => ({ ...item, search: ` ${normalize(`${item.question} ${item.answerHtml} ${group.title}`)} ` })),
  })), [groups]);
  const terms = normalize(query).split(" ").filter(Boolean);
  const visible = terms.length
    ? indexed.map((group) => ({ ...group, items: group.items.filter((item) => terms.every((term) => item.search.includes(term))) })).filter((group) => group.items.length)
    : indexed;
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const hits = visible.reduce((sum, group) => sum + group.items.length, 0);

  return <section className="lx-faq" aria-label="Fragen und Antworten">
    <div className="lx-faq-searchbar" role="search">
      <label className="lx-sr" htmlFor="lx-faq-search">Fragen und Antworten durchsuchen</label>
      <span className="lx-faq-search-icon" aria-hidden="true"><SearchIcon /></span>
      <input id="lx-faq-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Frage suchen – z. B. Kosten, Fotos, Löschen" autoComplete="off" maxLength={80} />
      {query ? <button type="button" className="lx-faq-reset" onClick={() => setQuery("")}>Zurücksetzen</button> : null}
      <p className="lx-faq-count" aria-live="polite">{terms.length ? (hits === 1 ? "1 passende Antwort" : `${hits} passende Antworten`) : `${total} Antworten in ${groups.length} Themen`}</p>
    </div>

    <nav className="lx-faq-topics" aria-label="FAQ-Themen">
      <ul>{indexed.map((group) => <li key={group.id}><a href={`#${group.id}`}><span className="lx-faq-topic-icon" aria-hidden="true">{topicIcon(group.title)}</span>{topicLabel(group.title)}<span className="lx-faq-topic-count">{group.items.length}</span></a></li>)}</ul>
    </nav>

    <div className="lx-faq-groups">
      {visible.map((group) => <section className={`lx-faq-group lx-faq-tone-${group.groupIndex % 4}`} id={group.id} key={group.id} aria-labelledby={`${group.id}-title`}>
        <header className="lx-faq-group-head">
          <span className="lx-faq-group-icon" aria-hidden="true">{topicIcon(group.title)}</span>
          <span className="lx-faq-group-no" aria-hidden="true">{String(group.groupIndex + 1).padStart(2, "0")}</span>
          <h2 id={`${group.id}-title`}>{group.title}</h2>
          <p>{group.items.length === 1 ? "1 Frage" : `${group.items.length} Fragen`}</p>
        </header>
        <div className="lx-faq-list">
          {group.items.map((item, itemIndex) => <details className="lx-faq-item" id={item.id} key={`${query}|${item.id}`} open={terms.length ? true : group.groupIndex === 0 && itemIndex === 0}>
            <summary><span className="lx-faq-question">{item.question}</span><span className="lx-faq-toggle" aria-hidden="true" /></summary>
            <div className="lx-faq-answer" dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
          </details>)}
        </div>
      </section>)}
      {!visible.length ? <div className="lx-faq-empty">
        <p className="lx-faq-empty-title">Dazu haben wir noch keine Antwort.</p>
        <p>Probier einen anderen Begriff oder schau in die <a href={helpHref}>Hilfe</a> – dort erreichst Du auch unseren Support.</p>
      </div> : null}
    </div>
  </section>;
}
