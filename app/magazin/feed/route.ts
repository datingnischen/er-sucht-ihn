import { magazinePosts } from "@/lib/magazine";

export const dynamic = "force-static";

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function GET() {
  const items = magazinePosts.slice(0, 30).map((entry) => `  <item>\n    <title>${escapeXml(entry.title)}</title>\n    <link>${escapeXml(entry.canonical)}</link>\n    <guid isPermaLink="true">${escapeXml(entry.canonical)}</guid>\n    <pubDate>${new Date(entry.date).toUTCString()}</pubDate>\n    <description>${escapeXml(entry.description)}</description>\n  </item>`).join("\n");
  const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>\n  <title>Er-sucht-Ihn Magazin</title>\n  <link>https://er-sucht-ihn.de/magazin</link>\n  <description>Dating, Liebe und queeres Leben für Männer, die Männer lieben.</description>\n${items}\n</channel></rss>\n`;
  return new Response(rss, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
