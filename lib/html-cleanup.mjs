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

// Seobility „Probleme mit Strong-/Bold-Tags“ (viele, leere, zu lange, doppelte): im Importtext höchstens `max`
// Hervorhebungen als <strong>; weitere, doppelte und lange werden zu <span class="em-strong"> (gleiche Optik per CSS),
// leere entfallen. Sichtbarer Text bleibt unverändert.
export function limitStrong(html, max = 4) {
  const seen = new Set();
  let kept = 0;
  return html.replace(/<(strong|b)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (match, _tag, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&nbsp;| /g, " ").replace(/\s+/g, " ").trim();
    if (!text) return inner.replace(/&nbsp;| /g, " ").trim() ? inner : "";
    const key = text.toLowerCase();
    const keep = kept < max && text.length <= 70 && !seen.has(key);
    seen.add(key);
    if (keep) { kept += 1; return match; }
    return `<span class="em-strong"${attrs.replace(/\sclass="[^"]*"/i, "")}>${inner}</span>`;
  });
}

// Tippfehler aus dem Import (Seobility „Seiten mit Tippfehlern“). Nur ganze Wörter im Text, nie in URLs/Dateinamen.
const TYPO_FIXES = [
  ["Giessen", "Gießen"], ["Seriösität", "Seriosität"], ["seriösität", "Seriosität"], ["Anwort", "Antwort"], ["anwort", "Antwort"],
  ["vorallem", "vor allem"], ["Vorallem", "Vor allem"], ["erfolgsversprechend", "erfolgversprechend"], ["Kaiserlautern", "Kaiserslautern"],
  ["Hobbies", "Hobbys"], ["hobbies", "Hobbys"], ["lizensiert", "lizenziert"],
];
export function fixTypos(text) {
  let out = text;
  // Wortgrenzen inkl. Umlaute; ein Punkt danach ist erlaubt (Satzende), aber nicht vor einer Dateiendung.
  for (const [from, to] of TYPO_FIXES) out = out.replace(new RegExp(`(?<![A-Za-zÄÖÜäöüß0-9/_.-])${from}(?![A-Za-zÄÖÜäöüß0-9/_-]|\\.[A-Za-z0-9])`, "g"), to);
  // Stamm mit beliebiger Endung (erfolgsversprechend, -e, -en …).
  return out.replace(/erfolgsversprechend/g, "erfolgversprechend");
}
