# Anbieterberichte: Bewertungs-Snippets

Stand: 14. Oktober 2026. Trello: https://trello.com/c/PLLyTFJw

Elf bestehende Anbieterberichte besitzen eine sichtbare redaktionelle Bewertung in der Zeile „Gesamteindruck“. `lib/magazine-review.mjs` liest ausschließlich diese Zeile und ergänzt das bestehende Article-JSON-LD um SoftwareApplication mit einem einzelnen Review. Boytrap bleibt bei 3/5, Gay.de, GayParship, GayRoyal, Grindr, GROWLr, My-homo.net, Poppen.de, ROMEO, SCRUFF und Travesta bei 4/5.

Bewertung, Urheber, Skala und die konkrete kostenlose Einstiegsoption erscheinen zusätzlich im Artikel. Der Preis 0 bezeichnet ausschließlich diese Option; Premiumleistungen sind damit nicht als kostenlos ausgezeichnet. SCRUFFs kostenloser Download ist durch die verlinkte offizielle App-Store-Seite belegt. Die übrigen Einstiegsoptionen stammen aus dem bestehenden Artikeltext. Boytrap erhält keine Anbieter-URL, weil die aktuelle offizielle Domain nicht verifiziert werden konnte; die früheren .net-Adressen bleiben im importierten Text unverändert.

Keine neuen Bewertungen, Nutzerzahlen oder AggregateRating. Kein Review für unbewertete Texte, allgemeine Artikel, Vergleiche oder die eigene Plattform. Das neue Markup ist keine erneute praktische Prüfung der Anbieter; die bisherigen Bewertungswerte und Artikeldaten bleiben erhalten.

## Prüfungen

- Regressionstests prüfen die elf Werte, Verknüpfung von Article und SoftwareApplication, redaktionellen Urheber sowie Ausschluss fremder Sterne, fehlender Bewertungen und Vergleichsartikel.
- Erzeugtes HTML aller elf Seiten auf sichtbare Bewertung/Einstiegsoption und übereinstimmendes JSON-LD geprüft.
- Google Rich Results Test des erzeugten ROMEO-JSON-LD: gültiger Artikel, gültiges Rezensions-Snippet und gültige Software-App. Keine kritischen Fehler; optionale Angaben werden teilweise als Hinweise gemeldet.
- Testergebnis: https://search.google.com/test/rich-results/result?id=wHTN9ggGquGlgLvFD6KYug

## Google-Dokumentation

- https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- https://developers.google.com/search/docs/appearance/structured-data/software-app

Google entscheidet nach dem Crawling über die tatsächliche Darstellung. JSON-LD garantiert weder Sterne noch bessere Rankings. Eine spätere inhaltliche Überarbeitung sollte insbesondere alte Anbieterzahlen, Preise und Bewertungsgrundlagen prüfen; diese Aufgabe ergänzt die bestehende Auszeichnung, ohne einen neuen Testbericht zu behaupten.
