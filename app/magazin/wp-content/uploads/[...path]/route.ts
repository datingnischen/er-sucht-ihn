import { getLegacyMagazineAsset } from "@/lib/magazine";

type Props = { params: Promise<{ path: string[] }> };

async function redirectLegacyAsset(_request: Request, { params }: Props) {
  const { path } = await params;
  const legacyPath = `/magazin/wp-content/uploads/${path.join("/")}`;
  const target = getLegacyMagazineAsset(legacyPath);
  if (!target) return new Response("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  return new Response(null, { status: 308, headers: { Location: target, "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable" } });
}

export const GET = redirectLegacyAsset;
export const HEAD = redirectLegacyAsset;
