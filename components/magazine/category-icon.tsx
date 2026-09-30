import { BookIcon, ChatIcon, HeartIcon, MarsPairIcon, PhoneIcon, PinIcon, SparkIcon, TvIcon } from "@/components/icons";

const ICONS = {
  allgemeines: SparkIcon,
  "gay-dating": PhoneIcon,
  kontaktanzeigen: ChatIcon,
  news: BookIcon,
  ratgeber: HeartIcon,
  "tv-shows-fuer-gays": TvIcon,
  guide: PinIcon,
} as const;

/** Icon je Magazin-Kategorie; unbekannte Themen bekommen das Mars-Paar (⚣). */
export function MagazineCategoryIcon({ slug, className }: { slug?: string | null; className?: string }) {
  const Icon = (slug && ICONS[slug as keyof typeof ICONS]) || MarsPairIcon;
  return <Icon className={className} />;
}
