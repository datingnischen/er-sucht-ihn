import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MagazineArchive } from "@/components/magazine-archive";
import { MagazineCategoryIcon } from "@/components/magazine/category-icon";
import { readingMinutes, stripHtml } from "@/components/magazine/content";
import { MagazineMedia } from "@/components/magazine/magazine-card";
import { getMagazineCategory, magazineCategories, postsForMagazineCategory } from "@/lib/magazine";

export const dynamicParams = false;
export function generateStaticParams() { return magazineCategories.map(({ slug }) => ({ slug })); }
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getMagazineCategory((await params).slug);
  if (!category) return { robots: { index: false, follow: false } };
  return { title: `${category.name} im Er-sucht-Ihn Magazin`, description: stripHtml(category.description) || `Beiträge aus der Kategorie ${category.name}.`, alternates: { canonical: `https://er-sucht-ihn.de/magazin/kategorie/${category.slug}/` }, robots: { index: false, follow: true } };
}

export default async function CategoryPage({ params }: Props) {
  const category = getMagazineCategory((await params).slug);
  if (!category) notFound();
  const entries = postsForMagazineCategory(category.id);
  const years = entries.map((entry) => entry.date.slice(0, 4)).sort();
  const minutes = entries.reduce((sum, entry) => sum + readingMinutes(entry.contentHtml), 0);
  const cover = entries.find((entry) => entry.featuredImage);
  const description = stripHtml(category.description);
  return (
    <MagazineArchive
      kicker="Magazin-Thema"
      kickerIcon={<MagazineCategoryIcon slug={category.slug} />}
      title={category.name}
      crumb={category.name}
      intro={<p>{description || `Alle Beiträge aus der Kategorie ${category.name} – die neuesten zuerst.`}</p>}
      stats={[
        { value: entries.length, label: entries.length === 1 ? "Beitrag" : "Beiträge" },
        { value: `${minutes} Min.`, label: "Lesestoff" },
        ...(years.length ? [{ value: years[0] === years.at(-1) ? years[0] : `${years[0]}–${years.at(-1)}`, label: "Jahrgänge" }] : []),
      ]}
      visual={cover ? (
        <figure className="mz-hero-arch" aria-hidden="true">
          <MagazineMedia entry={cover} eager />
          <span className="mz-hero-arch-icon"><MagazineCategoryIcon slug={category.slug} /></span>
        </figure>
      ) : undefined}
      active={category.slug}
      entries={entries}
    />
  );
}
