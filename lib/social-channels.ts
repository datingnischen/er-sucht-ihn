export type SocialPlatform = "facebook" | "youtube";

export type SocialChannel = {
  platform: SocialPlatform;
  name: string;
  handle: string;
  kind: string;
  text: string;
  cta: string;
  href: string;
  /** Official brand profile (listed in Organization.sameAs), not a community space. */
  profile: boolean;
};

export const socialChannels: SocialChannel[] = [
  { platform: "facebook", name: "Facebook-Seite", handle: "facebook.com/ersuchtihn", kind: "News & Themen", text: "Neuigkeiten, Community-Beiträge und Themen rund um Dating, Liebe und Beziehungen zwischen Männern.", cta: "Seite liken", href: "https://www.facebook.com/ersuchtihn/", profile: true },
  { platform: "facebook", name: "Facebook-Gruppe", handle: "Community-Gruppe", kind: "Austausch", text: "Tausche Dich mit anderen schwulen Männern aus, knüpfe Kontakte und teile Deine Erfahrungen.", cta: "Gruppe beitreten", href: "https://www.facebook.com/groups/130558014269848/", profile: false },
  { platform: "youtube", name: "YouTube", handle: "@Er-sucht-Ihn", kind: "Videos", text: "Videos, Erfahrungen und Tipps rund um schwules Dating, Partnerschaft und Beziehungen.", cta: "Kanal abonnieren", href: "https://www.youtube.com/@Er-sucht-Ihn", profile: true },
];

export const socialProfileUrls = socialChannels.filter((channel) => channel.profile).map((channel) => channel.href);
