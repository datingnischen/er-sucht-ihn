const SITE_URL = "https://er-sucht-ihn.de";
const WEBSITE_ID = `${SITE_URL}/#website`;

export function serializePageEntityGraph(graph) {
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}

export function buildPageEntityGraph(page) {
  if (!page?.canonical?.startsWith(`${SITE_URL}/`) || !page.h1 || !page.description) {
    throw new TypeError("Page entities require a canonical public URL, name and description");
  }
  const webpage = {
    "@type": "WebPage",
    "@id": `${page.canonical}#webpage`,
    url: page.canonical,
    name: page.h1,
    description: page.description,
    inLanguage: "de-DE",
    isPartOf: { "@id": WEBSITE_ID },
  };
  return {
    "@context": "https://schema.org",
    "@graph": [{
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: `${SITE_URL}/`,
      name: "Er-sucht-Ihn.de",
      description: "Deutschsprachige Singlebörse für schwule und bisexuelle Männer.",
      inLanguage: "de-DE",
    }, webpage],
  };
}
