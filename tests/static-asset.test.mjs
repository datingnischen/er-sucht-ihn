import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { absolutizeAssetUrls, assetBaseUrl, staticAsset } from "../lib/static-asset.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("public files load from the Vercel asset host", () => {
  assert.equal(assetBaseUrl, "https://er-sucht-ihn-two.vercel.app/app-assets");
  assert.equal(staticAsset("/brand/logo.svg"), "https://er-sucht-ihn-two.vercel.app/app-assets/brand/logo.svg");
  assert.equal(staticAsset("https://static2.icony-hosting.de/x.png"), "https://static2.icony-hosting.de/x.png");
});

test("imported HTML media point to the asset host, page links stay relative", () => {
  const html = '<a href="/magazine/media/a.jpg"><img src="/magazine/media/a.jpg" srcset="/magazine/media/a.jpg 1x, /magazine/media/b.jpg 2x"></a><a href="/magazin/foo">Foo</a>';
  const result = absolutizeAssetUrls(html);
  assert.doesNotMatch(result, /["\s]\/magazine\/media\//);
  assert.match(result, /src="https:\/\/er-sucht-ihn-two\.vercel\.app\/app-assets\/magazine\/media\/a\.jpg"/);
  assert.match(result, /, https:\/\/er-sucht-ihn-two\.vercel\.app\/app-assets\/magazine\/media\/b\.jpg 2x/);
  assert.match(result, /href="\/magazin\/foo"/);
});

test("next config serves build assets through the asset host", async () => {
  const config = await read("../next.config.ts");
  assert.match(config, /DEFAULT_ASSET_HOST = "https:\/\/er-sucht-ihn-two\.vercel\.app"/);
  assert.match(config, /assetPrefix: isDev \? undefined : `\$\{assetHost\}\$\{assetPathPrefix\}`/);
  assert.match(config, /source: `\$\{assetPathPrefix\}\/:path\*`, destination: "\/:path\*"/);
});

test("no component references public files root-relatively", async () => {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(new URL(dir, import.meta.url), { withFileTypes: true })) {
      const path = `${dir}${entry.name}`;
      if (entry.isDirectory()) await walk(`${path}/`);
      else if (/\.(tsx?|mjs)$/.test(entry.name)) files.push(path);
    }
  }
  await walk("../app/");
  await walk("../components/");
  for (const file of files) {
    assert.doesNotMatch(await read(file), /(?<!staticAsset\()["'`(]\/(brand|home|about|trust|magazine\/media)\//, file);
  }
});
