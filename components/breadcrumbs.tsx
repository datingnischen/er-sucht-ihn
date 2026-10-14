import Link from "@/components/link";

type Crumb = { name: string; path: string; linked?: boolean };

/** Semantische Brotkrumen; className ergänzt Varianten (z. B. hell auf dunklem Hero). */
export function Breadcrumbs({ items, className = "" }: { items: Crumb[]; className?: string }) {
  return <nav className={`breadcrumbs ${className}`.trim()} aria-label="Breadcrumb"><ol>{items.map((item, index) => <li key={item.path}>{index === items.length - 1 ? <span aria-current="page">{item.name}</span> : item.linked === false ? <span>{item.name}</span> : <Link href={item.path}>{item.name}</Link>}</li>)}</ol></nav>;
}
