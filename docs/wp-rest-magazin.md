# WordPress-kompatibler Magazin-Endpunkt (für ICONY)

ICONY liest auf der Plattform-Startseite drei Magazin-Teaser über das WordPress-Format. Das WordPress ist abgelöst; die App liefert denselben Endpunkt aus `data/magazine.json` (Code: `lib/wp-rest-compat.ts`).

## URLs

- Live: `https://er-sucht-ihn.de/magazin/wp-json/wp/v2/posts?per_page=3&_embed` (ohne Schrägstrich am Ende, antwortet direkt mit 200)
- Ohne schöne Permalinks: `/magazin/?rest_route=/wp/v2/posts` und `/magazin/index.php?rest_route=/wp/v2/posts`
- Prüf-URL auf Vercel: `https://er-sucht-ihn-two.vercel.app/magazin/wp-json/wp/v2/posts?per_page=3&_embed`
- Ressourcen: `posts` (+ `/<id>`), `categories`, `tags`, `media/<id>` (nur Beitragsbilder)
- Parameter: `per_page` (max. 100), `page`, `_embed` (`wp:featuredmedia`, `wp:term`), `_fields`, `orderby`, `order`, `categories`, `slug`, `search`, `include`, `after`, `before`
- Header: `Access-Control-Allow-Origin: *`, `X-WP-Total`, `X-WP-TotalPages`, `Cache-Control` (s-maxage 3600), `OPTIONS` und `HEAD` werden unterstützt

## Was ausgegeben wird

Nur Magazin-Beiträge (`type: post`). Keine Seiten, Städte, Lexikon-Beiträge. `/wp/v2/users`, `/wp/v2/pages` und alles Unbekannte antworten mit 404. `author` ist nur die ID, es gibt kein `_embedded.author`. `link` ist die kanonische Live-URL, Bild-URLs sind absolut (Asset-Host, siehe `lib/static-asset.mjs`), `alt_text` ist nie leer. Bildmaße stehen in `data/magazine-media-sizes.json` (neu erzeugen mit `node scripts/magazine-media-sizes.mjs`, wenn sich Medien ändern).

## Was ICONY im nginx an Vercel legen muss

Zusätzlich zu den bisherigen Seitenrouten:

- `/magazin/wp-json` (alle Pfade darunter, ohne Umschreiben, Methoden GET, HEAD, OPTIONS)
- `/magazin/index.php` und die Magazin-Startseite `/magazin/` mit Query `?rest_route=` (die Magazin-Seiten liegen ohnehin schon hinter dem nginx)

Der Upstream-Pfad bleibt unverändert, kein Länderpräfix. Bilder kommen absolut vom Vercel-Asset-Host, dafür braucht der nginx nichts.

## Schrägstrich-Ausnahme

Die App erzwingt sonst Schrägstriche am Pfadende (`trailingSlash: true`). Die eingebaute Umleitung ist abgeschaltet (`skipTrailingSlashRedirect`); `proxy.ts` leitet weiterhin 308 auf Pfade mit Schrägstrich um, nur `/magazin/wp-json/…` bleibt ausgenommen. Neue Routen ohne Schrägstrich am Ende gehören in `proxy.ts`.
