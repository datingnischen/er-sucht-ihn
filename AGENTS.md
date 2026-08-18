# Project rules

This is a Next.js 16 App Router migration of er-sucht-ihn.de.

- Preserve the live Er-sucht-Ihn brand and public URL canonicals.
- Keep registration, login, search, help, contact, and legal platform routes on the live ICONY domain until a verified legacy origin exists.
- Treat the public WordPress magazine as a deterministic local snapshot with explicit Next.js routes and localized media; do not recreate WordPress admin, REST, search, comments, or trackbacks.
- Location pages use `AID=location`; other editorial surfaces use `AID=magazin`.
- Public imports must exclude dynamic member data, forms, and personalized content.
- Read relevant local Next.js documentation from `node_modules/next/dist/docs/` before changing framework conventions.
