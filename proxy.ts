import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withTrailingSlash } from "./lib/site-contract.mjs";

// Ersetzt die eingebaute Slash-Umleitung von Next.js (skipTrailingSlashRedirect in next.config.ts): Seitenpfade
// enden weiterhin auf "/" (308), nur der WordPress-kompatible REST-Endpunkt unter /magazin/wp-json bleibt
// ohne Schrägstrich erreichbar. ICONY ruft /magazin/wp-json/wp/v2/posts ohne Slash am Ende auf und folgt keiner
// Weiterleitung. Dateien (Pfad mit Endung) behalten ihre Form, ein Slash dahinter wird entfernt.
const REST_PREFIX = "/magazin/wp-json";
const FILE_WITH_SLASH = /^(?!\/\.well-known(?:\/|$))(?:\/[^/]+)*\/[^/]+\.\w+\/$/;

function trailingSlashRedirect(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === REST_PREFIX || pathname.startsWith(`${REST_PREFIX}/`)) return null;

  let target = pathname;
  if (FILE_WITH_SLASH.test(pathname)) target = pathname.replace(/\/+$/, "");
  else if (pathname.startsWith("/.well-known/")) return null;
  else target = withTrailingSlash(pathname);
  if (target === pathname) return null;

  // Plain URL statt nextUrl.clone(): NextURL normalisiert den Schrägstrich sonst selbst.
  const destination = new URL(request.nextUrl.href);
  destination.pathname = target;
  destination.search = search;
  return NextResponse.redirect(destination, 308);
}

export function proxy(request: NextRequest) {
  const slashRedirect = trailingSlashRedirect(request);
  if (slashRedirect) return slashRedirect;

  // WordPress ohne schöne Permalinks: /magazin/?rest_route=/wp/v2/posts. Die Magazin-Startseite ist eine Seite,
  // deshalb geht die Anfrage intern an den REST-Handler.
  const { pathname, searchParams } = request.nextUrl;
  if ((pathname === "/magazin" || pathname === "/magazin/") && searchParams.has("rest_route")) {
    const destination = new URL(request.nextUrl.href);
    destination.pathname = "/magazin/index.php";
    return NextResponse.rewrite(destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|app-assets|icon\.png|apple-icon\.png|favicon\.ico).*)"],
};
