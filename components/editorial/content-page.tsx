import { ABOUT_REVIEWS_PATH } from "@/lib/about-pages.mjs";
import { registrationUrl } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ReviewsPage } from "@/components/about/reviews-page";
import { BookIcon } from "@/components/icons";
import type { ImportedView } from "@/components/imported-view";
import { FaqPage } from "./faq-page";
import { cleanImportedHtml } from "./imported-html";
import "./lexikon.css";

/** Inhaltsseiten aus dem ICONY-Import: FAQ, Bewertungen und Ratgeberseiten (z. B. „Gay“, „Für Beziehung“). */
export function ContentPage(view: ImportedView) {
  const { page, path, image, contentHtml, faq, breadcrumbs } = view;
  if (faq) return <FaqPage {...view} />;
  if (path === ABOUT_REVIEWS_PATH) return <ReviewsPage {...view} />;

  // Rückfall für weitere importierte Inhaltsseiten: Hero + Text im gleichen Stil.
  return <main className="lx-page">
    <header className="lx-hero">
      <div className="wrap lx-hero-grid">
        <div className="lx-hero-copy">
          <Breadcrumbs items={breadcrumbs} className="lx-crumbs" />
          <p className="lx-badge"><BookIcon /> Gut informiert</p>
          <h1>{page.h1}</h1>
          <p className="lx-hero-lead">{page.description}</p>
          <div className="lx-hero-actions"><a className="button button-green" href={registrationUrl(path)}>Kostenlos registrieren</a></div>
        </div>
        {image ? <figure className="lx-hero-media"><span className="lx-arch"><img src={image.src} alt={image.alt || page.h1} width={560} height={700} /></span></figure> : null}
      </div>
    </header>
    <div className="wrap lx-entry-layout lx-entry-single">
      <article className="lx-article"><div className="rich-content lx-prose" dangerouslySetInnerHTML={{ __html: cleanImportedHtml(contentHtml) }} /></article>
    </div>
  </main>;
}
