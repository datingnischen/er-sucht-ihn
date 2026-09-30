import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AboutHero } from "@/components/about/about-hero";
import { ArrowIcon, HeartFilledIcon, PeopleIcon } from "@/components/icons";
import { SocialIcon } from "@/components/social-icon";
import { ABOUT_ROOT_PATH, ABOUT_SOCIAL_PATH } from "@/lib/about-pages.mjs";
import { buildBreadcrumbs, buildBreadcrumbSchema } from "@/lib/breadcrumbs.mjs";
import { getImportedPage } from "@/lib/content";
import { buildPageEntityGraph, serializePageEntityGraph } from "@/lib/page-entities.mjs";
import { registrationUrl } from "@/lib/site";
import { socialChannels } from "@/lib/social-channels";
import { staticAsset } from "@/lib/static-asset.mjs";

const shareImage = staticAsset("/about/betrieb-support.webp");
const profiles = socialChannels.filter((channel) => channel.profile);
const community = socialChannels.find((channel) => !channel.profile);

export function generateMetadata(): Metadata {
  const page = getImportedPage(ABOUT_SOCIAL_PATH);
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: page.canonical }, openGraph: { title: page.title, description: page.description, url: page.canonical, images: [shareImage] } };
}

export default function AboutSocialPage() {
  const page = getImportedPage(ABOUT_SOCIAL_PATH);
  if (!page) notFound();
  const breadcrumbSchema = buildBreadcrumbSchema(ABOUT_SOCIAL_PATH, "Social Media");
  const breadcrumbs = buildBreadcrumbs(ABOUT_SOCIAL_PATH, "Social Media");
  return <main className="ab-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializePageEntityGraph(buildPageEntityGraph(page, { breadcrumb: breadcrumbSchema })) }} />

    <AboutHero
      breadcrumbs={breadcrumbs}
      badge="Über uns · Social Media"
      badgeIcon={<HeartFilledIcon />}
      title={<>Er-sucht-Ihn auf <em>Social Media</em></>}
      lead={<p>{page.description} Dating-Tipps, Community-Themen und Neuigkeiten rund um die Plattform – dort, wo Du ohnehin unterwegs bist.</p>}
      media={<ul className="ab-social-stack" aria-label="Unsere offiziellen Profile">
        {profiles.map((channel) => <li key={channel.href}>
          <a className={`ab-stack-card ab-social-${channel.platform}`} href={channel.href} rel="nofollow noopener noreferrer" target="_blank">
            <span className="ab-social-icon" aria-hidden="true"><SocialIcon platform={channel.platform} size={24} /></span>
            <span><small>{channel.kind}</small><strong>{channel.handle}</strong></span>
            <em>{channel.cta}</em>
          </a>
        </li>)}
      </ul>}
    >
      <ul className="ab-bubbles" aria-label="Unsere Kanäle">
        {profiles.map((channel) => <li key={channel.href}><a className={`ab-bubble ab-social-${channel.platform}`} href={channel.href} rel="nofollow noopener noreferrer" target="_blank" aria-label={channel.name}><SocialIcon platform={channel.platform} size={20} /></a></li>)}
      </ul>
    </AboutHero>

    <section className="wrap ab-section ab-section-first" aria-labelledby="social-channels-title">
      <div className="ab-head">
        <p className="kicker">Unsere Kanäle</p>
        <h2 id="social-channels-title">Folge uns, wo Du <em>ohnehin scrollst</em></h2>
      </div>
      <ul className="ab-social-grid ab-social-grid-wide">
        {profiles.map((channel) => <li key={channel.href}>
          <a className={`ab-social-card ab-social-${channel.platform}`} href={channel.href} rel="nofollow noopener noreferrer" target="_blank">
            <span className="ab-social-card-top"><span className="ab-social-icon" aria-hidden="true"><SocialIcon platform={channel.platform} size={24} /></span><span className="ab-social-kind">{channel.kind}</span></span>
            <strong>{channel.name}</strong>
            <small>{channel.handle}</small>
            <span>{channel.text}</span>
            <em>{channel.cta} <ArrowIcon /></em>
          </a>
        </li>)}
      </ul>
    </section>

    {community ? <section className="wrap ab-section" aria-labelledby="social-community-title">
      <div className="ab-group-banner">
        <span className="ab-group-icon" aria-hidden="true"><PeopleIcon /></span>
        <div>
          <p className="kicker">Community</p>
          <h2 id="social-community-title">Unsere <em>Facebook-Gruppe</em></h2>
          <p>Hier reden nicht wir, sondern Du: {community.text}</p>
        </div>
        <a className="button button-green" href={community.href} rel="nofollow noopener noreferrer" target="_blank">{community.cta}</a>
      </div>
    </section> : null}

    <section className="wrap ab-section" aria-labelledby="social-cta-title">
      <div className="ab-cta">
        <span className="ab-cta-heart" aria-hidden="true"><HeartFilledIcon /></span>
        <h2 id="social-cta-title">Lieber direkt <em>Männer kennenlernen?</em></h2>
        <p>Erstelle kostenlos Dein Profil und entdecke Männer aus Deiner Region, die ähnliche Wünsche und Werte mitbringen.</p>
        <div className="ab-actions ab-actions-center">
          <a className="button button-green" href={registrationUrl(ABOUT_SOCIAL_PATH)}>Kostenlos registrieren</a>
          <Link className="button button-outline" href={ABOUT_ROOT_PATH}>Zur Über-uns-Übersicht</Link>
        </div>
      </div>
    </section>
  </main>;
}
