# Er-sucht-Ihn.de – Next.js/Vercel Migration

Die öffentliche Vercel-Ebene für Er-sucht-Ihn.de. Das Projekt bewahrt Markenidentität, Canonicals und öffentliche SEO-Routen. Login, Registrierung, Suche, Hilfe, Kontakt, Magazin und rechtliche Seiten bleiben auf der bestehenden ICONY-Plattform.

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

`scripts/import_public_pages.py` erzeugt aus der öffentlichen `sitemap.php` einen deterministischen redaktionellen Snapshot in `data/pages.json`. Dynamische Mitgliederprofile, Formulare und personalisierte Inhalte werden nicht gespeichert.

```bash
python scripts/import_public_pages.py
```

## Migrationsgrenzen

- Öffentliche redaktionelle Routen, das Lexikon und regionale Einstiege rendert Next.js.
- Login, Registrierung, Suche, Hilfe, Kontakt und rechtliche Seiten bleiben auf `https://er-sucht-ihn.de`.
- Standortseiten verwenden `AID=location`; andere redaktionelle Oberflächen `AID=magazin`.
- Das WordPress-Magazin bleibt zunächst auf `/magazin/` im bestehenden Quellsystem.

## Pflicht vor dem Domain-Cutover

Vor einem DNS-Cutover auf Vercel muss ein separater, von Vercel erreichbarer Legacy-Origin für Registrierung, Login, Suche, Hilfe, Kontakt, Legal und Magazin per Proxy/Rewrites verifiziert sein. Ohne diesen Origin darf die Hauptdomain nicht umgestellt werden, da diese Pfade sonst 404 liefern oder in eine Schleife geraten könnten.
