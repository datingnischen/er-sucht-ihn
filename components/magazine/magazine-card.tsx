import Link from "next/link";
import { ArrowIcon, ClockIcon } from "@/components/icons";
import { articleUpdatedDate, type MagazineEntry } from "@/lib/magazine";
import { MagazineCategoryIcon } from "./category-icon";
import { dateLabel, isSceneGuide, primaryCategory, readingMinutes } from "./content";

/** Titelbild eines Beitrags oder – ohne Bild – ein Dusk-Verlauf mit dem Icon der Kategorie. */
export function MagazineMedia({ entry, className = "", eager = false }: { entry: MagazineEntry; className?: string; eager?: boolean }) {
  const slug = entry.type === "page" && isSceneGuide(entry) ? "guide" : primaryCategory(entry)?.slug;
  if (entry.featuredImage) {
    return (
      <span className={`mz-media ${className}`.trim()}>
        <img src={entry.featuredImage} alt={`Titelbild: ${entry.title}`} loading={eager ? "eager" : "lazy"} decoding="async" />
      </span>
    );
  }
  return (
    <span className={`mz-media mz-media-fallback mz-tone-${entry.id % 4} ${className}`.trim()} aria-hidden="true">
      <MagazineCategoryIcon slug={slug} className="mz-media-icon" />
    </span>
  );
}

type CardProps = {
  entry: MagazineEntry;
  variant?: "default" | "lead" | "compact";
  heading?: "h2" | "h3";
  showExcerpt?: boolean;
};

/** Beitragskarte für Startseite, Archiv, Kategorien und Autoren. Datum nur bei Beiträgen, als letzte Aktualisierung. */
export function MagazineCard({ entry, variant = "default", heading = "h3", showExcerpt = true }: CardProps) {
  const Heading = heading;
  const category = primaryCategory(entry);
  return (
    <article className={`mz-card mz-card-${variant}`}>
      <Link href={entry.path} className="mz-card-link">
        <span className="mz-card-visual">
          <MagazineMedia entry={entry} />
          <span className="mz-card-chip">
            <MagazineCategoryIcon slug={category?.slug} />
            {category?.name || (entry.type === "page" ? "Guide" : "Magazin")}
          </span>
        </span>
        <div className="mz-card-body">
          <Heading className="mz-card-title">{entry.title}</Heading>
          {showExcerpt && <span className="mz-card-excerpt">{entry.description}</span>}
          <span className="mz-card-meta">
            {entry.type === "post" && <time dateTime={articleUpdatedDate(entry)}>Aktualisiert {dateLabel(articleUpdatedDate(entry))}</time>}
            <span className="mz-card-read"><ClockIcon />{readingMinutes(entry.contentHtml)} Min.</span>
          </span>
          <span className="mz-card-go">Lesen <ArrowIcon /></span>
        </div>
      </Link>
    </article>
  );
}
