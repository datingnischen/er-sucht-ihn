export const SITE_URL = "https://er-sucht-ihn.de";
export const LIVE = SITE_URL;

export function classifyPath(path: string) {
  return /^\/partnersuche(\/|$)/.test(path) ? "location" : "editorial";
}

export function locationName(path: string) {
  const slug = path.split("/").filter(Boolean).at(-1) || "";
  const replacements: Record<string, string> = { ae: "ä", oe: "ö", ue: "ü" };
  return slug.split("-").map((word, index) => {
    const normalized = word.replace(/ae|oe|ue/g, (match) => replacements[match]);
    return index > 0 && ["am", "an", "der", "im"].includes(normalized)
      ? normalized
      : normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }).join(" ");
}

export function registrationUrl(path: string) {
  const aid = classifyPath(path) === "location" ? "location" : "magazin";
  return `${LIVE}/registration/?AID=${aid}`;
}

export const platform = {
  login: `${LIVE}/login/`,
  registration: `${LIVE}/registration/?AID=magazin`,
  search: `${LIVE}/suche/`,
  help: `${LIVE}/hilfe/`,
  privacy: `${LIVE}/datenschutz.html`,
  legal: `${LIVE}/impressum.html`,
  terms: `${LIVE}/agb.html`,
};
