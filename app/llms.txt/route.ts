export const dynamic = "force-static";

const content = `# Er-sucht-Ihn.de

> Deutschsprachige Singlebörse und redaktionelles Informationsangebot für schwule und bisexuelle Männer.

Canonical: https://er-sucht-ihn.de/
Sitemap: https://er-sucht-ihn.de/sitemap.xml
Language: de-DE

## Öffentliche Inhaltsbereiche

- [Partnersuche in Deutschland](https://er-sucht-ihn.de/partnersuche): Regionale Einstiege und deutsche Städte.
- [Lexikon](https://er-sucht-ihn.de/lexikon): Begriffe rund um schwules Dating, Beziehungen und Community.

## Plattformgrenze

Registrierung, Login, Suche, Hilfe, Magazin und rechtliche Seiten bleiben Plattformfunktionen auf der Canonical-Domain. Die Sitemap enthält die öffentlich migrierten redaktionellen Seiten.
`;

export function GET() {
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
