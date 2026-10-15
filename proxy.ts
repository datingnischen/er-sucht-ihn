import { NextResponse } from "next/server.js";
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

// Bewusst gelöschte Alt-Adressen (Entscheidung Christian, 2026-10-15): kein Lexikon mehr, Bewertungen & Erfahrungen
// stehen unter /ueber-uns/bewertungen/. „410 Gone“ statt Weiterleitung, damit Suchmaschinen die URLs entfernen.
const GONE = /^\/(?:lexikon|bewertungen-und-erfahrungen)(?:\/|$)/;

function gone() {
  return new NextResponse(
    '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Seite entfernt | Er sucht Ihn</title></head><body><h1>Diese Seite gibt es nicht mehr</h1><p><a href="/magazin/">Zum Magazin</a> · <a href="/ueber-uns/bewertungen/">Bewertungen &amp; Erfahrungen</a></p></body></html>',
    { status: 410, headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" } },
  );
}

export function proxy(request: NextRequest) {
  if (GONE.test(request.nextUrl.pathname)) return gone();
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
