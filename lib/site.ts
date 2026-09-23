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

/**
 * City-centre postcodes validated against OpenPLZ's German Localities API:
 * https://openplzapi.org/de/Localities
 *
 * These are deliberately independent of each page's ICONY widget `z` value,
 * which identifies the widget locality and can point to an outer district.
 * Emsland is a district rather than a city, so its configured representative
 * is 49716 Meppen, the district seat, also validated through OpenPLZ.
 */
export const CENTRAL_POSTCODES: Readonly<Record<string, string>> = Object.freeze({
  "/partnersuche/berlin": "10117",
  "/partnersuche/nordrhein-westfalen/köln": "50667",
  "/partnersuche/hessen/frankfurt": "60311",
  "/partnersuche/hamburg": "20095",
  "/partnersuche/hessen/kassel": "34117",
  "/partnersuche/sachsen-anhalt/magdeburg": "39104",
  "/partnersuche/baden-wuerttemberg/stuttgart": "70173",
  "/partnersuche/nordrhein-westfalen/bochum": "44787",
  "/partnersuche/niedersachsen/braunschweig": "38100",
  "/partnersuche/nordrhein-westfalen/bonn": "53111",
  "/partnersuche/bayern/nuernberg": "90402",
  "/partnersuche/sachsen/leipzig": "04109",
  "/partnersuche/bremen": "28195",
  "/partnersuche/nordrhein-westfalen/duesseldorf": "40213",
  "/partnersuche/bayern/muenchen": "80331",
  "/partnersuche/bayern/regensburg": "93047",
  "/partnersuche/niedersachsen/oldenburg": "26122",
  "/partnersuche/niedersachsen/hannover": "30159",
  "/partnersuche/nordrhein-westfalen/krefeld": "47798",
  "/partnersuche/niedersachsen/emsland": "49716",
  "/partnersuche/niedersachsen/cloppenburg": "49661",
  "/partnersuche/cottbus": "03046",
  "/partnersuche/baden-württemberg/freiburg": "79098",
  "/partnersuche/baden-württemberg/heilbronn": "74072",
  "/partnersuche/kaiserslautern": "67655",
  "/partnersuche/sachsen/dresden": "01067",
  "/partnersuche/koblenz": "56068",
  "/partnersuche/hessen/giessen": "35390",
  "/partnersuche/niedersachsen/hildesheim": "31134",
  "/partnersuche/sachsen/halberstadt": "38820",
  "/partnersuche/bayern/aschaffenburg": "63739",
  "/partnersuche/flensburg": "24937",
  "/partnersuche/augsburg": "86150",
  "/partnersuche/essen": "45127",
  "/partnersuche/duisburg": "47051",
  "/partnersuche/wuppertal": "42103",
  "/partnersuche/bielefeld": "33602",
  "/partnersuche/muenster": "48143",
});

export function citySearchUrl(
  path: string,
  postcodes: Readonly<Record<string, string>> = CENTRAL_POSTCODES,
) {
  const postcode = postcodes[path];
  if (postcode === undefined) {
    throw new Error(`Missing central postcode for ${path}`);
  }
  if (!/^\d{5}$/.test(postcode)) {
    throw new Error(`Invalid central postcode ${postcode} for ${path}`);
  }
  return `${LIVE}/suche/?plz=${postcode}&AID=location`;
}

export const platform = {
  login: `${LIVE}/login/`,
  registration: `${LIVE}/registration/?AID=magazin`,
  search: `${LIVE}/suche/`,
  help: `${LIVE}/hilfe/`,
  privacy: `${LIVE}/datenschutz.html`,
  legal: `${LIVE}/impressum.html`,
  terms: `${LIVE}/agb.html`,
  successStories: `${LIVE}/unsere-erfolgsgeschichten.html`,
  safety: `${LIVE}/sicherheit-und-datenschutz.html`,
  editorialControl: `${LIVE}/redaktionelle-kontrolle.html`,
  basicMembership: `${LIVE}/kostenlose-basis-mitgliedschaft.html`,
  datingTips: `${LIVE}/dating-tipps`,
};
