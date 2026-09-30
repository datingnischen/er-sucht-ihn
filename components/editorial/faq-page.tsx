import Link from "next/link";
import { ABOUT_REVIEWS_PATH } from "@/lib/about-pages.mjs";
import { platform } from "@/lib/site";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqSection } from "@/components/faq-section";
import { ArrowIcon, QuestionIcon, ShieldIcon, StarIcon } from "@/components/icons";
import type { ImportedView } from "@/components/imported-view";
import { cleanImportedHtml } from "./imported-html";
import "./lexikon.css";
import "./faq.css";

/** /faq/ – Hero, durchsuchbares Akkordeon, Service-Kacheln. FAQPage-JSON-LD kommt aus der Route. */
export function FaqPage({ page, image, faq, breadcrumbs }: ImportedView) {
  if (!faq) return null;
  const total = faq.groups.reduce((sum, group) => sum + group.items.length, 0);
  const intro = cleanImportedHtml(faq.beforeHtml);
  const costQuestion = faq.groups.flatMap((group) => group.items).find((item) => /kostenlos|kosten/i.test(item.question));
  const services = [
    { href: platform.help, icon: <QuestionIcon />, title: "Hilfe & Support", text: "Weitere Antworten und der direkte Draht zu unserem Support-Team.", cta: "Zur Hilfe" },
    { href: platform.safety, icon: <ShieldIcon />, title: "Sicherheit & Datenschutz", text: "Wie Er-sucht-Ihn.de mit Deinen Daten umgeht.", cta: "Mehr erfahren" },
    { href: ABOUT_REVIEWS_PATH, icon: <StarIcon />, title: "Bewertungen & Erfahrungen", text: "Was Nutzer und Vergleichsportale über Er-sucht-Ihn.de sagen.", cta: "Bewertungen ansehen", internal: true },
  ];

  return <main className="lx-page lx-faq-page">
    <header className="lx-hero lx-hero-faq">
      <span className="lx-hero-watermark" aria-hidden="true">?</span>
      <div className="wrap lx-hero-grid">
        <div className="lx-hero-copy">
          <Breadcrumbs items={breadcrumbs} className="lx-crumbs" />
          <p className="lx-badge"><QuestionIcon /> Fragen &amp; Antworten</p>
          <h1>{page.h1}</h1>
          <p className="lx-hero-tag">Deine Fragen, <em>unsere Antworten</em></p>
          <div className="lx-hero-lead lx-faq-intro" dangerouslySetInnerHTML={{ __html: intro }} />
          <ul className="lx-hero-facts" aria-label="Die FAQ in Zahlen">
            <li><strong>{total}</strong> Antworten</li>
            <li><strong>{faq.groups.length}</strong> Themen</li>
            <li><strong>0 €</strong> Registrierung</li>
          </ul>
        </div>
        <figure className="lx-hero-media lx-faq-media">
          <span className="lx-arch">{image ? <img src={image.src} alt={image.alt && !/^faq/i.test(image.alt) ? image.alt : "Häufig gestellte Fragen zu Er-sucht-Ihn.de"} width={560} height={700} fetchPriority="high" /> : null}</span>
          <span className="lx-faq-badge" aria-hidden="true">?</span>
          {costQuestion ? <a className="lx-faq-float" href={`#${costQuestion.id}`}><small>Oft gefragt</small><strong>{costQuestion.question}</strong></a> : null}
        </figure>
      </div>
    </header>

    <div className="wrap lx-faq-wrap"><FaqSection groups={faq.groups} helpHref={platform.help} /></div>

    <section className="wrap lx-faq-service" aria-labelledby="lx-faq-service-title">
      <div className="lx-section-head">
        <p className="kicker">Noch Fragen?</p>
        <h2 id="lx-faq-service-title">Hier geht’s <em>weiter</em></h2>
      </div>
      <div className="lx-faq-service-grid">
        {services.map((service) => {
          const body = <><span className="lx-faq-service-icon" aria-hidden="true">{service.icon}</span><strong>{service.title}</strong><span>{service.text}</span><em>{service.cta} <ArrowIcon /></em></>;
          return service.internal
            ? <Link className="lx-faq-service-card" href={service.href} key={service.title}>{body}</Link>
            : <a className="lx-faq-service-card" href={service.href} key={service.title}>{body}</a>;
        })}
      </div>
    </section>

    <section className="wrap lx-cta-band" aria-labelledby="lx-faq-cta-title">
      <div>
        <p className="kicker">Alles geklärt?</p>
        <h2 id="lx-faq-cta-title">Dann lerne Männer kennen, die <em>Männer lieben</em></h2>
        <p>Erstelle kostenlos Dein Profil und entdecke Männer aus Deiner Region.</p>
      </div>
      <div className="rich-content lx-prose lx-faq-after" dangerouslySetInnerHTML={{ __html: cleanImportedHtml(faq.afterHtml) }} />
    </section>
  </main>;
}
