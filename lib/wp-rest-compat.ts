import mediaSizes from "../data/magazine-media-sizes.json" with { type: "json" };
import catalog from "../data/magazine.json" with { type: "json" };
import { magazineCategories, magazinePosts, magazineTags, magazineWordpressIds } from "./magazine.ts";
import type { MagazineCategory, MagazineEntry } from "./magazine.ts";
import { SITE_URL } from "./site.ts";
import { staticAsset } from "./static-asset.mjs";

/**
 * WordPress-kompatibler REST-Endpunkt für die Magazin-BEITRÄGE, erzeugt aus data/magazine.json.
 *
 * Hintergrund: ICONY (Heiko Grossmann) liest auf den Plattform-Startseiten drei Magazin-Teaser über
 * <Domain>/magazin/wp-json/wp/v2/posts (WordPress-Format). Das WordPress ist abgelöst, der Endpunkt bleibt:
 * gleiche URL, gleiche Felder, aus den Dateien im Repo erzeugt.
 *
 * Ausgegeben werden NUR Magazin-Beiträge (type post aus dem WordPress-Katalog), samt Kategorien, Schlagwörtern und
 * Beitragsbildern. Keine Seiten, Städte, Lexikon-Beiträge oder Kontaktanzeigen. Bewusst NICHT vorhanden:
 * /wp/v2/users und /wp/v2/pages (404). `author` ist nur die ID, `_embedded.author` gibt es nicht.
 */

export const PUBLIC_ORIGIN = SITE_URL;
const SITE_NAME = "Er-sucht-Ihn.de - Magazin";
const FALLBACK_ALT = "Bild im Magazin von Er-sucht-Ihn.de";

export const WP_REST_HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=UTF-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-WP-Nonce, Content-Disposition, Content-MD5, Content-Type",
  "Access-Control-Expose-Headers": "X-WP-Total, X-WP-TotalPages, Link",
  "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
  "X-Robots-Tag": "noindex",
  "X-Content-Type-Options": "nosniff",
  Allow: "GET",
};

export type WpRestResponse = {
  status: number;
  body: unknown;
  headers: Record<string, string>;
};

type Json = Record<string, unknown>;
type Asset = { id: number; localPath: string; mimeType: string; alt: string };
type Term = { id: number; name: string; slug: string; count: number; description: string };

const DEFAULT_PER_PAGE = 10;
const MAX_PER_PAGE = 100;
const NAMESPACE_ROUTES = ["/wp/v2/posts", "/wp/v2/categories", "/wp/v2/tags", "/wp/v2/media"];
const REST_BASE = `${PUBLIC_ORIGIN}/magazin/wp-json/wp/v2`;

function error(status: number, code: string, message: string): WpRestResponse {
  return { status, body: { code, message, data: { status } }, headers: {} };
}

const NO_ROUTE = () => error(404, "rest_no_route", "Es wurde keine Route gefunden, die der URL und der Anfragemethode entspricht.");

// ---------------------------------------------------------------- Quelle: nur WordPress-Beiträge

const posts: MagazineEntry[] = magazinePosts.filter((entry) => entry.type === "post" && magazineWordpressIds.has(entry.id));
const assets = new Map<string, Asset>((catalog.assets as Asset[]).map((asset) => [staticAsset(asset.localPath), asset]));
const assetById = new Map<number, Asset>((catalog.assets as Asset[]).map((asset) => [asset.id, asset]));
const sizes = mediaSizes as Record<string, { width: number; height: number }>;

function countedTerms(source: MagazineCategory[], used: (entry: MagazineEntry) => { id: number }[]): Term[] {
  return source
    .map((term) => ({ ...term, description: term.description ?? "", count: posts.filter((entry) => used(entry).some((item) => item.id === term.id)).length }))
    .filter((term) => term.count > 0);
}
const categories = countedTerms(magazineCategories, (entry) => entry.categories);
const tags = countedTerms(magazineTags, (entry) => entry.tags);

function featuredAsset(entry: MagazineEntry): Asset | undefined {
  return entry.featuredImage ? assets.get(entry.featuredImage) : undefined;
}

/** Beitrag, der ein Medium als Beitragsbild nutzt (für Alt-Text-Fallback und `post` im Medienobjekt). */
function postUsing(asset: Asset): MagazineEntry | undefined {
  return posts.find((entry) => featuredAsset(entry)?.id === asset.id);
}

// ---------------------------------------------------------------- Hilfen

function absolute(url: string) {
  return /^https?:\/\//i.test(url) ? url : `${PUBLIC_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** WordPress-Datum ohne Zeitzone ist Ortszeit (Europe/Berlin); date_gmt ist UTC. */
export function toGmt(local: string): string {
  const base = Date.parse(`${local}Z`);
  if (!Number.isFinite(base)) return local;
  const berlinOffset = (instant: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Berlin", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(new Date(instant));
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    return Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second")) - instant;
  };
  const guess = base - berlinOffset(base);
  return new Date(base - berlinOffset(guess)).toISOString().slice(0, 19);
}

/** Relative Links im Inhalt absolut auf die Live-Domain, damit sie auch auf fremden Seiten (ICONY-Startseite) funktionieren. */
function absoluteContent(html: string) {
  return html.replace(/(\s(?:href|src)=["'])\/(?!\/)/g, `$1${PUBLIC_ORIGIN}/`);
}

const categoryLink = (term: Term) => `${PUBLIC_ORIGIN}/magazin/kategorie/${term.slug}/`;
const mediaSlug = (asset: Asset) => (asset.localPath.split("/").pop() || "").replace(/\.[^.]+$/, "").replace(/^\d+-/, "");

// ---------------------------------------------------------------- Objekte im WordPress-Format

function mediaObject(asset: Asset, fallbackAlt: string): Json {
  const url = absolute(staticAsset(asset.localPath));
  const size = sizes[String(asset.id)];
  const file = asset.localPath.split("/").pop() || "";
  const details: Json = {};
  if (size) {
    details.width = size.width;
    details.height = size.height;
    details.file = file;
    details.sizes = { full: { file, width: size.width, height: size.height, mime_type: asset.mimeType, source_url: url } };
  }
  const owner = postUsing(asset);
  return {
    id: asset.id,
    guid: { rendered: url },
    slug: mediaSlug(asset),
    status: "inherit",
    type: "attachment",
    link: url,
    title: { rendered: escapeHtml(mediaSlug(asset)) },
    author: owner?.author?.id ?? 0,
    comment_status: "closed",
    ping_status: "closed",
    template: "",
    meta: [],
    description: { rendered: "" },
    caption: { rendered: "" },
    alt_text: (asset.alt || "").trim() || fallbackAlt,
    media_type: "image",
    mime_type: asset.mimeType,
    media_details: details,
    post: owner?.id ?? null,
    source_url: url,
    _links: {
      self: [{ href: `${REST_BASE}/media/${asset.id}` }],
      collection: [{ href: `${REST_BASE}/media` }],
    },
  };
}

function termObject(term: Term, taxonomy: "category" | "post_tag"): Json {
  return {
    id: term.id,
    link: taxonomy === "category" ? categoryLink(term) : `${PUBLIC_ORIGIN}/magazin/`,
    name: term.name,
    slug: term.slug,
    taxonomy,
  };
}

function categoryObject(term: Term): Json {
  return {
    id: term.id,
    count: term.count,
    description: term.description,
    link: categoryLink(term),
    name: term.name,
    slug: term.slug,
    taxonomy: "category",
    parent: 0,
    meta: [],
    _links: {
      self: [{ href: `${REST_BASE}/categories/${term.id}` }],
      collection: [{ href: `${REST_BASE}/categories` }],
      "wp:post_type": [{ href: `${REST_BASE}/posts?categories=${term.id}` }],
    },
  };
}

function tagObject(term: Term): Json {
  return {
    id: term.id,
    count: term.count,
    description: term.description,
    link: `${PUBLIC_ORIGIN}/magazin/`,
    name: term.name,
    slug: term.slug,
    taxonomy: "post_tag",
    meta: [],
    _links: {
      self: [{ href: `${REST_BASE}/tags/${term.id}` }],
      collection: [{ href: `${REST_BASE}/tags` }],
    },
  };
}

function postObject(entry: MagazineEntry, embed: Set<string> | null): Json {
  const asset = featuredAsset(entry);
  const object: Json = {
    id: entry.id,
    date: entry.date,
    date_gmt: toGmt(entry.date),
    guid: { rendered: entry.canonical },
    modified: entry.modified || entry.date,
    modified_gmt: toGmt(entry.modified || entry.date),
    slug: entry.slug,
    status: "publish",
    type: "post",
    link: entry.canonical,
    title: { rendered: escapeHtml(entry.title) },
    content: { rendered: absoluteContent(entry.contentHtml), protected: false },
    excerpt: { rendered: `<p>${escapeHtml(entry.description)}</p>\n`, protected: false },
    author: entry.author?.id ?? 0,
    featured_media: asset ? asset.id : 0,
    comment_status: "closed",
    ping_status: "closed",
    sticky: false,
    template: "",
    format: "standard",
    meta: { footnotes: "" },
    categories: entry.categories.map((item) => item.id),
    tags: entry.tags.map((item) => item.id),
  };

  const links: Json = {
    self: [{ href: `${REST_BASE}/posts/${entry.id}` }],
    collection: [{ href: `${REST_BASE}/posts` }],
    about: [{ href: `${REST_BASE}/types/post` }],
  };
  if (asset) links["wp:featuredmedia"] = [{ embeddable: true, href: `${REST_BASE}/media/${asset.id}` }];
  links["wp:term"] = [
    { taxonomy: "category", embeddable: true, href: `${REST_BASE}/categories?post=${entry.id}` },
    { taxonomy: "post_tag", embeddable: true, href: `${REST_BASE}/tags?post=${entry.id}` },
  ];
  object._links = links;

  if (embed) {
    const embedded: Json = {};
    if (asset && embed.has("wp:featuredmedia")) embedded["wp:featuredmedia"] = [mediaObject(asset, entry.title)];
    if (embed.has("wp:term")) {
      embedded["wp:term"] = [
        entry.categories
          .map((item) => categories.find((term) => term.id === item.id))
          .filter((term): term is Term => Boolean(term))
          .map((term) => termObject(term, "category")),
        entry.tags
          .map((item) => tags.find((term) => term.id === item.id))
          .filter((term): term is Term => Boolean(term))
          .map((term) => termObject(term, "post_tag")),
      ];
    }
    if (Object.keys(embedded).length) object._embedded = embedded;
  }

  return object;
}

// ---------------------------------------------------------------- Parameter

function intParam(params: URLSearchParams, key: string, fallback: number, min: number, max: number) {
  const raw = params.get(key);
  if (raw === null || raw.trim() === "") return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function idList(params: URLSearchParams, key: string): number[] | null {
  const raw = params.getAll(key).flatMap((value) => value.split(","));
  if (!raw.length) return null;
  return raw.map((value) => Number.parseInt(value, 10)).filter((value) => Number.isFinite(value));
}

function embedSet(params: URLSearchParams): Set<string> | null {
  if (!params.has("_embed")) return null;
  const raw = params.get("_embed") ?? "";
  if (raw === "" || raw === "1" || raw === "true") return new Set(["wp:featuredmedia", "wp:term"]);
  if (raw === "0" || raw === "false") return null;
  return new Set(raw.split(",").map((value) => value.trim()));
}

function fieldPaths(params: URLSearchParams): string[] | null {
  const raw = params.get("_fields");
  if (!raw) return null;
  const paths = raw.split(",").map((value) => value.trim()).filter(Boolean);
  return paths.length ? paths : null;
}

function pickPaths(value: unknown, paths: string[][]): unknown {
  if (!paths.length) return value;
  if (Array.isArray(value)) return value.map((item) => pickPaths(item, paths));
  if (value === null || typeof value !== "object") return value;
  const source = value as Json;
  const out: Json = {};
  const wholeKeys = new Set(paths.filter((path) => path.length === 1).map((path) => path[0]));
  const nested = new Map<string, string[][]>();
  for (const path of paths) {
    if (path.length > 1) nested.set(path[0], [...(nested.get(path[0]) || []), path.slice(1)]);
  }
  for (const key of Object.keys(source)) {
    if (wholeKeys.has(key)) out[key] = source[key];
    else if (nested.has(key)) out[key] = pickPaths(source[key], nested.get(key) || []);
  }
  return out;
}

function applyFields(object: Json, fields: string[] | null): Json {
  if (!fields) return object;
  return pickPaths(object, fields.map((field) => field.split("."))) as Json;
}

function plain(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").toLowerCase();
}

/** Zeitpunkt für after/before: ohne Zeitzone wie WordPress als Ortszeit, sonst über das Datum. */
const stamp = (value: string) => value.replace(/Z$/, "");

type Collected = { items: MagazineEntry[]; total: number; totalPages: number };

function queryPosts(params: URLSearchParams): Collected {
  let items = posts.slice();

  const include = idList(params, "include");
  if (include) items = items.filter((entry) => include.includes(entry.id));
  const exclude = idList(params, "exclude");
  if (exclude) items = items.filter((entry) => !exclude.includes(entry.id));
  const slugs = params.getAll("slug").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  if (slugs.length) items = items.filter((entry) => slugs.includes(entry.slug));
  const authors = idList(params, "author");
  if (authors) items = items.filter((entry) => authors.includes(entry.author?.id ?? 0));
  const cats = idList(params, "categories");
  if (cats) items = items.filter((entry) => entry.categories.some((item) => cats.includes(item.id)));
  const catsExclude = idList(params, "categories_exclude");
  if (catsExclude) items = items.filter((entry) => !entry.categories.some((item) => catsExclude.includes(item.id)));
  const tagIds = idList(params, "tags");
  if (tagIds) items = items.filter((entry) => entry.tags.some((item) => tagIds.includes(item.id)));
  const search = params.get("search")?.trim().toLowerCase();
  if (search) {
    items = items.filter((entry) => `${plain(entry.title)} ${plain(entry.description)} ${plain(entry.contentHtml)}`.includes(search));
  }
  const after = params.get("after");
  if (after) items = items.filter((entry) => entry.date > stamp(after));
  const before = params.get("before");
  if (before) items = items.filter((entry) => entry.date < stamp(before));
  const modifiedAfter = params.get("modified_after");
  if (modifiedAfter) items = items.filter((entry) => (entry.modified || entry.date) > stamp(modifiedAfter));
  const modifiedBefore = params.get("modified_before");
  if (modifiedBefore) items = items.filter((entry) => (entry.modified || entry.date) < stamp(modifiedBefore));

  const filtered = Boolean(authors || cats || tagIds);
  const orderby = params.get("orderby") || "date";
  const direction = (params.get("order") || "desc").toLowerCase() === "asc" ? 1 : -1;
  const key = (entry: MagazineEntry): string | number => {
    switch (orderby) {
      case "modified": return entry.modified || entry.date;
      case "title": return entry.title.toLowerCase();
      case "slug": return entry.slug;
      case "id": return entry.id;
      case "author": return entry.author?.id ?? 0;
      case "include": return include ? include.indexOf(entry.id) : 0;
      default: return entry.date;
    }
  };
  items.sort((a, b) => {
    const left = key(a);
    const right = key(b);
    const order = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "de");
    // Wie WordPress: bei gleichem Datum ist die Reihenfolge ungefiltert ID absteigend, mit Autor-/Kategorie-/Schlagwort-Filter ID aufsteigend.
    return order * direction || (filtered ? a.id - b.id : b.id - a.id);
  });

  const total = items.length;
  const perPage = intParam(params, "per_page", DEFAULT_PER_PAGE, 1, MAX_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const offset = params.has("offset") ? intParam(params, "offset", 0, 0, Number.MAX_SAFE_INTEGER) : (intParam(params, "page", 1, 1, Number.MAX_SAFE_INTEGER) - 1) * perPage;
  return { items: items.slice(offset, offset + perPage), total, totalPages: total === 0 ? 0 : totalPages };
}

function collectionHeaders(route: string, params: URLSearchParams, total: number, totalPages: number): Record<string, string> {
  const page = intParam(params, "page", 1, 1, Number.MAX_SAFE_INTEGER);
  const headers: Record<string, string> = { "X-WP-Total": String(total), "X-WP-TotalPages": String(totalPages) };
  const link = (target: number) => {
    const next = new URLSearchParams(params);
    next.set("page", String(target));
    return `<${REST_BASE}/${route}?${next.toString()}>`;
  };
  const parts: string[] = [];
  if (page > 1) parts.push(`${link(page - 1)}; rel="prev"`);
  if (page < totalPages) parts.push(`${link(page + 1)}; rel="next"`);
  if (parts.length) headers.Link = parts.join(", ");
  return headers;
}

function postCollection(params: URLSearchParams): WpRestResponse {
  const { items, total, totalPages } = queryPosts(params);
  const page = intParam(params, "page", 1, 1, Number.MAX_SAFE_INTEGER);
  if (page > 1 && page > totalPages && !params.has("offset")) {
    return error(400, "rest_post_invalid_page_number", "Die angeforderte Seitennummer ist größer als die Anzahl der verfügbaren Seiten.");
  }
  const embed = embedSet(params);
  const fields = fieldPaths(params);
  return {
    status: 200,
    body: items.map((entry) => applyFields(postObject(entry, embed), fields)),
    headers: collectionHeaders("posts", params, total, totalPages),
  };
}

function termCollection(kind: "categories" | "tags", params: URLSearchParams): WpRestResponse {
  let rows = (kind === "categories" ? categories : tags).slice();
  const include = idList(params, "include");
  if (include) rows = rows.filter((row) => include.includes(row.id));
  const slugs = params.getAll("slug").flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  if (slugs.length) rows = rows.filter((row) => slugs.includes(row.slug));
  const post = idList(params, "post");
  if (post) {
    const entries = posts.filter((entry) => post.includes(entry.id));
    rows = rows.filter((row) => entries.some((entry) => (kind === "categories" ? entry.categories : entry.tags).some((item) => item.id === row.id)));
  }
  const orderby = params.get("orderby") || "name";
  const direction = (params.get("order") || "asc").toLowerCase() === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    const order = orderby === "count" ? a.count - b.count : orderby === "id" ? a.id - b.id : orderby === "slug" ? a.slug.localeCompare(b.slug) : a.name.localeCompare(b.name, "de");
    return order * direction;
  });
  const total = rows.length;
  const perPage = intParam(params, "per_page", DEFAULT_PER_PAGE, 1, MAX_PER_PAGE);
  const page = intParam(params, "page", 1, 1, Number.MAX_SAFE_INTEGER);
  const totalPages = total === 0 ? 0 : Math.ceil(total / perPage);
  const fields = fieldPaths(params);
  const make = kind === "categories" ? categoryObject : tagObject;
  return {
    status: 200,
    body: rows.slice((page - 1) * perPage, page * perPage).map((row) => applyFields(make(row), fields)),
    headers: collectionHeaders(kind, params, total, totalPages),
  };
}

// ---------------------------------------------------------------- Einstieg

/**
 * @param route  Pfad hinter /wp-json, z. B. "/wp/v2/posts" oder "/wp/v2/posts/1551" (mit oder ohne Slash am Ende)
 * @param params Query-Parameter der Anfrage
 */
export function handleWpRest(route: string, params: URLSearchParams): WpRestResponse {
  const normalized = `/${route.replace(/^\/+|\/+$/g, "")}`;
  const parts = normalized.split("/").filter(Boolean);

  if (normalized === "/") {
    return {
      status: 200,
      body: {
        name: SITE_NAME,
        description: "",
        url: PUBLIC_ORIGIN,
        home: PUBLIC_ORIGIN,
        namespaces: ["wp/v2"],
        authentication: {},
        routes: Object.fromEntries(NAMESPACE_ROUTES.map((path) => [path, { namespace: "wp/v2", methods: ["GET"] }])),
      },
      headers: {},
    };
  }

  if (parts[0] !== "wp" || parts[1] !== "v2") return NO_ROUTE();
  if (parts.length === 2) {
    return { status: 200, body: { namespace: "wp/v2", routes: NAMESPACE_ROUTES }, headers: {} };
  }

  const resource = parts[2];
  const idPart = parts[3];
  if (parts.length > 4) return NO_ROUTE();

  // Kein /users- und kein /pages-Endpunkt: Autoren gibt es nur als ID im Beitrag, Seiten sind keine Magazin-Beiträge.
  if (resource === "posts") {
    if (!idPart) return postCollection(params);
    const entry = /^\d+$/.test(idPart) ? posts.find((item) => item.id === Number(idPart)) : undefined;
    if (!entry) return error(404, "rest_post_invalid_id", "Ungültige Beitrags-ID.");
    return { status: 200, body: applyFields(postObject(entry, embedSet(params)), fieldPaths(params)), headers: {} };
  }

  if (resource === "categories" || resource === "tags") {
    if (!idPart) return termCollection(resource, params);
    const rows = resource === "categories" ? categories : tags;
    const row = /^\d+$/.test(idPart) ? rows.find((item) => item.id === Number(idPart)) : undefined;
    if (!row) return error(404, "rest_term_invalid", "Begriff existiert nicht.");
    const make = resource === "categories" ? categoryObject : tagObject;
    return { status: 200, body: applyFields(make(row), fieldPaths(params)), headers: {} };
  }

  // Nur Beitragsbilder der Beiträge; keine Liste der ganzen Mediathek.
  if (resource === "media" && idPart && /^\d+$/.test(idPart)) {
    const asset = assetById.get(Number(idPart));
    const owner = asset ? postUsing(asset) : undefined;
    if (!asset || !owner) return error(404, "rest_post_invalid_id", "Ungültige Beitrags-ID.");
    return { status: 200, body: applyFields(mediaObject(asset, owner.title || FALLBACK_ALT), fieldPaths(params)), headers: {} };
  }

  return NO_ROUTE();
}

/** Antwort als Response-Objekt inklusive CORS-, Cache- und WP-Headern. */
export function wpRestResponse(result: WpRestResponse, method = "GET"): Response {
  const headers = new Headers({ ...WP_REST_HEADERS, ...result.headers });
  if (result.status >= 400) headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
  const body = method === "HEAD" ? null : JSON.stringify(result.body);
  return new Response(body, { status: result.status, headers });
}

export function wpRestPreflight(): Response {
  const headers = new Headers(WP_REST_HEADERS);
  headers.set("Access-Control-Max-Age", "86400");
  return new Response(null, { status: 204, headers });
}
