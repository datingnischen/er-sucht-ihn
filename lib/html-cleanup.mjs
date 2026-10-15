// Überschriften ohne Text aus dem Import (z. B. <h3>&nbsp;</h3>) entfernen; Seobility meldet sie als „leere Überschrift“.
export function withoutEmptyHeadings(html) {
  return html.replace(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (match, _level, inner) =>
    inner.replace(/<[^>]+>/g, "").replace(/&nbsp;| |\s/g, "") ? match : "");
}

// Zwischenüberschrift im Inhalt, die wörtlich die H1 wiederholt (Seobility „doppelte Überschrift“), entfällt; der Text darunter bleibt.
export function withoutH1Repeat(html, h1) {
  const plainH1 = String(h1 || "").replace(/<[^>]+>/g, "").trim().toLowerCase();
  if (!plainH1) return html;
  return html.replace(/<h([2-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (match, _level, inner) =>
    inner.replace(/<[^>]+>/g, "").replace(/&nbsp;| /g, " ").replace(/\s+/g, " ").trim().toLowerCase() === plainH1 ? "" : match);
}
