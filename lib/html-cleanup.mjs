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

// Seobility „Strukturproblem“: keine übersprungenen Ebenen (h2 → h4). Die H1 kommt aus der Vorlage, der Inhalt beginnt
// deshalb mit h2. Gleich tiefe Geschwister bleiben gleich tief (h2, h4, h4, h3 → h2, h3, h3, h3).
export function withoutHeadingSkips(html, base = 1) {
  const stack = [];
  let open = 0;
  return html.replace(/<(\/?)h([1-6])\b([^>]*)>/gi, (_match, close, levelText, attrs) => {
    // Überschriften verschachteln sich nicht: das schließende Tag gehört zur zuletzt geöffneten.
    if (close) return `</h${open}>`;
    const original = Number(levelText);
    while (stack.length && stack[stack.length - 1].original >= original) stack.pop();
    const parent = stack.length ? stack[stack.length - 1].level : base;
    open = Math.max(2, Math.min(original, parent + 1));
    stack.push({ original, level: open });
    return `<h${open}${attrs}>`;
  });
}

// Seobility „Probleme mit Strong-/Bold-Tags“ (viele, leere, zu lange, doppelte): im Importtext höchstens `max`
// Hervorhebungen als <strong>; weitere, doppelte und lange werden zu <span class="em-strong"> (gleiche Optik per CSS),
// leere entfallen. Sichtbarer Text bleibt unverändert.
export function limitStrong(html, max = 4) {
  const seen = new Set();
  let kept = 0;
  // Doppelt verschachtelt (<strong><strong>x</strong></strong>) erst glätten, sonst entsteht ungültiges HTML.
  let flat = html;
  for (let previous = ""; previous !== flat; ) {
    previous = flat;
    flat = flat.replace(/<(strong|b)\b([^>]*)>(\s*)<(?:strong|b)\b[^>]*>([\s\S]*?)<\/(?:strong|b)>(\s*)<\/\1>/gi, "<$1$2>$3$4$5</$1>");
  }
  return flat.replace(/<(strong|b)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (match, _tag, attrs, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&nbsp;| /g, " ").replace(/\s+/g, " ").trim();
    // Leer: Tag entfällt, ein enthaltenes Leerzeichen bleibt (sonst kleben die Nachbarwörter zusammen).
    if (!text) return inner.replace(/&nbsp;| /g, " ").trim() ? inner : /\s|&nbsp;/.test(inner) ? " " : "";
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
