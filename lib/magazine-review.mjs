// Explicit provider inventory: never turn general articles or ranking tables into reviews.
const providers = {
  // Legacy article mentions several .net hosts; no current official host verified.
  boytrap: { name: "Boytrap", free: "Kostenlose Kontaktanzeigen" },
  "gay-de": { name: "Gay.de", url: "https://www.gay.de/", free: "Kostenlose Basis-Mitgliedschaft" },
  gayparship: { name: "GayParship", url: "https://www.gayparship.de/", free: "Kostenlose Basis-Mitgliedschaft" },
  gayroyal: { name: "GayRoyal", url: "https://gayroyal.com/", free: "Kostenloser App-Download" },
  grindr: { name: "Grindr", url: "https://www.grindr.com/", free: "Kostenlose Basis-Version" },
  growlr: { name: "GROWLr", url: "https://www.growlr.com/", free: "Kostenlose Basisfunktionen" },
  "my-homo": { name: "My-homo.net", url: "https://my-homo.net/", free: "Kostenlose Nutzung für private Nutzer" },
  "poppen-de": { name: "Poppen.de", url: "https://www.poppen.de/", free: "Kostenlose Basis-Mitgliedschaft" },
  "romeo-com": { name: "ROMEO", url: "https://www.romeo.com/", free: "Kostenlose Basis-Version" },
  // Free download with in-app purchases: official App Store listing, checked 2026-10-14.
  scruff: { name: "SCRUFF", url: "https://www.scruff.com/", free: "Kostenloser App-Download", source: "https://apps.apple.com/us/app/scruff-gay-dating-chat/id380015247" },
  travesta: { name: "Travesta", url: "https://www.travesta.de/", free: "Kostenlose Anmeldung" },
};

/** Only the existing provider's Gesamteindruck row supplies a score. */
export function magazineReview(entry) {
  const provider = Object.hasOwn(providers, entry.slug) ? providers[entry.slug] : null;
  if (!provider || entry.type !== "post" || !entry.author?.name) return null;
  const row = entry.contentHtml.match(/<tr\b[^>]*>\s*<td\b[^>]*>\s*(?:<strong>)?Gesamteindruck:\s*(?:<\/strong>)?\s*<\/td>\s*<td\b[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/i);
  const stars = row?.[1].match(/★+/)?.[0];
  if (!stars || stars.length > 5) return null;
  const rating = stars.length;
  const summary = `Redaktionelle Bewertung von ${provider.name}: ${rating} von 5 Sternen. Bewertet von ${entry.author.name}.`;
  return { ...provider, rating, summary };
}

/** Keep Article/WebPage data; add one reviewed software offering only where rated. */
export function buildMagazineSchema(entry, siteUrl) {
  const canonical = entry.canonical.replace(/\/?$/, "/");
  const article = {
    "@type": entry.type === "post" ? "Article" : "WebPage",
    "@id": `${canonical}#article`,
    url: canonical,
    headline: entry.title,
    description: entry.description,
    datePublished: entry.date,
    dateModified: entry.modified,
    image: entry.featuredImage || undefined,
    author: entry.author ? { "@type": entry.author.slug === "redaktion" ? "Organization" : "Person", name: entry.author.name, url: `${siteUrl.replace(/\/$/, "")}/magazin/author/${entry.author.slug}/` } : undefined,
    isPartOf: { "@id": `${siteUrl}/#website` },
  };
  const rating = magazineReview(entry);
  if (!rating) return { "@context": "https://schema.org", ...article };
  const appId = `${canonical}#reviewed-application`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      { ...article, about: { "@id": appId } },
      {
        "@type": "SoftwareApplication",
        "@id": appId,
        name: rating.name,
        url: rating.url,
        applicationCategory: "SocialNetworkingApplication",
        image: entry.featuredImage || undefined,
        mainEntityOfPage: canonical,
        // This offer refers exclusively to the visible free entry option, not a premium subscription.
        offers: { "@type": "Offer", name: rating.free, price: 0, priceCurrency: "EUR", url: rating.source || rating.url },
        review: {
          "@type": "Review",
          "@id": `${canonical}#editorial-review`,
          url: canonical,
          name: entry.title,
          reviewBody: rating.summary,
          author: article.author,
          publisher: { "@type": "Organization", name: "Er-sucht-Ihn.de", url: siteUrl },
          datePublished: entry.date,
          reviewRating: { "@type": "Rating", ratingValue: rating.rating, bestRating: 5, worstRating: 1 },
        },
      },
    ],
  };
}
