import { registrationUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqSection } from "@/components/faq-section";
import type { ImportedView } from "@/components/imported-view";

/**
 * Inhaltsseiten aus dem ICONY-Import (FAQ, Bewertungen, Ratgeber) – Übergangsvorlage,
 * bis die redaktionellen Seiten im Dusk-Look folgen.
 */
export function ContentPage({ page, path, image, contentHtml, faq, breadcrumbs }: ImportedView) {
  return <main className="wrap page-shell">
    <article className="article-card">
      <Breadcrumbs items={breadcrumbs} />
      <div className="article-hero"><div><p className="kicker">Gut informiert</p><h1>{page.h1}</h1><p className="lead">{page.description}</p><a className="button button-green" href={registrationUrl(path)}>Jetzt kostenlos starten</a></div>{image ? <img src={image.src} alt={image.alt || page.h1} /> : null}</div>
      {faq ? <>
        <div className="rich-content" dangerouslySetInnerHTML={{ __html: faq.beforeHtml }} />
        <FaqSection groups={faq.groups} registrationHref={registrationUrl(path)} />
        <div className="rich-content" dangerouslySetInnerHTML={{ __html: faq.afterHtml }} />
      </> : <div className="rich-content" dangerouslySetInnerHTML={{ __html: contentHtml }} />}
      <aside className="inline-cta"><h2>Bereit für Deinen ersten Kontakt?</h2><p>Erstelle kostenlos Dein Profil und entdecke Männer, die ähnliche Wünsche und Werte mitbringen.</p><a className="button button-green" href={registrationUrl(path)}>Kostenlos registrieren</a></aside>
    </article>
  </main>;
}
