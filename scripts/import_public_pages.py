#!/usr/bin/env python3
"""Build a deterministic, editorial-only snapshot from public Er-sucht-Ihn pages."""
from __future__ import annotations

import json
import html
import ipaddress
import re
import socket
import time
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

import requests
import urllib3
from bs4 import BeautifulSoup, Comment
from requests.structures import CaseInsensitiveDict

SITE = "https://er-sucht-ihn.de"
SITEMAP = f"{SITE}/sitemap.php"
OUT = Path(__file__).resolve().parents[1] / "data" / "pages.json"
MAGAZINE_OUT = OUT.parent / "magazine.json"
PLATFORM_ROOTS = {"registration", "login", "suche", "hilfe", "kontakt", "gutschein", "datenschutz.html", "impressum.html", "agb.html"}
ALLOWED_TAGS = {
    "a", "b", "blockquote", "br", "div", "em", "figcaption", "figure", "h1", "h2", "h3", "h4",
    "hr", "img", "li", "main", "ol", "p", "picture", "section", "small", "span", "strong", "ul",
}
ALLOWED_IMAGE_HOSTS = {"static-cms.icony-hosting.de", "static2.icony-hosting.de", "er-sucht-ihn.de", "www.er-sucht-ihn.de"}
SOURCE_HOSTS = {"er-sucht-ihn.de", "www.er-sucht-ihn.de"}
EXCLUDED_RESOURCE_HOSTS = {"singleboersen-ueberblick.de", "www.singleboersen-ueberblick.de", "flirt.de", "www.flirt.de"}
MAX_RESPONSE_BYTES = 10 * 1024 * 1024
MAX_REDIRECTS = 5
FETCH_TIMEOUT = (10, 30)
MAX_URL_PATH_LENGTH = 8192
MAX_DECODE_ROUNDS = 32
FORBIDDEN_IMAGE_PATH = re.compile(r"/(?:user-media|member-media|members?|profiles?|profile-images?|mitglieder)(?:/|$)", re.I)
KNOWN_PATH_FIXES = {
    "/videodate.html": "/videodating.html",
    "/startseite": "/",
    "/partnersuche/bayern/augsburg": "/partnersuche/augsburg",
    "/partnersuche/bayern/m%C3%BCnchen": "/partnersuche/bayern/muenchen",
    "/partnersuche/bayern/münchen": "/partnersuche/bayern/muenchen",
}
DYNAMIC_SELECTORS = [
    "form", "script", "style", "noscript", "iframe", ".grid-view", ".result-item",
    ".user-box", ".register-box-module", ".cookie-consent", "aside", "nav",
]

USER_AGENT = "Er-sucht-Ihn migration snapshot/1.0"


class FetchPolicyError(RuntimeError):
    """The importer refused a network request that violates its source policy."""


def _safe_authority(parsed, allowed_hosts: set[str]) -> bool:
    if parsed.hostname is None or parsed.hostname.lower() not in allowed_hosts:
        return False
    if parsed.username is not None or parsed.password is not None:
        return False
    try:
        port = parsed.port
    except ValueError:
        return False
    return port in {None, 443 if parsed.scheme == "https" else 80}


def _parse_url(url: str):
    try:
        return urlparse(url)
    except (TypeError, ValueError):
        return None


def extract_location_widget_url(soup: BeautifulSoup, path: str) -> str | None:
    if path == "/partnersuche" or not path.startswith("/partnersuche/"):
        return None
    frames = soup.find_all("iframe")
    if len(frames) != 1:
        raise FetchPolicyError(f"Expected exactly one ICONY widget on city page {path}")
    source = frames[0].get("src", "")
    source_match = re.fullmatch(
        r"https://js\.icony\.com/frame/\?h=300&id=ersuchtihn&pc=3c89b1&z=([0-9]{5})&ds=&ctr=49&it=1",
        source,
    )
    if source_match is None:
        raise FetchPolicyError(f"Unsafe ICONY widget URL on city page {path}")
    postcode = source_match.group(1)
    return f"https://js.icony.com/frame/?h=300&id=ersuchtihn&pc=3c89b1&z={postcode}&ds=&ctr=49&it=1"


def _safe_urljoin(base: str, reference: str) -> str:
    try:
        joined = urljoin(base, reference)
    except (TypeError, ValueError) as error:
        raise FetchPolicyError(f"Refusing malformed URL reference: {reference}") from error
    if _parse_url(joined) is None:
        raise FetchPolicyError(f"Refusing malformed URL reference: {reference}")
    return joined


def _decode_path_fully(path: str) -> str | None:
    if len(path) > MAX_URL_PATH_LENGTH:
        return None
    decoded = path
    for _ in range(MAX_DECODE_ROUNDS):
        try:
            next_value = unquote(decoded, errors="strict")
        except UnicodeDecodeError:
            return None
        if next_value == decoded:
            return None if "%" in decoded else decoded
        decoded = next_value
        if len(decoded) > MAX_URL_PATH_LENGTH:
            return None
    return None


def validate_source_url(url: str) -> tuple[str, ...]:
    parsed = _parse_url(url)
    if parsed is None:
        raise FetchPolicyError(f"Refusing malformed source URL: {url}")
    if parsed.scheme != "https" or not _safe_authority(parsed, SOURCE_HOSTS) or parsed.fragment:
        raise FetchPolicyError(f"Refusing source URL outside the HTTPS market allowlist: {url}")
    try:
        addresses = socket.getaddrinfo(parsed.hostname, parsed.port or 443, type=socket.SOCK_STREAM)
    except socket.gaierror as error:
        raise FetchPolicyError(f"Could not resolve approved source host: {parsed.hostname}") from error
    if not addresses:
        raise FetchPolicyError(f"Approved source host resolved to no addresses: {parsed.hostname}")
    approved = []
    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if not ip.is_global:
            raise FetchPolicyError(f"Refusing non-public source address for {parsed.hostname}: {ip}")
        approved.append(str(ip))
    return tuple(sorted(set(approved)))


def _request_pinned(url: str, address: str) -> requests.Response:
    """Fetch from the exact validated IP while retaining TLS SNI/hostname checks."""
    parsed = _parse_url(url)
    if parsed is None or parsed.hostname is None:
        raise FetchPolicyError(f"Refusing malformed source URL: {url}")
    target = parsed.path or "/"
    if parsed.query:
        target += f"?{parsed.query}"
    pool = urllib3.HTTPSConnectionPool(
        host=address,
        port=parsed.port or 443,
        assert_hostname=parsed.hostname,
        server_hostname=parsed.hostname,
        cert_reqs="CERT_REQUIRED",
        ca_certs=requests.certs.where(),
        timeout=urllib3.Timeout(connect=FETCH_TIMEOUT[0], read=FETCH_TIMEOUT[1]),
        maxsize=1,
        block=True,
    )
    raw = pool.urlopen(
        "GET",
        target,
        headers={"Host": parsed.hostname, "User-Agent": USER_AGENT, "Accept-Encoding": "identity"},
        redirect=False,
        retries=False,
        preload_content=False,
    )
    response = requests.Response()
    response.status_code = raw.status
    response.headers = CaseInsensitiveDict(raw.headers)
    response.url = url
    response.raw = raw
    return response


def _read_bounded_response(response: requests.Response, expected_types: tuple[str, ...]) -> requests.Response:
    try:
        content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
        if not content_type or not any(content_type == expected or content_type.startswith(f"{expected}+") for expected in expected_types):
            raise FetchPolicyError(f"Unexpected response content type: {content_type or 'missing'}")
        try:
            declared_size = int(response.headers.get("Content-Length", "0"))
        except ValueError as error:
            raise FetchPolicyError("Invalid Content-Length from source") from error
        if declared_size < 0 or declared_size > MAX_RESPONSE_BYTES:
            raise FetchPolicyError(f"Invalid or oversized Content-Length from source: {declared_size}")
        chunks = []
        size = 0
        for chunk in response.iter_content(chunk_size=64 * 1024):
            if not chunk:
                continue
            size += len(chunk)
            if size > MAX_RESPONSE_BYTES:
                raise FetchPolicyError(f"Response exceeds {MAX_RESPONSE_BYTES} bytes")
            chunks.append(chunk)
        response._content = b"".join(chunks)
        response._content_consumed = True
        return response
    finally:
        response.close()


def fetch(url: str, attempts: int = 4, expected_types: tuple[str, ...] = ("text/html", "application/xml", "text/xml")) -> requests.Response:
    last = None
    for attempt in range(attempts):
        current = url
        for redirect_count in range(MAX_REDIRECTS + 1):
            approved_addresses = validate_source_url(current)
            connection_errors = []
            last = None
            for address in approved_addresses:
                try:
                    last = _request_pinned(current, address)
                    break
                except (OSError, urllib3.exceptions.HTTPError) as error:
                    connection_errors.append(str(error))
            if last is None:
                if attempt + 1 == attempts:
                    raise FetchPolicyError(f"All approved source addresses failed: {'; '.join(connection_errors)}")
                break
            if last.status_code in {301, 302, 303, 307, 308}:
                location = last.headers.get("Location")
                last.close()
                if not location or redirect_count == MAX_REDIRECTS:
                    raise FetchPolicyError("Source exceeded the safe redirect limit")
                current = _safe_urljoin(current, location)
                continue
            if last.status_code == 200:
                return _read_bounded_response(last, expected_types)
            last.close()
            break
        time.sleep(0.7 * (attempt + 1))
    assert last is not None
    return last


def normalize_path(url: str) -> str:
    parsed = _parse_url(url)
    if parsed is None:
        raise FetchPolicyError(f"Refusing malformed source URL: {url}")
    path = parsed.path
    return "/" if path == "/" else "/" + path.strip("/")


def page_type(path: str) -> str:
    root = path.lstrip("/").split("/", 1)[0]
    if root in PLATFORM_ROOTS:
        return "platform"
    if root == "partnersuche":
        return "location"
    if root == "lexikon":
        return "retired"
    if root == "magazin":
        return "magazine"
    return "editorial"


def text_or(node, fallback=""):
    return node.get_text(" ", strip=True) if node else fallback


def is_internal_market_url(parsed) -> bool:
    return parsed.scheme in {"http", "https"} and _safe_authority(parsed, SOURCE_HOSTS)


def safe_href(raw_href: str, source_url: str) -> str | None:
    raw = raw_href.strip()
    if not raw:
        return None
    if raw.startswith("#"):
        return raw
    if raw.lower().startswith("hhttp"):
        raw = raw[1:]
    try:
        absolute = _safe_urljoin(source_url, raw)
    except FetchPolicyError:
        return None
    parsed = _parse_url(absolute)
    if parsed is None:
        return None
    if parsed.scheme not in {"http", "https"} or parsed.hostname in EXCLUDED_RESOURCE_HOSTS:
        return None
    if not _safe_authority(parsed, {parsed.hostname.lower()} if parsed.hostname else set()):
        return None
    if is_internal_market_url(parsed):
        path = normalize_path(absolute)
        path = KNOWN_PATH_FIXES.get(path, path)
        if path.startswith("/magazin/gay/"):
            return None
        root = path.lstrip("/").split("/", 1)[0]
        if root in PLATFORM_ROOTS:
            suffix = parsed.query and f"?{parsed.query}" or ""
            return f"{SITE}{path}{suffix}"
        return path
    return absolute


def clean_content(
    soup: BeautifulSoup,
    kind: str,
    source_url: str,
    magazine_media: dict[str, str] | None = None,
) -> str:
    if kind == "platform":
        return ""
    main = soup.select_one("main#static") or soup.select_one("main.city-container") or soup.select_one("main")
    if not main:
        return ""
    fragment = BeautifulSoup(str(main), "html.parser")
    for selector in DYNAMIC_SELECTORS:
        for node in fragment.select(selector):
            node.decompose()
    for node in fragment.find_all(string=lambda value: isinstance(value, Comment)):
        node.extract()
    # The Next.js page shell owns the single main landmark and visible h1.
    # Imported fragments must not create nested mains or duplicate page titles.
    for node in fragment.find_all("h1"):
        node.decompose()
    for node in fragment.find_all("main"):
        node.unwrap()
    nested_anchors = [node for node in fragment.find_all("a") if node.find_parent("a") or node.find("a")]
    for node in reversed(nested_anchors):
        if node.parent:
            node.unwrap()
    for node in list(fragment.find_all(True)):
        if node.name not in ALLOWED_TAGS:
            node.unwrap()
            continue
        if node.name == "a":
            safe = safe_href(node.get("href", ""), source_url)
            if not safe or "registration/?user=" in safe:
                node.unwrap()
                continue
            node.attrs = {"href": safe}
            parsed_href = urlparse(safe)
            is_internal = is_internal_market_url(parsed_href)
            is_registration = is_internal and parsed_href.path.rstrip("/") == "/registration"
            if is_registration and not node.find("img") and node.get_text(" ", strip=True):
                aid = "location" if kind == "location" else "magazin"
                node.attrs = {
                    "href": f"{SITE}/registration/?AID={aid}",
                    "class": "inline-content-cta",
                }
            elif parsed_href.scheme in {"http", "https"} and not is_internal:
                node.attrs.update({"rel": "nofollow noopener noreferrer", "target": "_blank"})
        elif node.name == "img":
            try:
                source = _safe_urljoin(source_url, node.get("src", ""))
            except FetchPolicyError:
                node.decompose()
                continue
            parsed = _parse_url(source)
            if parsed is None:
                node.decompose()
                continue
            decoded_path = _decode_path_fully(parsed.path)
            if decoded_path is None:
                node.decompose()
                continue
            path_segments = decoded_path.split("/")
            if (
                parsed.scheme != "https"
                or not _safe_authority(parsed, ALLOWED_IMAGE_HOSTS)
                or parsed.hostname in EXCLUDED_RESOURCE_HOSTS
                or "\\" in decoded_path
                or any(segment in {".", ".."} for segment in path_segments)
                or FORBIDDEN_IMAGE_PATH.search(decoded_path)
            ):
                node.decompose()
                continue
            if parsed.hostname.lower() in SOURCE_HOSTS:
                local_source = (magazine_media or {}).get(parsed.path) or (magazine_media or {}).get(decoded_path)
                if not local_source:
                    node.decompose()
                    continue
                source = local_source
            node.attrs = {key: node.attrs[key] for key in ("src", "alt", "width", "height") if key in node.attrs}
            node["src"] = source
        else:
            node.attrs = {}
    html = str(fragment)
    html = re.sub(r"\s+", " ", html).strip()
    return html


def fallback_title(path: str) -> str:
    if path == "/":
        return "Er sucht Ihn"
    return path.rstrip("/").split("/")[-1].replace("-", " ").title()


def load_magazine_media_map() -> dict[str, str]:
    if not MAGAZINE_OUT.exists():
        raise FetchPolicyError("Missing data/magazine.json; run import_magazine.py before import_public_pages.py")
    try:
        snapshot = json.loads(MAGAZINE_OUT.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise FetchPolicyError("Could not read the verified magazine media snapshot") from error
    mapping: dict[str, str] = {}
    for asset in snapshot.get("assets", []):
        target = asset.get("localPath", "")
        if not re.fullmatch(r"/magazine/media/[A-Za-z0-9._-]+", target):
            raise FetchPolicyError(f"Invalid localized magazine media target: {target}")
        for path in asset.get("legacyPaths", []):
            if not isinstance(path, str) or not path.startswith("/magazin/wp-content/uploads/"):
                raise FetchPolicyError(f"Invalid magazine media compatibility path: {path}")
            if path in mapping and mapping[path] != target:
                raise FetchPolicyError(f"Ambiguous magazine media compatibility path: {path}")
            mapping[path] = target
    if not mapping:
        raise FetchPolicyError("Magazine media snapshot contains no compatibility paths")
    return mapping


def extract_sitemap_locations(xml: str) -> list[str]:
    locations = []
    for raw in re.findall(r"<loc(?:\s[^>]*)?>(.*?)</loc>", xml, flags=re.I | re.S):
        value = raw.strip()
        if value.startswith("<![CDATA[") and value.endswith("]]>"):
            value = value[9:-3].strip()
        value = html.unescape(value)
        if value:
            locations.append(value)
    return locations


def discover_public_urls() -> list[str]:
    response = fetch(SITEMAP, expected_types=("application/xml", "text/xml"))
    response.raise_for_status()
    locations = extract_sitemap_locations(response.text)
    partner_sitemap = f"{SITE}/partner_sitemap.php"
    if partner_sitemap in locations:
        child = fetch(partner_sitemap, expected_types=("application/xml", "text/xml"))
        child.raise_for_status()
        urls = extract_sitemap_locations(child.text)
        if not urls:
            raise FetchPolicyError("Approved partner sitemap contains no public URLs")
        return urls
    if any(_parse_url(url) and _parse_url(url).path.endswith((".xml", "_sitemap.php")) for url in locations):
        raise FetchPolicyError("Sitemap index does not contain the exact approved partner sitemap")
    return locations


def main():
    magazine_media = load_magazine_media_map()
    urls = discover_public_urls()
    seen = set()
    pages = []
    for index, source_url in enumerate(urls, 1):
        path = normalize_path(source_url)
        if path in seen:
            continue
        seen.add(path)
        kind = page_type(path)
        if kind == "retired":
            continue
        response = fetch(source_url, expected_types=("text/html",))
        soup = BeautifulSoup(response.text, "html.parser") if response.status_code == 200 else BeautifulSoup("", "html.parser")
        title = text_or(soup.title, fallback_title(path))
        description_node = soup.find("meta", attrs={"name": "description"})
        description = (description_node.get("content", "").strip() if description_node else "") or f"Gay-Dating und Partnersuche rund um {fallback_title(path)} auf Er-sucht-Ihn.de."
        h1 = text_or(soup.find("h1"), fallback_title(path))
        canonical = f"{SITE}{'/' if path == '/' else path}"
        widget_url = extract_location_widget_url(soup, path)
        content = clean_content(soup, kind, source_url, magazine_media)
        images = []
        for image in BeautifulSoup(content, "html.parser").find_all("img", src=True):
            if image["src"] not in [item["src"] for item in images]:
                images.append({"src": image["src"], "alt": image.get("alt", "")})
        pages.append({
            "path": path,
            "sourceUrl": source_url,
            "canonical": canonical,
            "type": kind,
            "title": title,
            "description": description,
            "h1": h1,
            "contentHtml": content,
            "images": images,
            "widgetUrl": widget_url,
            "sourceStatus": response.status_code,
        })
        print(f"[{index}/{len(urls)}] {response.status_code} {path}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"source": SITEMAP, "pages": pages}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(pages)} unique pages to {OUT}")


if __name__ == "__main__":
    main()
