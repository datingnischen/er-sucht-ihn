import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SocialIcon } from "@/components/social-icon";
import { ABOUT_ROOT_PATH, ABOUT_SOCIAL_PATH } from "@/lib/about-pages.mjs";
import { buildBreadcrumbs, buildBreadcrumbSchema } from "@/lib/breadcrumbs.mjs";
import { getImportedPage } from "@/lib/content";
import { buildPageEntityGraph, serializePageEntityGraph } from "@/lib/page-entities.mjs";
import { registrationUrl } from "@/lib/site";
import { socialChannels } from "@/lib/social-channels";
import { staticAsset } from "@/lib/static-asset.mjs";

const heroImage = { src: staticAsset("/about/betrieb-support.webp"), alt: "Mann schaut lächelnd von seinem Smartphone auf" };
const channels = socialChannels.filter((channel) => channel.profile);
const community = socialChannels.find((channel) => !channel.profile);

export function generateMetadata(): Metadata {
  const page = getImportedPage(ABOUT_SOCIAL_PATH);
  if (!page) return {};
  return { title: page.title, description: page.description, alternates: { canonical: page.canonical }, openGraph: { title: page.title, description: page.description, url: page.canonical, images: [heroImage.src] } };
}

export default function AboutSocialPage() {
  const page = getImportedPage(ABOUT_SOCIAL_PATH);
  if (!page) notFound();
  const breadcrumbs = buildBreadcrumbs(ABOUT_SOCIAL_PATH, "Social Media");
  return <main className="wrap page-shell about-page">
    <article className="article-card">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><ol>{breadcrumbs.map((item, index) => <li key={item.path}>{index < breadcrumbs.length - 1 ? <Link href={item.path}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}</li>)}</ol></nav>
      <script type="application/ld+json">{JSON.stringify(buildBreadcrumbSchema(ABOUT_SOCIAL_PATH, "Social Media"))}</script>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializePageEntityGraph(buildPageEntityGraph(page)) }} />

      <header className="social-hero">
        <div>
          <p className="kicker">Über uns · Social Media</p>
          <h1>Er-sucht-Ihn auf Social Media</h1>
          <p className="lead">{page.description} Dating-Tipps, Community-Themen und Neuigkeiten rund um die Plattform – dort, wo Du ohnehin unterwegs bist.</p>
          <ul className="social-bubbles" aria-label="Unsere Kanäle">
            {socialChannels.map((channel) => <li key={channel.href}><a className={`social-bubble social-${channel.platform}`} href={channel.href} rel="nofollow noopener noreferrer" target="_blank" aria-label={channel.name}><SocialIcon platform={channel.platform} size={20} /></a></li>)}
          </ul>
        </div>
        <figure className="social-hero-media"><img src={heroImage.src} alt={heroImage.alt} width="720" height="450" /></figure>
      </header>

      <section className="about-section" aria-labelledby="social-channels-title">
        <div className="about-section-heading">
          <p className="kicker">Unsere Kanäle</p>
          <h2 id="social-channels-title">Folge uns, wo Du ohnehin scrollst</h2>
        </div>
        <div className="social-channel-grid">
          {channels.map((channel) => <a className={`social-channel-card social-${channel.platform}`} href={channel.href} key={channel.href} rel="nofollow noopener noreferrer" target="_blank">
            <span className="social-channel-top"><span className="social-bubble"><SocialIcon platform={channel.platform} size={24} /></span><span className="social-channel-kind">{channel.kind}</span></span>
            <strong className="social-channel-name">{channel.name}</strong>
            <span className="social-channel-handle">{channel.handle}</span>
            <span className="social-channel-text">{channel.text}</span>
            <span className="social-channel-cta">{channel.cta} <span aria-hidden="true">→</span></span>
          </a>)}
        </div>
      </section>

      {community ? <section className="social-community" aria-labelledby="social-community-title">
        <span className="social-bubble social-facebook"><SocialIcon platform={community.platform} size={28} /></span>
        <div>
          <p className="kicker">Community</p>
          <h2 id="social-community-title">Unsere Facebook-Gruppe</h2>
          <p>Hier reden nicht wir, sondern Du: {community.text}</p>
        </div>
        <a className="button button-pink" href={community.href} rel="nofollow noopener noreferrer" target="_blank">{community.cta}</a>
      </section> : null}

      <div className="about-section-actions"><Link className="button button-outline" href={ABOUT_ROOT_PATH}>Zur Über-uns-Übersicht</Link></div>

      <aside className="inline-cta"><h2>Lieber direkt Männer kennenlernen?</h2><p>Erstelle kostenlos Dein Profil und entdecke Männer aus Deiner Region, die ähnliche Wünsche und Werte mitbringen.</p><a className="button button-green" href={registrationUrl(ABOUT_SOCIAL_PATH)}>Kostenlos registrieren</a></aside>
    </article>
  </main>;
}
