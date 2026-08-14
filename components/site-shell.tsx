"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { platform, registrationUrl } from "@/lib/site";

const nav = [
  ["Partnersuche", "/partnersuche"],
  ["Lexikon", "/lexikon"],
  ["Dating-Tipps", "/dating-tipps"],
  ["Magazin", "https://er-sucht-ihn.de/magazin/"],
] as const;

export function Header() {
  const pathname = usePathname() || "/";
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Er-sucht-Ihn.de Startseite">
          <img src="/brand/logo.svg" alt="Er-sucht-Ihn.de – Für schwule Single-Männer" width="306" height="50" />
        </Link>
        <nav className="desktop-nav" aria-label="Hauptnavigation">
          {nav.map(([label, href]) => href.startsWith("http") ? <a href={href} key={label}>{label}</a> : <Link href={href} key={label}>{label}</Link>)}
        </nav>
        <div className="header-actions">
          <a className="login" href={platform.login}>Login</a>
          <a className="button button-green button-compact" href={registrationUrl(pathname)}>Registrieren</a>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const pathname = usePathname() || "/";
  const register = registrationUrl(pathname);
  return (
    <footer className="site-footer">
      <section className="footer-cta">
        <p className="kicker">Partnersuche für Männer</p>
        <h2>Triff Männer aus Deiner Region – sicher, persönlich und kostenlos.</h2>
        <a className="button button-green" href={register}>Jetzt kostenlos registrieren</a>
      </section>
      <div className="footer-grid">
        <div className="footer-brand">
          <img src="/brand/logo.svg" alt="Er-sucht-Ihn.de" width="306" height="50" />
          <p>Eine Community für Männer, die Männer lieben – mit regionalen Einstiegen, Datingwissen und redaktionell geprüften Profilen.</p>
          <ul className="trust-list"><li>Über 20 Jahre Dating-Erfahrung</li><li>Server in Deutschland</li><li>Keine versteckten Kosten beim Einstieg</li></ul>
          <a className="seal" href="https://singleboersen-ueberblick.de/testbericht/er-sucht-ihn-de" rel="nofollow noopener noreferrer" target="_blank">
            <img src="/trust/empfohlen-45-sterne.png" alt="Empfohlen von Singlebörsen-Überblick.de – 4,5 Sterne" width="300" height="60" />
          </a>
        </div>
        <FooterColumn title="Entdecken" links={[["Partnersuche", "/partnersuche"], ["Lexikon", "/lexikon"], ["Dating-Tipps", "/dating-tipps"], ["Erfahrungen", "/bewertungen-und-erfahrungen"], ["Social Media", "/social-media"]]} />
        <FooterColumn title="Vertrauen" links={[["Sicherheit & Datenschutz", "/sicherheit-und-datenschutz.html"], ["Redaktionelle Kontrolle", "/redaktionelle-kontrolle.html"], ["Basis-Mitgliedschaft", "/kostenlose-basis-mitgliedschaft.html"], ["Erfolgsgeschichten", "/unsere-erfolgsgeschichten.html"], ["FAQ", "/faq"]]} />
        <div className="footer-column"><h2>Service</h2><ul>
          <li><a href={platform.help}>Hilfe & Support</a></li><li><a href={platform.login}>Login</a></li><li><a href={register}>Registrieren</a></li>
          <li><a href={platform.privacy}>Datenschutz</a></li><li><a href={platform.legal}>Impressum</a></li><li><a href={platform.terms}>AGB</a></li>
        </ul></div>
      </div>
      <div className="subfooter"><span>© {new Date().getFullYear()} Er-sucht-Ihn.de</span><span>Im Partnernetzwerk der ICONY GmbH</span></div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: readonly (readonly [string, string])[] }) {
  return <div className="footer-column"><h2>{title}</h2><ul>{links.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></div>;
}
