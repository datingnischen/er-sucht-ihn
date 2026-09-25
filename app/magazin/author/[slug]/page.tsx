import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MagazineArchive } from "@/components/magazine-archive";
import { getMagazineAuthor, magazineAuthors, postsForMagazineAuthor } from "@/lib/magazine";

export const dynamicParams = false;
export function generateStaticParams() { return magazineAuthors.map(({ slug }) => ({ slug })); }
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = getMagazineAuthor((await params).slug);
  if (!author) return { robots: { index: false, follow: false } };
  return { title: `Beiträge von ${author.name}`, description: author.description || `Öffentliche Magazinbeiträge von ${author.name}.`, alternates: { canonical: `https://er-sucht-ihn.de/magazin/author/${author.slug}/` }, robots: { index: false, follow: true } };
}

export default async function AuthorPage({ params }: Props) {
  const author = getMagazineAuthor((await params).slug);
  if (!author) notFound();
  return <MagazineArchive kicker="Autor im Magazin" title={author.name} intro={author.description || `Alle öffentlichen Magazinbeiträge von ${author.name}.`} entries={postsForMagazineAuthor(author.id)} />;
}
