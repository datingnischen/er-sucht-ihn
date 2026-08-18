#!/usr/bin/env python3
"""Create a deterministic, public-only snapshot of the Er-sucht-Ihn WordPress magazine."""
from __future__ import annotations

import hashlib
import json
import posixpath
import re
from pathlib import Path
from urllib.parse import unquote, urlencode, urljoin, urlparse

from bs4 import BeautifulSoup, Comment

try:
    from scripts.import_public_pages import FORBIDDEN_IMAGE_PATH, FetchPolicyError, _decode_path_fully, fetch
except ModuleNotFoundError:  # Direct execution: python scripts/import_magazine.py
    from import_public_pages import FORBIDDEN_IMAGE_PATH, FetchPolicyError, _decode_path_fully, fetch

SITE = "https://er-sucht-ihn.de"
MAGAZINE = f"{SITE}/magazin"
API = f"{MAGAZINE}/wp-json/wp/v2"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "magazine.json"
MEDIA_DIR = ROOT / "public" / "magazine" / "media"
SOURCE_HOSTS = {"er-sucht-ihn.de", "www.er-sucht-ihn.de"}
EXTERNAL_IMAGE_HOSTS = {"static-cms.icony-hosting.de", "static2.icony-hosting.de"}
PLATFORM_ROOTS = {
    "registration", "login", "suche", "hilfe", "kontakt", "gutschein",
    "datenschutz.html", "impressum.html", "agb.html",
}
KNOWN_PATH_FIXES = {
    "/magazin/tv-show-prince-charming-staffel-1": "/magazin/prince-charming-2019-staffel-1",
    "/magazin/tv-show-prince-charming-staffel-2": "/magazin/prince-charming-2020-staffel-2",
    "/magazin/tv-show-prince-charming-staffel-3": "/magazin/prince-charming-2021-staffel-3",
    "/magazin/geschlechtsumwandlung-alles-was-du-wissen-musst": "/magazin/geschlechtsumwandlung",
    "/partnersuche/bayern/münchen": "/partnersuche/bayern/muenchen",
}
ALLOWED_TAGS = {
    "a", "audio", "b", "blockquote", "br", "code", "div", "em", "figcaption",
    "figure", "h2", "h3", "h4", "hr", "i", "img", "li", "ol", "p", "pre",
    "section", "small", "source", "span", "strong", "table", "tbody", "td", "th",
    "thead", "tr", "ul",
}
DROP_TAGS = {"script", "style", "form", "input", "button", "object", "embed", "video", "svg"}
ALLOWED_MEDIA_MIMES = {"image/jpeg", "image/png", "image/gif", "image/webp", "audio/mpeg"}
MEDIA_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "audio/mpeg": ".mp3",
}
# Editorial screenshots that expose real member grids or sensitive profile data.
EXCLUDED_SENSITIVE_MEDIA_IDS = {1844, 1862, 1868, 1888}


def _plain(value: str) -> str:
    return " ".join(BeautifulSoup(value or "", "html.parser").get_text(" ", strip=True).split())


def _parse_url(value: str):
    try:
        return urlparse(value)
    except (TypeError, ValueError):
        return None


def _safe_authority(parsed) -> bool:
    if parsed is None or parsed.hostname is None or parsed.username is not None or parsed.password is not None:
        return False
    try:
        port = parsed.port
    except ValueError:
        return False
    return port in {None, 443 if parsed.scheme == "https" else 80}


def _media_key(value: str) -> str | None:
    parsed = _parse_url(value)
    if not _safe_authority(parsed) or parsed.scheme not in {"http", "https"}:
        return None
    if parsed.hostname.lower() not in SOURCE_HOSTS or not parsed.path.startswith("/magazin/wp-content/uploads/"):
        return None
    return f"https://er-sucht-ihn.de{parsed.path}"


def _safe_join(base: str, reference: str) -> str | None:
    try:
        joined = urljoin(base, reference)
    except (TypeError, ValueError):
        return None
    return joined if _parse_url(joined) is not None else None


def _safe_href(raw: str, source_url: str, asset_map: dict[str, str]) -> str | None:
    raw = (raw or "").strip()
    if not raw:
        return None
    if raw.startswith("#"):
        return raw
    absolute = _safe_join(source_url, raw)
    parsed = _parse_url(absolute) if absolute else None
    if not _safe_authority(parsed) or parsed.scheme not in {"http", "https"}:
        return None
    host = parsed.hostname.lower()
    if host in SOURCE_HOSTS:
        media_key = _media_key(absolute)
        if media_key:
            return asset_map.get(media_key)
        path = "/" + parsed.path.strip("/") if parsed.path != "/" else "/"
        decoded_path = unquote(path)
        if decoded_path.startswith("/magazin/gay/"):
            return None
        path = KNOWN_PATH_FIXES.get(decoded_path, path)
        root = path.lstrip("/").split("/", 1)[0]
        if root in PLATFORM_ROOTS:
            if path.rstrip("/") == "/registration":
                return f"{SITE}/registration/?AID=magazin"
            suffix = f"?{parsed.query}" if parsed.query else ""
            return f"{SITE}{path}{suffix}"
        suffix = f"?{parsed.query}" if parsed.query else ""
        fragment = f"#{parsed.fragment}" if parsed.fragment else ""
        return f"{path.rstrip('/') or '/'}{suffix}{fragment}"
    return absolute


def _safe_external_image(source: str) -> bool:
    parsed = _parse_url(source)
    if not _safe_authority(parsed) or parsed.scheme != "https" or parsed.hostname.lower() not in EXTERNAL_IMAGE_HOSTS:
        return False
    decoded = _decode_path_fully(parsed.path)
    if decoded is None:
        return False
    normalized_separators = decoded.replace("\\", "/")
    if any(segment in {".", ".."} for segment in normalized_separators.split("/")):
        return False
    normalized = "/" + posixpath.normpath(normalized_separators).lstrip("/")
    return not FORBIDDEN_IMAGE_PATH.search(normalized)


def sanitize_magazine_html(html: str, source_url: str, asset_map: dict[str, str]) -> str:
    fragment = BeautifulSoup(html or "", "html.parser")
    for node in fragment.find_all(string=lambda value: isinstance(value, Comment)):
        node.extract()
    for node in list(fragment.find_all(DROP_TAGS)):
        node.decompose()
    for heading in fragment.find_all("h1"):
        heading.decompose()
    for anchor in reversed([node for node in fragment.find_all("a") if node.find_parent("a") or node.find("a")]):
        if anchor.parent:
            anchor.unwrap()
    for iframe in list(fragment.find_all("iframe")):
        parsed = _parse_url(iframe.get("src", ""))
        replacement = None
        if parsed and _safe_authority(parsed) and parsed.scheme == "https" and parsed.hostname in {"youtube.com", "www.youtube.com"}:
            match = re.fullmatch(r"/embed/([A-Za-z0-9_-]{6,20})/?", parsed.path)
            if match:
                replacement = BeautifulSoup(
                    f'<p class="video-link"><a href="https://www.youtube.com/watch?v={match.group(1)}">Video auf YouTube ansehen</a></p>',
                    "html.parser",
                ).p
        iframe.replace_with(replacement) if replacement else iframe.decompose()
    for node in list(fragment.find_all(True)):
        if node.name not in ALLOWED_TAGS:
            node.unwrap()
            continue
        if node.name == "a":
            safe = _safe_href(node.get("href", ""), source_url, asset_map)
            if not safe:
                node.unwrap()
                continue
            node.attrs = {"href": safe}
            parsed = _parse_url(safe)
            if parsed and parsed.scheme in {"http", "https"} and parsed.hostname not in SOURCE_HOSTS:
                node.attrs.update({"rel": "nofollow noopener noreferrer", "target": "_blank"})
        elif node.name == "img":
            source = _safe_join(source_url, node.get("src", ""))
            key = _media_key(source) if source else None
            local = asset_map.get(key) if key else None
            if not local and source and _safe_external_image(source):
                local = source
            if not local:
                node.decompose()
                continue
            attrs = {"src": local, "alt": _plain(node.get("alt", "")), "loading": "lazy"}
            for dimension in ("width", "height"):
                value = str(node.get(dimension, ""))
                if value.isdigit() and int(value) > 0:
                    attrs[dimension] = value
            node.attrs = attrs
        elif node.name == "audio":
            sources = node.find_all("source", recursive=False)
            if not sources:
                node.decompose()
                continue
            node.attrs = {"controls": "", "preload": "metadata"}
        elif node.name == "source":
            source = _safe_join(source_url, node.get("src", ""))
            key = _media_key(source) if source else None
            local = asset_map.get(key) if key else None
            if not local:
                node.decompose()
                continue
            node.attrs = {"src": local, "type": node.get("type", "audio/mpeg")}
        elif node.name in {"h2", "h3", "h4"}:
            identifier = node.get("id", "")
            node.attrs = {"id": identifier} if re.fullmatch(r"[A-Za-z][A-Za-z0-9_-]{0,100}", identifier) else {}
        else:
            node.attrs = {}
    for audio in list(fragment.find_all("audio")):
        if not audio.find("source"):
            audio.decompose()
    serialized = re.sub(r"\s+", " ", str(fragment)).strip()
    return serialized


def _rest_collection(kind: str, fields: str) -> list[dict]:
    items: list[dict] = []
    page = 1
    while True:
        query = urlencode({"per_page": 100, "page": page, "_fields": fields})
        response = fetch(f"{API}/{kind}?{query}", expected_types=("application/json",))
        response.raise_for_status()
        batch = response.json()
        if not isinstance(batch, list):
            raise FetchPolicyError(f"Unexpected WordPress collection response for {kind}")
        items.extend(batch)
        total_pages = int(response.headers.get("X-WP-TotalPages", "1"))
        if page >= total_pages:
            return items
        page += 1


def _extension(source_url: str, mime_type: str) -> str:
    del source_url
    try:
        return MEDIA_EXTENSIONS[mime_type]
    except KeyError as error:
        raise FetchPolicyError(f"Unsupported media MIME type: {mime_type}") from error


def _valid_signature(data: bytes, mime_type: str) -> bool:
    if mime_type == "image/webp":
        return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    signatures = {
        "image/jpeg": (b"\xff\xd8\xff",),
        "image/png": (b"\x89PNG\r\n\x1a\n",),
        "image/gif": (b"GIF87a", b"GIF89a"),
        "audio/mpeg": (b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"),
    }
    return any(data.startswith(signature) for signature in signatures.get(mime_type, ()))


def _prepare_media(media: list[dict]) -> tuple[dict[int, dict], dict[str, str], dict[int, str]]:
    prepared: dict[int, dict] = {}
    url_map: dict[str, str] = {}
    id_map: dict[int, str] = {}
    for item in sorted(media, key=lambda value: int(value["id"])):
        media_id = int(item["id"])
        if media_id in EXCLUDED_SENSITIVE_MEDIA_IDS:
            continue
        mime_type = item.get("mime_type", "")
        source_url = item.get("source_url", "")
        slug = item.get("slug", "")
        if not isinstance(slug, str) or len(slug) > 200 or not re.fullmatch(r"[a-z0-9]+(?:[-_][a-z0-9]+)*", slug):
            raise FetchPolicyError(f"Unsafe WordPress media slug for {media_id}")
        if mime_type not in ALLOWED_MEDIA_MIMES or _media_key(source_url) is None:
            raise FetchPolicyError(f"Unsupported WordPress media {media_id}: {mime_type} {source_url}")
        filename = f"{media_id}-{slug}{_extension(source_url, mime_type)}"
        local_path = f"/magazine/media/{filename}"
        details = item.get("media_details") or {}
        candidates = [source_url]
        for size in (details.get("sizes") or {}).values():
            if isinstance(size, dict) and size.get("source_url"):
                candidates.append(size["source_url"])
        legacy_paths = sorted({urlparse(candidate).path for candidate in candidates})
        prepared[media_id] = {
            "item": item,
            "filename": filename,
            "localPath": local_path,
            "legacyPaths": legacy_paths,
        }
        id_map[media_id] = local_path
        for candidate in candidates:
            key = _media_key(candidate)
            if not key:
                continue
            previous = url_map.get(key)
            if previous and previous != local_path:
                raise FetchPolicyError(f"Ambiguous WordPress media URL {candidate}")
            url_map[key] = local_path
    return prepared, url_map, id_map


def _download_media(prepared: dict[int, dict], used_media_ids: set[int]) -> list[dict]:
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    media_root = MEDIA_DIR.resolve()
    assets = []
    selected = [prepared[media_id] for media_id in sorted(used_media_ids)]
    expected_filenames = {record["filename"] for record in selected}
    for index, record in enumerate(selected, 1):
        item = record["item"]
        mime_type = item["mime_type"]
        source_url = item["source_url"]
        response = fetch(source_url, expected_types=(mime_type,))
        response.raise_for_status()
        data = response.content
        if not _valid_signature(data, mime_type):
            raise FetchPolicyError(f"Invalid media signature for {source_url}")
        destination = (MEDIA_DIR / record["filename"]).resolve()
        if destination.parent != media_root:
            raise FetchPolicyError(f"Refusing magazine media path outside destination: {record['filename']}")
        if not destination.exists() or destination.read_bytes() != data:
            destination.write_bytes(data)
        assets.append({
            "id": int(item["id"]),
            "sourceUrl": source_url,
            "localPath": record["localPath"],
            "mimeType": mime_type,
            "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest(),
            "alt": _plain(item.get("alt_text", "")),
            "legacyPaths": record["legacyPaths"],
        })
        print(f"[media {index}/{len(selected)}] {mime_type} {record['localPath']}")
    for existing in MEDIA_DIR.iterdir():
        if existing.is_symlink():
            raise FetchPolicyError(f"Refusing symlink in magazine media directory: {existing.name}")
        if existing.is_file() and existing.name not in expected_filenames:
            existing.unlink()
    return assets


def _description(excerpt_html: str, content_html: str, title: str) -> str:
    text = _plain(excerpt_html) or _plain(content_html)
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return f"{title} im Er-sucht-Ihn Magazin für schwule Männer."
    return text if len(text) <= 180 else text[:177].rstrip(" ,.;:-") + "…"


def main() -> None:
    posts = _rest_collection(
        "posts",
        "id,slug,link,date,modified,status,title,excerpt,content,featured_media,author,categories,tags",
    )
    pages = _rest_collection(
        "pages",
        "id,slug,link,date,modified,status,title,excerpt,content,featured_media,author,parent",
    )
    media = _rest_collection(
        "media",
        "id,slug,link,source_url,mime_type,media_details,post,alt_text,title",
    )
    categories = _rest_collection("categories", "id,name,slug,count,description")
    tags = _rest_collection("tags", "id,name,slug,count,description")
    users = _rest_collection("users", "id,name,slug,description")

    prepared_media, asset_map, media_id_map = _prepare_media(media)
    category_by_id = {int(item["id"]): {key: item.get(key) for key in ("id", "name", "slug")} for item in categories}
    tag_by_id = {int(item["id"]): {key: item.get(key) for key in ("id", "name", "slug")} for item in tags}
    user_by_id = {int(item["id"]): {key: item.get(key) for key in ("id", "name", "slug", "description")} for item in users}

    entries = []
    id_to_path: dict[int, str] = {}
    for kind, source_items in (("post", posts), ("page", pages)):
        for item in source_items:
            if item.get("status") != "publish":
                raise FetchPolicyError(f"Refusing non-published WordPress entry {item.get('id')}")
            slug = item["slug"]
            path = f"/magazin/{slug}"
            title = _plain(item.get("title", {}).get("rendered", ""))
            raw_content = item.get("content", {}).get("rendered", "")
            content = sanitize_magazine_html(raw_content, item["link"], asset_map)
            entry = {
                "id": int(item["id"]),
                "type": kind,
                "status": item.get("status", "publish"),
                "slug": slug,
                "path": path,
                "canonical": f"{SITE}{path}",
                "sourceUrl": item["link"],
                "title": title,
                "description": _description(item.get("excerpt", {}).get("rendered", ""), content, title),
                "date": item.get("date", ""),
                "modified": item.get("modified", ""),
                "author": user_by_id.get(int(item.get("author", 0))),
                "featuredImage": media_id_map.get(int(item.get("featured_media", 0))),
                "categories": [category_by_id[value] for value in item.get("categories", []) if value in category_by_id],
                "tags": [tag_by_id[value] for value in item.get("tags", []) if value in tag_by_id],
                "contentHtml": content,
            }
            entries.append(entry)
            id_to_path[int(item["id"])] = path

    entry_paths = [entry["path"] for entry in entries]
    if len(entry_paths) != len(set(entry_paths)):
        raise FetchPolicyError("Duplicate WordPress post/page path")

    rendered_media = "\n".join(
        f"{entry.get('featuredImage') or ''} {entry['contentHtml']}" for entry in entries
    )
    used_media_ids = {
        media_id for media_id, local_path in media_id_map.items() if local_path in rendered_media
    }
    assets = _download_media(prepared_media, used_media_ids)
    active_media = [item for item in media if int(item["id"]) in used_media_ids]

    attachments = []
    for item in active_media:
        parsed = _parse_url(item.get("link", ""))
        if not parsed or parsed.hostname not in SOURCE_HOSTS:
            raise FetchPolicyError(f"Invalid attachment link for media {item.get('id')}")
        path = "/" + parsed.path.strip("/")
        parent = id_to_path.get(int(item.get("post") or 0))
        target = parent or media_id_map[int(item["id"])]
        attachments.append({
            "id": int(item["id"]),
            "slug": item["slug"],
            "path": path,
            "canonical": f"{SITE}{path}",
            "targetType": "entry" if parent else "asset",
            "target": target,
        })

    attachment_paths = [attachment["path"] for attachment in attachments]
    if len(attachment_paths) != len(set(attachment_paths)) or set(attachment_paths) & set(entry_paths):
        raise FetchPolicyError("Duplicate or ambiguous WordPress attachment path")
    legacy_paths = [path for asset in assets for path in asset["legacyPaths"]]
    if len(legacy_paths) != len(set(legacy_paths)):
        raise FetchPolicyError("Duplicate WordPress media compatibility path")

    snapshot = {
        "source": f"{MAGAZINE}/wp-json/",
        "sourceCounts": {
            "posts": len(posts),
            "pages": len(pages),
            "media": len(media),
        },
        "entries": sorted(entries, key=lambda item: item["path"]),
        "attachments": sorted(attachments, key=lambda item: item["path"]),
        "assets": sorted(assets, key=lambda item: item["id"]),
        "categories": sorted(categories, key=lambda item: item["slug"]),
        "tags": sorted(tags, key=lambda item: item["slug"]),
        "authors": sorted(users, key=lambda item: item["slug"]),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(entries)} entries, {len(attachments)} attachments and {len(assets)} assets to {OUT}")


if __name__ == "__main__":
    main()
