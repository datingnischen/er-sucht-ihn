import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, HeartFilledIcon, MarsPairIcon } from "@/components/icons";
import { MagazineArchive } from "@/components/magazine-archive";
import { authorProfile, initials, stripHtml } from "@/components/magazine/content";
import { getMagazineAuthor, magazineAuthors, postsForMagazineAuthor } from "@/lib/magazine";

export const dynamicParams = false;
export function generateStaticParams() { return magazineAuthors.map(({ slug }) => ({ slug })); }
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = getMagazineAuthor((await params).slug);
  if (!author) return { robots: { index: false, follow: false } };
  return { title: `Beiträge von ${author.name}`, description: stripHtml(author.description) || `Öffentliche Magazinbeiträge von ${author.name}.`, alternates: { canonical: `https://er-sucht-ihn.de/magazin/author/${author.slug}/` }, robots: { index: false, follow: true } };
}

export default async function AuthorPage({ params }: Props) {
  const author = getMagazineAuthor((await params).slug);
  if (!author) notFound();
  const entries = postsForMagazineAuthor(author.id);
  const { role, bioEntry, portrait, bioLead } = authorProfile(author.slug);
  const topics = new Set(entries.flatMap((entry) => entry.categories.map((category) => category.slug)));
  const years = entries.map((entry) => entry.date.slice(0, 4)).sort();
  const firstName = author.slug === "redaktion" ? "unserer Redaktion" : author.name.split(" ")[0];
  const intro = author.description
    ? <p dangerouslySetInnerHTML={{ __html: author.description }} />
    : <p>{bioLead || `Alle öffentlichen Magazinbeiträge von ${author.name}.`}</p>;
  return (
    <MagazineArchive
      kicker={role || "Im Magazin"}
      kickerIcon={<MarsPairIcon />}
      title={author.name}
      crumb={author.name}
      intro={intro}
      stats={[
        { value: entries.length, label: entries.length === 1 ? "Beitrag" : "Beiträge" },
        { value: topics.size, label: topics.size === 1 ? "Thema" : "Themen" },
        ...(years.length ? [{ value: years[0], label: "Schreibt seit" }] : []),
      ]}
      visual={(
        <figure className="mz-author-portrait">
          {portrait
            ? <img src={portrait} alt={`Porträt von ${author.name}`} loading="eager" decoding="async" />
            : <span className="mz-author-initials" aria-hidden="true">{initials(author.name)}</span>}
          <span className="mz-hero-arch-icon" aria-hidden="true"><HeartFilledIcon /></span>
          <figcaption>{author.name}</figcaption>
        </figure>
      )}
      heroExtra={bioEntry ? (
        <div className="mz-hero-actions">
          <Link className="button button-ghost-light" href={bioEntry.path}>Mehr über {author.slug === "redaktion" ? "unsere Redaktion" : firstName} <ArrowIcon /></Link>
        </div>
      ) : undefined}
      listTitle={<div className="mz-head"><p className="kicker">Alle Beiträge</p><h2>Geschrieben von <em>{firstName}</em></h2></div>}
      entries={entries}
    />
  );
}
