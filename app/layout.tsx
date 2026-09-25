import type { Metadata } from "next";
import "./globals.css";
import { Footer, Header } from "@/components/site-shell";
import { SITE_URL } from "@/lib/site";
import { staticAsset } from "@/lib/static-asset.mjs";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Er sucht Ihn – Männer kennenlernen",
  description: "Lerne schwule und bisexuelle Single-Männer kennen – sicher, persönlich und kostenlos.",
  openGraph: { type: "website", locale: "de_DE", siteName: "Er-sucht-Ihn.de" },
  // Icons liegen in public/brand und kommen vom Asset-Host, weil der nginx nur Seitenrouten durchreicht.
  icons: { icon: staticAsset("/brand/icon.png"), apple: staticAsset("/brand/apple-icon.png") },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body><Header />{children}<Footer /></body></html>;
}
