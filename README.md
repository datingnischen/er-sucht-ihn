# Er-sucht-Ihn.de – Next.js/Vercel Migration

Die öffentliche Vercel-Ebene für Er-sucht-Ihn.de. Das Projekt bewahrt Markenidentität, Canonicals und öffentliche SEO-Routen. Das öffentliche WordPress-Magazin wird als geprüfter statischer Snapshot ausgeliefert; Login, Registrierung, Suche, Hilfe, Kontakt und rechtliche Seiten bleiben auf der bestehenden ICONY-Plattform.

## Lokal starten

```bash
npm ci
npm test
npm run dev
```

## Qualitätsprüfungen

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev
```

## Inhaltsimport

`scripts/import_public_pages.py` erzeugt aus der öffentlichen `sitemap.php` einen deterministischen redaktionellen Snapshot in `data/pages.json`. `scripts/import_magazine.py` übernimmt veröffentlichte WordPress-Beiträge, Seiten, öffentliche Byline- und Taxonomieinformationen sowie autorisierte Magazinmedien nach `data/magazine.json` und `public/magazine/media/`. Dynamische Mitgliederprofile, Formulare, Skripte, Embeds und personalisierte Inhalte werden nicht gespeichert.

```bash
python scripts/import_magazine.py
python scripts/import_public_pages.py
```

## Migrationsgrenzen

- Öffentliche redaktionelle Routen, das Lexikon, regionale Einstiege und das öffentliche Magazin rendert Next.js.
- Login, Registrierung, Suche, Hilfe, Kontakt und rechtliche Seiten bleiben auf `https://er-sucht-ihn.de`.
- Standortseiten verwenden `AID=location`; andere redaktionelle Oberflächen `AID=magazin`.
- WordPress-Admin, REST-API und sonstige CMS-Laufzeitpfade werden nicht von Next.js nachgebaut.
- Die WordPress-Quelle umfasst 52 Beiträge, 14 Seiten und 146 öffentliche Medien-Datensätze. Der reproduzierbare Snapshot übernimmt nur 90 redaktionell benötigte Medien: 52 verwaiste Altdateien – darunter frühere Kontaktanzeigenbilder – sowie vier eingebundene Plattform-Screenshots mit sichtbaren Mitgliederrastern oder sensiblen Profildaten werden aus Daten und Repository ausgeschlossen. Kategorien und Autoren bleiben zunächst `noindex, follow`; die 87 leeren WordPress-Tags werden nicht als dünne Archivseiten nachgebaut.
- Die bisherigen WordPress-URLs mit abschließendem Slash werden einmalig permanent auf die slashlosen Next.js-Canonicals weitergeleitet.
- Attachment-Seiten werden anhand eines exakten Manifests zum zugehörigen Beitrag oder lokalisierten Medium weitergeleitet; die frühere Attachment-Sitemap liefert bewusst `410 Gone`.

## Pflicht vor dem Domain-Cutover

Vor einem DNS-Cutover auf Vercel muss ein separater, von Vercel erreichbarer Legacy-Origin für Registrierung, Login, Suche, Hilfe, Kontakt, Legal sowie benötigte WordPress-Admin-/API-Pfade per Proxy/Rewrites verifiziert sein. Ohne diesen Origin darf die Hauptdomain nicht umgestellt werden, da diese Pfade sonst 404 liefern oder in eine Schleife geraten könnten.
