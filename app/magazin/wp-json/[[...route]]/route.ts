import { handleWpRest, wpRestPreflight, wpRestResponse } from "@/lib/wp-rest-compat";
import { isTeaserImageRoute, teaserImageResponse } from "@/lib/teaser-image";

// WordPress-kompatibler REST-Endpunkt (aus data/magazine.json erzeugt), siehe lib/wp-rest-compat.ts.
// Die URL bleibt wie im früheren WordPress: https://er-sucht-ihn.de/magazin/wp-json/wp/v2/posts
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ route?: string[] }> };

export async function GET(request: Request, context: RouteContext) {
  const { route = [] } = await context.params;
  // Teaserbilder für ICONY ohne Dateiendung (lib/teaser-image.ts)
  if (isTeaserImageRoute(route)) return teaserImageResponse(route, request.method);
  const result = handleWpRest(`/${route.join("/")}`, new URL(request.url).searchParams);
  return wpRestResponse(result, request.method);
}

export const HEAD = GET;

export function OPTIONS() {
  return wpRestPreflight();
}
