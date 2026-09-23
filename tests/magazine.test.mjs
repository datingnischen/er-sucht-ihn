import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const catalog = JSON.parse(await readFile(new URL("../data/magazine.json", import.meta.url), "utf8"));
const retiredLexicon = JSON.parse(await readFile(new URL("../data/magazine-lexikon.json", import.meta.url), "utf8")).entries;

const entries = catalog.entries;
const attachments = catalog.attachments;
const assets = catalog.assets;

test("magazine landing copy speaks directly to gay men without AI filler", async () => {
  const landing = await readFile(new URL("../app/magazin/page.tsx", import.meta.url), "utf8");
  const homepage = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const importer = await readFile(new URL("../scripts/import_magazine.py", import.meta.url), "utf8");
  const publicCopy = `${landing}\n${homepage}\n${importer}`;
  assert.doesNotMatch(publicCopy, /hilfreiche Einordnungen|neue Perspektiven|für Deine Orientierung|Wissen, Orientierung und Anregungen/i);
  assert.match(landing, /Dating, Liebe und schwules Leben/);
  assert.match(landing, /Leben als schwuler Mann/);
  assert.match(landing, /Gay-Dating, Beziehungen und Coming-out/);
  assert.match(homepage, /Dating, Liebe und schwules Leben/);
});

test("magazine snapshot contains the complete public editorial inventory", () => {
  assert.equal(entries.filter((entry) => entry.type === "post").length, 52);
  assert.equal(entries.filter((entry) => entry.type === "page").length, 14);
  assert.equal(entries.length, 66);
  assert.equal(catalog.sourceCounts.media, 146);
  assert.equal(assets.length, 90);
  assert.equal(attachments.length, 90);
  assert.equal(new Set(entries.map((entry) => entry.path)).size, 66);
  assert.equal(new Set(attachments.map((entry) => entry.path)).size, 90);
});

test("magazine entries preserve public routes and canonical identity", () => {
  for (const entry of entries) {
    assert.equal(entry.path, `/magazin/${entry.slug}`);
    assert.equal(entry.canonical, `https://er-sucht-ihn.de${entry.path}`);
    assert.match(entry.title, /\S/);
    assert.match(entry.description, /\S/);
    assert.match(entry.contentHtml, /\S/);
    assert.equal(entry.status, "publish");
  }
});

test("magazine HTML is static, sanitized and independent of WordPress uploads", async () => {
  const html = entries.map((entry) => entry.contentHtml).join("\n");
  assert.doesNotMatch(html, /<(?:script|style|iframe|form|input|button|object|embed)\b/i);
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i);
  assert.doesNotMatch(html, /(?:src|href)=["'](?:javascript|data|vbscript):/i);
  assert.doesNotMatch(html, /(?:src|href)=["']https?:\/\/(?:www\.)?er-sucht-ihn\.de\/magazin\/wp-content\/uploads/i);
  assert.doesNotMatch(html, /cdn3\.icony-hosting\.de\/user-media/i);
  for (const asset of catalog.assets) {
    assert.match(asset.localPath, /^\/magazine\/media\//);
    assert.match(asset.sha256, /^[a-f0-9]{64}$/);
    await access(new URL(`../public${asset.localPath}`, import.meta.url));
  }
});

test("attachments resolve to migrated parent content or localized media", () => {
  const publicPaths = new Set(entries.map((entry) => entry.path));
  const assets = new Set(catalog.assets.map((asset) => asset.localPath));
  for (const attachment of attachments) {
    assert.ok(
      (attachment.targetType === "entry" && publicPaths.has(attachment.target)) ||
      (attachment.targetType === "asset" && assets.has(attachment.target)),
      `${attachment.path} has invalid target ${attachment.target}`,
    );
  }
});

test("menu points to the migrated magazine route", async () => {
  const shell = await readFile(new URL("../components/site-shell.tsx", import.meta.url), "utf8");
  assert.match(shell, /\["Magazin", "\/magazin"\]/);
  assert.doesNotMatch(shell, /\["Magazin", "https:\/\/er-sucht-ihn\.de\/magazin\/?"\]/);
});

test("homepage exposes the latest migrated magazine entries", async () => {
  const homepage = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(homepage, /magazinePosts\.slice\(0, 3\)/);
  assert.match(homepage, /href="\/magazin"/);
});

test("snapshot contains no orphaned or legacy member media", () => {
  const renderedMedia = entries.map((entry) => `${entry.featuredImage || ""} ${entry.contentHtml}`).join("\n");
  for (const asset of assets) {
    assert.match(renderedMedia, new RegExp(asset.localPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), asset.localPath);
  }
  const excludedSensitiveMediaIds = new Set([1844, 1862, 1868, 1888]);
  assert.deepEqual(assets.filter((asset) => excludedSensitiveMediaIds.has(asset.id)), []);
  assert.doesNotMatch(renderedMedia, /\/magazine\/media\/(?:1844|1862|1868|1888)-/);
});

test("localized assets preserve exact legacy upload compatibility paths", () => {
  const paths = assets.flatMap((asset) => asset.legacyPaths || []);
  assert.ok(paths.length >= assets.length);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.every((path) => path.startsWith("/magazin/wp-content/uploads/")));
});

test("all retained internal magazine links resolve to migrated content or archives", () => {
  const owned = new Set([...entries, ...retiredLexicon].map((entry) => entry.path));
  const categories = new Set(catalog.categories.map((category) => `/magazin/kategorie/${category.slug}`));
  const unresolved = [];
  for (const entry of [...entries, ...retiredLexicon]) {
    for (const match of entry.contentHtml.matchAll(/href="(\/[^"#?]+)["?#]/g)) {
      const path = decodeURI(match[1]).replace(/\/$/, "");
      if (path.startsWith("/magazin/") && !owned.has(path) && !categories.has(path) && !path.startsWith("/magazine/media/")) {
        unresolved.push([entry.path, path]);
      }
    }
  }
  assert.deepEqual(unresolved, []);
});

test("public magazine taxonomies are represented without indexing stale tags", () => {
  assert.equal(catalog.categories.length, 6);
  assert.equal(catalog.authors.length, 2);
  assert.ok(catalog.tags.every((tag) => tag.count === 0));
});
