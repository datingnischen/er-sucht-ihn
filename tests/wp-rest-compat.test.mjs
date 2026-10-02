import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { handleWpRest, toGmt, wpRestPreflight, wpRestResponse } from "../lib/wp-rest-compat.ts";

const root = new URL("../", import.meta.url);
const source = (path) => readFileSync(new URL(path, root), "utf8");
const catalog = JSON.parse(source("data/magazine.json"));
const catalogPosts = catalog.entries.filter((entry) => entry.type === "post");
const get = (route, query = "") => handleWpRest(route, new URLSearchParams(query));
const ORIGIN = "https://er-sucht-ihn.de";

test("posts: Teaser-Abruf wie bei ICONY liefert drei Beiträge im WordPress-Format mit Gesamtzahl-Headern", () => {
  const result = get("/wp/v2/posts", "per_page=3&_embed=1&orderby=date&order=desc");
  assert.equal(result.status, 200);
  assert.equal(result.body.length, 3);
  assert.equal(result.headers["X-WP-Total"], String(catalogPosts.length));
  assert.equal(result.headers["X-WP-TotalPages"], String(Math.ceil(catalogPosts.length / 3)));
  assert.match(result.headers.Link, /rel="next"/);

  const [first, second] = result.body;
  assert.ok(first.date >= second.date, "neueste zuerst");
  for (const post of result.body) {
    for (const key of ["id", "date", "date_gmt", "modified", "modified_gmt", "slug", "status", "type", "link", "title", "excerpt", "content", "featured_media", "categories", "tags", "author", "_links"]) {
      assert.ok(key in post, `${post.slug}: ${key}`);
    }
    assert.equal(post.status, "publish");
    assert.equal(post.type, "post");
    assert.equal(typeof post.title.rendered, "string");
    assert.match(post.excerpt.rendered, /^<p>.+<\/p>/s);
    assert.ok(post.content.rendered.length > 200);
    assert.equal(typeof post.author, "number", "author nur als ID");
    assert.ok(Array.isArray(post.categories) && post.categories.length > 0);
    assert.ok(post.link.startsWith(`${ORIGIN}/magazin/`), "kanonische Live-URL, nicht vercel.app");
    assert.doesNotMatch(JSON.stringify(post), /vercel\.app\/magazin|localhost/);
    assert.equal(post._embedded.author, undefined, "keine eingebetteten Autoren");
    assert.ok(post._embedded["wp:term"][0].length > 0);

    if (post.featured_media) {
      const media = post._embedded["wp:featuredmedia"][0];
      assert.equal(media.id, post.featured_media);
      assert.match(media.source_url, /^https?:\/\/[^/]+\/.*magazine\/media\//, "absolute Bild-URL");
      assert.ok(media.media_details.width > 0 && media.media_details.height > 0);
      assert.ok(media.alt_text.trim(), "Alt-Text nie leer");
    }
  }
});

test("Inhalte: relative Links im Beitragstext sind absolut, nur Beiträge (type post) ohne Lexikon", () => {
  const all = get("/wp/v2/posts", "per_page=100").body;
  assert.equal(all.length, catalogPosts.length);
  assert.deepEqual(new Set(all.map((post) => post.id)), new Set(catalogPosts.map((post) => post.id)));
  assert.ok(all.every((post) => post.id < 900000), "Lexikon-Beiträge bleiben draußen");
  assert.ok(all.every((post) => post.type === "post"));
  for (const post of all) {
    assert.doesNotMatch(post.content.rendered, /\s(?:href|src)=["']\/(?!\/)/, `${post.slug}: relative Links`);
  }
  // Seiten (type page) sind nicht über posts abrufbar
  const page = catalog.entries.find((entry) => entry.type === "page");
  assert.equal(get(`/wp/v2/posts/${page.id}`).status, 404);
  assert.equal(get("/wp/v2/posts", `slug=${page.slug}`).body.length, 0);
});

test("posts: _fields, slug, categories, order, Zeitfilter und Paginierung verhalten sich wie WordPress", () => {
  const slim = get("/wp/v2/posts", "per_page=2&_fields=id,link,title.rendered,excerpt");
  assert.deepEqual(Object.keys(slim.body[0]).sort(), ["excerpt", "id", "link", "title"]);
  assert.deepEqual(Object.keys(slim.body[0].title), ["rendered"]);

  const embedded = get("/wp/v2/posts", "per_page=1&_embed&_fields=id,_embedded");
  assert.deepEqual(Object.keys(embedded.body[0]).sort(), ["_embedded", "id"]);

  const target = catalogPosts[0];
  const bySlug = get("/wp/v2/posts", `slug=${target.slug}`);
  assert.equal(bySlug.body.length, 1);
  assert.equal(bySlug.body[0].slug, target.slug);
  assert.equal(bySlug.headers["X-WP-Total"], "1");
  assert.equal(get("/wp/v2/posts", `include=${target.id}`).body[0].id, target.id);

  const category = get("/wp/v2/categories", "per_page=100").body[0];
  const inCategory = get("/wp/v2/posts", `categories=${category.id}&per_page=100`);
  assert.equal(inCategory.body.length, category.count);
  assert.ok(inCategory.body.every((post) => post.categories.includes(category.id)));

  const ascending = get("/wp/v2/posts", "orderby=date&order=asc&per_page=2").body;
  assert.ok(ascending[0].date <= ascending[1].date);
  const newest = get("/wp/v2/posts", "per_page=1").body[0];
  assert.equal(get("/wp/v2/posts", `after=${newest.date}`).body.length, 0);
  assert.equal(get("/wp/v2/posts", `before=${newest.date}&per_page=100`).body.length, catalogPosts.length - 1);
  assert.ok(get("/wp/v2/posts", `search=${encodeURIComponent(target.title.split(" ")[1] || target.title)}`).body.length >= 1);

  const page2 = get("/wp/v2/posts", "per_page=10&page=2");
  assert.equal(page2.body.length, 10);
  assert.match(page2.headers.Link, /rel="prev"/);
  assert.equal(get("/wp/v2/posts", "per_page=10&page=99").status, 400);
  assert.equal(get("/wp/v2/posts", "per_page=500").body.length, Math.min(100, catalogPosts.length), "per_page wird auf 100 begrenzt");
});

test("date_gmt rechnet die Berliner Ortszeit in UTC um (Sommer- und Winterzeit)", () => {
  assert.equal(toGmt("2021-01-18T14:02:01"), "2021-01-18T13:02:01");
  assert.equal(toGmt("2021-07-18T14:02:01"), "2021-07-18T12:02:01");
});

test("einzelne Beiträge, Kategorien, Schlagwörter und Beitragsbilder sind abrufbar, Unbekanntes antwortet 404", () => {
  const withImage = get("/wp/v2/posts", "per_page=100").body.find((post) => post.featured_media);
  const single = get(`/wp/v2/posts/${withImage.id}`, "_embed");
  assert.equal(single.status, 200);
  assert.equal(single.body.slug, withImage.slug);
  assert.ok(single.body._embedded["wp:featuredmedia"][0].source_url);
  assert.equal(get("/wp/v2/posts/999999").status, 404);

  const media = get(`/wp/v2/media/${withImage.featured_media}`);
  assert.equal(media.status, 200);
  assert.equal(media.body.id, withImage.featured_media);
  assert.ok(media.body.alt_text.trim());
  assert.match(media.body.source_url, /^https?:\/\//);
  assert.equal(get("/wp/v2/media/1").status, 404, "nur Beitragsbilder");
  assert.equal(get("/wp/v2/media").status, 404, "keine Mediathek-Liste");

  const categories = get("/wp/v2/categories", "per_page=100");
  assert.ok(categories.body.length > 0 && categories.body.every((category) => category.count > 0));
  assert.equal(get(`/wp/v2/categories/${categories.body[0].id}`).body.slug, categories.body[0].slug);
  assert.equal(get("/wp/v2/categories/999999").status, 404);
  assert.equal(get("/wp/v2/tags", "per_page=100").status, 200);
  assert.equal(get("/wp/v2/posts/trailing/slash/too/deep").status, 404);
  assert.equal(get("/wp/v2/types").status, 404);
  assert.equal(get("/foo/v1/bar").status, 404);
});

test("Seiten, Autoren und Unbekanntes antworten 404; Autoren nur als ID, kein Name oder Avatar in irgendeiner Antwort", () => {
  for (const route of ["/wp/v2/users", "/wp/v2/users/1", "/wp/v2/users/me", "/wp/v2/pages", "/wp/v2/pages/1", "/wp/v2/comments", "/wp/v2/settings"]) {
    const result = get(route);
    assert.equal(result.status, 404, route);
    assert.equal(result.body.code, "rest_no_route", route);
  }
  assert.equal(get("/wp/v2/users", "search=Redaktion").status, 404);

  const all = JSON.stringify(get("/wp/v2/posts", "per_page=100&_embed&_fields=id,author,_embedded,_links").body);
  assert.doesNotMatch(all, /gravatar|avatar_urls|\/users\//);
  for (const author of catalog.authors) {
    assert.ok(!all.includes(`"${author.name}"`), `Autorenname ${author.name} in der Ausgabe`);
  }
  assert.doesNotMatch(JSON.stringify(get("/").body), /users|pages/);
  assert.doesNotMatch(JSON.stringify(get("/wp/v2").body), /users|pages/);
});

test("Antwort-Header: CORS offen, Cache-Header, JSON, noindex; OPTIONS und HEAD funktionieren", async () => {
  const response = wpRestResponse(get("/wp/v2/posts", "per_page=3"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.match(response.headers.get("access-control-expose-headers"), /X-WP-Total, X-WP-TotalPages/);
  assert.match(response.headers.get("cache-control"), /s-maxage=3600/);
  assert.match(response.headers.get("content-type"), /^application\/json/);
  assert.equal(response.headers.get("x-wp-total"), String(catalogPosts.length));
  assert.equal(response.headers.get("x-wp-totalpages"), String(Math.ceil(catalogPosts.length / 3)));
  assert.equal(response.headers.get("x-robots-tag"), "noindex");
  assert.equal((await response.json()).length, 3);

  const notFound = wpRestResponse(get("/wp/v2/users"));
  assert.equal(notFound.status, 404);
  assert.equal(notFound.headers.get("access-control-allow-origin"), "*");

  const head = wpRestResponse(get("/wp/v2/posts"), "HEAD");
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("x-wp-total"), String(catalogPosts.length));

  const preflight = wpRestPreflight();
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "*");
});

test("Beitragsbilder: Maße ermittelt, absolute URLs, Alt-Text nie leer", () => {
  const media = get("/wp/v2/posts", "per_page=100&_embed&_fields=id,featured_media,_embedded").body
    .filter((post) => post.featured_media)
    .map((post) => post._embedded["wp:featuredmedia"][0]);
  assert.ok(media.length > 0);
  for (const item of media) {
    assert.match(item.source_url, /^https?:\/\//);
    assert.ok(item.media_details.width > 0 && item.media_details.height > 0, item.source_url);
    assert.ok(item.alt_text.trim(), item.source_url);
  }
});

test("Routen: wp-json, /magazin/index.php?rest_route= und /magazin/?rest_route= sind verdrahtet, Slash-Ausnahme im proxy", () => {
  const wpJson = source("app/magazin/wp-json/[[...route]]/route.ts");
  assert.match(wpJson, /handleWpRest\(`\/\$\{route\.join\("\/"\)\}`/);
  assert.match(wpJson, /export function OPTIONS/);
  assert.match(wpJson, /export const HEAD/);
  const indexPhp = source("app/magazin/index.php/route.ts");
  assert.match(indexPhp, /params\.get\("rest_route"\)/);
  assert.match(indexPhp, /params\.delete\("rest_route"\)/);

  const proxy = source("proxy.ts");
  assert.match(proxy, /\/magazin\/wp-json/);
  assert.match(proxy, /searchParams\.has\("rest_route"\)/);
  assert.match(proxy, /\/magazin\/index\.php/);
  assert.match(source("next.config.ts"), /skipTrailingSlashRedirect: true/);

  const lib = source("lib/wp-rest-compat.ts");
  assert.doesNotMatch(lib, /resource === "users"|resource === "pages"|"\/wp\/v2\/users"|"\/wp\/v2\/pages"/);
  // wp-json bleibt aus Sitemaps, Archiv und Suche draußen
  for (const path of ["app/sitemap.ts", "app/magazin/sitemap.xml/route.ts", "app/magazin/archiv/page.tsx", "lib/site-search-index.ts"]) {
    assert.doesNotMatch(source(path), /wp-json|wp-rest-compat/, path);
  }
});
