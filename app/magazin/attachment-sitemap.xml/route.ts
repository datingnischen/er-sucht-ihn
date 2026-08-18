export const dynamic = "force-static";

export function GET() {
  return new Response("Attachment sitemap retired", {
    status: 410,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}
