import NextLink from "next/link";
import type { ComponentProps } from "react";
import { withTrailingSlash } from "@/lib/site-contract.mjs";

type Props = ComponentProps<typeof NextLink>;

/**
 * next/link mit Schrägstrich am Ende interner Seitenpfade ("/magazin" → "/magazin/"). Nötig, weil
 * skipTrailingSlashRedirect die eingebaute Normalisierung von next/link abschaltet; ohne Slash kostet
 * jeder Klick eine 308-Umleitung (Seobility zählte 150 interne Weiterleitungen). Externe Links, Anker
 * und Dateien wie /agb.html bleiben unverändert.
 */
export default function Link({ href, ...props }: Props) {
  const normalized = typeof href === "string" && href.startsWith("/") && !href.startsWith("//") ? withTrailingSlash(href) : href;
  return <NextLink href={normalized} {...props} />;
}
