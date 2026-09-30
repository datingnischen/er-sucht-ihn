import type { CSSProperties, ReactNode } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import "./about.css";

type Crumb = { name: string; path: string };

/** Gemeinsamer Nachtblau-Hero der Über-uns-Seiten (Präfix ab-). */
export function AboutHero({ breadcrumbs, badge, badgeIcon, title, lead, children, media, watermark, className = "" }: {
  breadcrumbs: Crumb[];
  badge: string;
  badgeIcon: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  media?: ReactNode;
  watermark?: string;
  className?: string;
}) {
  return <header className={`ab-hero ${className}`.trim()}>
    {watermark ? <span className="ab-hero-watermark" aria-hidden="true">{watermark}</span> : null}
    <div className={`wrap ab-hero-grid${media ? "" : " ab-hero-grid-single"}`}>
      <div className="ab-hero-copy">
        <Breadcrumbs items={breadcrumbs} className="ab-crumbs" />
        <p className="ab-badge">{badgeIcon} {badge}</p>
        <h1>{title}</h1>
        {lead ? <div className="ab-hero-lead">{lead}</div> : null}
        {children}
      </div>
      {media ? <div className="ab-hero-media">{media}</div> : null}
    </div>
  </header>;
}

/** Sterne ohne Bilder: Verlauf bis zum Wert, maskiert mit einem Stern-SVG. */
export function RatingStars({ rating, size = 22, label }: { rating: number; size?: number; label?: string }) {
  const style = { "--rating": rating, "--star": `${size}px` } as CSSProperties;
  const text = label ?? `${String(rating).replace(".", ",")} von 5 Sternen`;
  return <span className="ab-stars" style={style} role="img" aria-label={text} />;
}

/** Liest „4,4 von 5 Sternen“ aus einem Text, damit Anzeige und Text nie auseinanderlaufen. */
export function ratingFromText(text: string) {
  const match = text.match(/(\d)[,.](\d)\s*von\s*5\s*Sternen/i);
  return match ? { value: Number(`${match[1]}.${match[2]}`), label: `${match[1]},${match[2]}` } : null;
}
