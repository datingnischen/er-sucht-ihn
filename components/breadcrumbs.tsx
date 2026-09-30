import Link from "next/link";

type Crumb = { name: string; path: string };

/** Semantische Brotkrumen; className ergänzt Varianten (z. B. hell auf dunklem Hero). */
export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  return <nav className={`breadcrumbs ${className}`.trim()} aria-label="Breadcrumb"><ol>{items.map((item, index) => <li key={item.path}>{index < items.length - 1 ? <Link href={item.path}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}</li>)}</ol></nav>;
}
