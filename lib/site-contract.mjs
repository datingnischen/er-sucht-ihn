export const SITE_URL = "https://er-sucht-ihn.de";
export const routeFamilies = ["partnersuche"];

export const legalLinks = Object.freeze({
  datenschutz: `${SITE_URL}/datenschutz.html`,
  impressum: `${SITE_URL}/impressum.html`,
  agb: `${SITE_URL}/agb.html`,
});

const platformRoots = new Set([
  "registration",
  "login",
  "suche",
  "hilfe",
  "kontakt",
  "gutschein",
  "datenschutz.html",
  "impressum.html",
  "agb.html",
  "unsere-erfolgsgeschichten.html",
  "sicherheit-und-datenschutz.html",
  "redaktionelle-kontrolle.html",
  "kostenlose-basis-mitgliedschaft.html",
  "dating-tipps",
]);

export function normalizePath(path = "/") {
  const pathname = path.split(/[?#]/, 1)[0] || "/";
  return pathname === "/" ? "/" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
}

export function classifyPath(path) {
  const normalized = normalizePath(path);
  if (/^\/partnersuche(\/|$)/.test(normalized)) return "location";
  const root = normalized.slice(1).split("/", 1)[0];
  if (platformRoots.has(root)) return "platform";
  return "editorial";
}

export function getLocationName(path) {
  const slug = normalizePath(path).split("/").filter(Boolean).at(-1) || "";
  const replacements = { ae: "ä", oe: "ö", ue: "ü" };
  const words = slug.split("-").map((word, index) => {
    const normalized = word.replace(/ae|oe|ue/g, (match) => replacements[match]);
    return index > 0 && ["am", "an", "der", "im"].includes(normalized)
      ? normalized
      : normalized.charAt(0).toUpperCase() + normalized.slice(1);
  });
  return words.join(" ");
}

export function getRegistrationUrl(path = "/") {
  const aid = classifyPath(path) === "location" ? "location" : "magazin";
  return `${SITE_URL}/registration/?AID=${aid}`;
}

export function isMigratedPath(path) {
  return classifyPath(path) !== "platform";
}
