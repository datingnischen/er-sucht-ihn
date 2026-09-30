import Link from "next/link";
import { ABOUT_ROOT_PATH, ABOUT_SOCIAL_PATH } from "@/lib/about-pages.mjs";
import { registrationUrl } from "@/lib/site";
import { socialChannels } from "@/lib/social-channels";
import { ArrowIcon, HeartFilledIcon, MarsPairIcon, QuestionIcon, StarIcon } from "@/components/icons";
import type { ImportedView } from "@/components/imported-view";
import { SocialIcon } from "@/components/social-icon";
import { cleanImportedHtml, splitSections, stripTags, type HtmlSection } from "@/components/editorial/imported-html";
import { AboutHero, RatingStars, ratingFromText } from "./about-hero";

type Seal = { src: string; alt: string; href: string | null };

// Alt-Texte für die Siegel (im Import ohne alt).
const SEAL_ALTS: Array<[RegExp, string]> = [
  [/empfohlen-siegel-45/i, "Siegel: Empfohlen von Singlebörsen-Überblick.de – 4,5 Sterne"],
  [/singleboersen-vergleichen/i, "Siegel von Singlebörsen-Vergleichen.de"],
];

// Trustpilot-Wert wie auf der Über-uns-Seite; die importierte Seite nennt nur Sterne-Emojis.
const TRUSTPILOT_FALLBACK = { value: 4, label: "4" };

function sealAlt(src: string) {
  return SEAL_ALTS.find(([pattern]) => pattern.test(src))?.[1] || "Siegel eines Vergleichsportals";
}

/** Zieht Siegelbilder (optional verlinkt) aus einem Abschnitt; der übrige Text bleibt stehen. */
function extractSeals(html: string) {
  const seals: Seal[] = [];
  const rest = html.replace(/<p>\s*(?:<a\s[^>]*href="([^"]+)"[^>]*>)?\s*<img\b[^>]*src="([^"]+)"[^>]*\/?>\s*(?:<\/a>)?\s*<\/p>/gi, (_, href: string | undefined, src: string) => {
    seals.push({ src, alt: sealAlt(src), href: href || null });
    return " ";
  });
  return { seals, html: rest.trim() };
}

// Die Emoji-Zeile „⭐⭐⭐⭐⭐“ wird durch die echte Sternanzeige ersetzt.
const removeEmojiStars = (html: string) => html.replace(/<p>\s*(?:⭐\s*)+<\/p>/g, " ").trim();

const find = (sections: HtmlSection[], pattern: RegExp) => sections.find((section) => pattern.test(section.title));

/** /ueber-uns/bewertungen/ – importierte ICONY-Seite „Bewertung und Erfahrungen“ als Bewertungsseite. */
export function ReviewsPage({ page, path, image, contentHtml, breadcrumbs }: ImportedView) {
  const { intro, sections } = splitSections(cleanImportedHtml(contentHtml));
  const trustpilot = find(sections, /trustpilot/i);
  const portals = find(sections, /vergleichsportal/i);
  const why = find(sections, /warum/i);
  const tryIt = find(sections, /ausprobieren/i);
  const others = sections.filter((section) => ![trustpilot, portals, why, tryIt].includes(section));
  const rating = ratingFromText(stripTags(trustpilot?.html || contentHtml)) ?? (trustpilot ? TRUSTPILOT_FALLBACK : null);
  const portalContent = portals ? extractSeals(portals.html) : null;
  const youtube = socialChannels.find((channel) => channel.platform === "youtube");
  const registration = registrationUrl(path);

  return <main className="ab-page">
    <AboutHero
      breadcrumbs={breadcrumbs}
      badge="Über uns · Bewertungen"
      badgeIcon={<StarIcon />}
      title={page.h1}
      lead={<div className="rich-content ab-prose-light" dangerouslySetInnerHTML={{ __html: intro }} />}
      watermark="★"
      media={<figure className="ab-reviews-media">
        <span className="ab-arch">{image ? <img src={image.src} alt={image.alt || "Bewertungen und Erfahrungen zu Er-sucht-Ihn.de"} width={400} height={500} fetchPriority="high" /> : null}</span>
        {rating ? <figcaption className="ab-score-card">
          <span className="ab-score-value">{rating.label}</span>
          <span className="ab-score-body"><RatingStars rating={rating.value} size={20} /><small>von 5 Sternen auf Trustpilot</small></span>
        </figcaption> : null}
      </figure>}
    >
      <div className="ab-hero-actions">
        <a className="button button-green" href={registration}>Selbst ausprobieren</a>
        {trustpilot ? <a className="button button-ghost-light" href={`#${trustpilot.id}`}>Zu den Bewertungen</a> : null}
      </div>
    </AboutHero>

    {trustpilot ? <section className="wrap ab-section" id={trustpilot.id} aria-labelledby={`${trustpilot.id}-title`}>
      <div className="ab-rating-panel">
        <div className="ab-rating-score">
          <span className="ab-rating-source">Trustpilot</span>
          {rating ? <><strong>{rating.label}</strong><RatingStars rating={rating.value} size={30} /><small>von 5 Sternen</small></> : <StarIcon />}
        </div>
        <div className="ab-rating-copy">
          <p className="kicker">Nutzer-Stimmen</p>
          <h2 id={`${trustpilot.id}-title`} dangerouslySetInnerHTML={{ __html: trustpilot.titleHtml }} />
          <div className="rich-content ab-prose ab-prose-light" dangerouslySetInnerHTML={{ __html: removeEmojiStars(trustpilot.html) }} />
        </div>
      </div>
    </section> : null}

    {portals && portalContent ? <section className="wrap ab-section" id={portals.id} aria-labelledby={`${portals.id}-title`}>
      <div className="ab-split">
        <div>
          <p className="kicker">Vergleichsportale</p>
          <h2 id={`${portals.id}-title`} dangerouslySetInnerHTML={{ __html: portals.titleHtml }} />
          <div className="rich-content ab-prose" dangerouslySetInnerHTML={{ __html: portalContent.html }} />
        </div>
        {portalContent.seals.length ? <ul className="ab-seals" aria-label="Siegel und Auszeichnungen">
          {portalContent.seals.map((seal) => <li key={seal.src}>
            {seal.href ? <a href={seal.href} rel="nofollow noopener noreferrer" target="_blank"><img src={seal.src} alt={seal.alt} loading="lazy" decoding="async" /></a> : <img src={seal.src} alt={seal.alt} loading="lazy" decoding="async" />}
          </li>)}
        </ul> : null}
      </div>
    </section> : null}

    {others.map((section) => <section className="wrap ab-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
      <h2 id={`${section.id}-title`} dangerouslySetInnerHTML={{ __html: section.titleHtml }} />
      <div className="rich-content ab-prose" dangerouslySetInnerHTML={{ __html: removeEmojiStars(section.html) }} />
    </section>)}

    {why ? <section className="wrap ab-section" id={why.id} aria-labelledby={`${why.id}-title`}>
      <div className="ab-why">
        <span className="ab-why-mark" aria-hidden="true"><MarsPairIcon /></span>
        <div>
          <p className="kicker">Warum Männer bleiben</p>
          <h2 id={`${why.id}-title`} dangerouslySetInnerHTML={{ __html: why.titleHtml }} />
          <div className="rich-content ab-prose" dangerouslySetInnerHTML={{ __html: why.html }} />
          {youtube ? <a className="ab-video-card" href={youtube.href} rel="nofollow noopener noreferrer" target="_blank">
            <span className="ab-video-icon" aria-hidden="true"><SocialIcon platform="youtube" size={26} /></span>
            <span><small>{youtube.kind}</small><strong>Unser YouTube-Kanal</strong><span>{youtube.text}</span></span>
            <ArrowIcon />
          </a> : null}
        </div>
      </div>
    </section> : null}

    {tryIt ? <section className="wrap ab-section" aria-labelledby={`${tryIt.id}-title`}>
      <div className="ab-cta">
        <span className="ab-cta-heart" aria-hidden="true"><HeartFilledIcon /></span>
        <h2 id={`${tryIt.id}-title`} dangerouslySetInnerHTML={{ __html: tryIt.titleHtml }} />
        <div className="rich-content ab-prose" dangerouslySetInnerHTML={{ __html: tryIt.html }} />
      </div>
    </section> : null}

    <nav className="wrap ab-section ab-next" aria-label="Mehr über uns">
      <Link className="ab-next-card" href={ABOUT_ROOT_PATH}><MarsPairIcon /><span><small>Über uns</small><strong>Wer hinter Er-sucht-Ihn.de steht</strong></span></Link>
      <Link className="ab-next-card" href="/faq"><QuestionIcon /><span><small>FAQ</small><strong>Häufige Fragen &amp; Antworten</strong></span></Link>
      <Link className="ab-next-card" href={ABOUT_SOCIAL_PATH}><HeartFilledIcon /><span><small>Social Media</small><strong>Folge uns auf unseren Kanälen</strong></span></Link>
    </nav>
  </main>;
}
