import Link from "next/link";

type RelatedCard = {
  path: string;
  title: string;
  location: string;
  image: { src: string; alt: string } | null;
  tone: number;
};

export function RelatedCardSection({ cards }: { cards: RelatedCard[] }) {
  if (!cards.length) return null;
  return <aside className="related related-visual">
    <p className="kicker">Weiter entdecken</p>
    <h2>Weitere passende Einstiege</h2>
    <div className="related-grid related-card-grid">
      {cards.map((card) => <Link className={`related-card related-card-tone-${card.tone}`} href={card.path} key={card.path}>
        <span className="related-card-media">
          {card.image ? <img src={card.image.src} alt={card.image.alt} loading="lazy" /> : <span className="related-card-fallback" aria-hidden="true" />}
        </span>
        <span className="related-card-copy">
          <small>Partnersuche in</small>
          <strong>{card.location}</strong>
          <span className="related-card-action">Stadt entdecken →</span>
        </span>
      </Link>)}
    </div>
  </aside>;
}
