import { SITE_URL } from "@/lib/site";
import { FaqSearch } from "./faq-search";

type FaqGroup = {
  id: string;
  title: string;
  items: Array<{ id: string; question: string; answerHtml: string }>;
};

// Themen-Chips ohne „… über er-sucht-ihn.de“, damit die Leiste kurz bleibt.
function chipLabel(title: string) {
  return title.replace(/\s+(?:über|von|zu)\s+er-sucht-ihn\.de$/i, "");
}

const serviceLinks = [
  { title: "Hilfe", text: "Anleitungen zu Profil, Nachrichten und Einstellungen.", href: `${SITE_URL}/hilfe/` },
  { title: "Kontakt", text: "Persönliche Frage? Unser Support antwortet Dir direkt.", href: `${SITE_URL}/kontakt/` },
  { title: "Sicherheit & Datenschutz", text: "So schützen wir Deine Daten und Dein Profil.", href: `${SITE_URL}/sicherheit-und-datenschutz.html` },
];

export function FaqSection({ groups, registrationHref }: { groups: FaqGroup[]; registrationHref: string }) {
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
  const listId = "faq-antworten";
  return <section className="faq-section" aria-labelledby="faq-heading">
    <header className="faq-intro">
      <p className="kicker">Schnell beantwortet</p>
      <h2 id="faq-heading">Deine Fragen, unsere Antworten</h2>
      <p>{total} Antworten in {groups.length} Themen – such nach einem Stichwort oder wähle ein Thema.</p>
    </header>
    <FaqSearch targetId={listId} total={total} contactHref={`${SITE_URL}/kontakt/`} />
    <nav className="faq-topics" aria-label="FAQ-Themen">
      {groups.map((group) => <a href={`#${group.id}`} key={group.id}>{chipLabel(group.title)}<span>{group.items.length}</span></a>)}
    </nav>
    <div className="faq-groups" id={listId}>
      {groups.map((group, groupIndex) => <div className="faq-group" id={group.id} key={group.id} data-faq-group>
        <h3><span aria-hidden="true">{String(groupIndex + 1).padStart(2, "0")}</span>{group.title}</h3>
        <div className="faq-list">
          {group.items.map((item, itemIndex) => <details className="faq-item" id={item.id} key={item.id} open={groupIndex === 0 && itemIndex === 0} data-faq-item>
            <summary><span>{item.question}</span><i className="faq-icon" aria-hidden="true" /></summary>
            <div className="faq-answer" dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
          </details>)}
        </div>
      </div>)}
    </div>
    <div className="faq-service">
      {serviceLinks.map((link) => <a href={link.href} key={link.href}><strong>{link.title}</strong><span>{link.text}</span></a>)}
    </div>
    <aside className="faq-help">
      <div>
        <h3>Deine Frage ist nicht dabei?</h3>
        <p>In der Hilfe findest Du weitere Antworten und den direkten Draht zu unserem Support.</p>
      </div>
      <div className="faq-help-actions">
        <a className="button button-outline" href={`${SITE_URL}/hilfe/`}>Zur Hilfe</a>
        <a className="button button-green" href={registrationHref}>Kostenlos starten</a>
      </div>
    </aside>
  </section>;
}
