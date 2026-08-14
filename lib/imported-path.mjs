function decodeRouteSegment(part) {
  let decoded = part;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const next = decodeURIComponent(decoded);
    if (next === decoded) return decoded;
    decoded = next;
  }
  return decoded;
}

export function normalizeImportedPath(parts) {
  if (!parts?.length) return "/";
  try {
    return `/${parts.map(decodeRouteSegment).join("/")}`;
  } catch {
    return "/__invalid_imported_path__";
  }
}
