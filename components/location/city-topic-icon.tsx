import type { SVGProps } from "react";
import {
  BoatIcon,
  BookIcon,
  CalendarIcon,
  CoffeeIcon,
  GlassIcon,
  HeartIcon,
  MountainIcon,
  MusicIcon,
  PeopleIcon,
  PhoneIcon,
  PinIcon,
  SparkIcon,
  TreeIcon,
} from "@/components/icons";

export type CityTopic =
  | "bar" | "event" | "food" | "nature" | "boat" | "mountain" | "online"
  | "culture" | "community" | "music" | "love" | "tip" | "sources" | "place";

const ICONS: Record<CityTopic, (props: SVGProps<SVGSVGElement>) => React.ReactElement> = {
  bar: GlassIcon,
  event: CalendarIcon,
  food: CoffeeIcon,
  nature: TreeIcon,
  boat: BoatIcon,
  mountain: MountainIcon,
  online: PhoneIcon,
  culture: BookIcon,
  community: PeopleIcon,
  music: MusicIcon,
  love: HeartIcon,
  tip: SparkIcon,
  sources: BookIcon,
  place: PinIcon,
};

/** Symbol je Kapitelthema (Stichwortregeln in lib/city-guide.mjs). */
export function CityTopicIcon({ topic, ...props }: { topic: string } & SVGProps<SVGSVGElement>) {
  const Icon = ICONS[topic as CityTopic] ?? PinIcon;
  return <Icon {...props} />;
}
