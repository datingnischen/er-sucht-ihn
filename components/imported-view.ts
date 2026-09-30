import type { ImportedPage } from "@/lib/content";

type FaqGroup = { id: string; title: string; items: Array<{ id: string; question: string; answerHtml: string }> };

/** Gemeinsame Eingabe der Vorlagen für importierte ICONY-Seiten (siehe app/[...slug]/page.tsx). */
export type ImportedView = {
  page: ImportedPage;
  path: string;
  image: { src: string; alt: string } | undefined;
  /** Seiteninhalt ohne das bereits im Hero gezeigte Bild (bei Übersichten ohne alte Städteliste). */
  contentHtml: string;
  faq: { beforeHtml: string; groups: FaqGroup[]; afterHtml: string } | null;
  breadcrumbs: Array<{ name: string; path: string }>;
};
