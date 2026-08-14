#!/usr/bin/env python3
"""Build a deterministic, editorial-only snapshot from public Er-sucht-Ihn pages."""
from __future__ import annotations

import json
import ipaddress
import re
import socket
import time
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup, Comment

SITE = "https://er-sucht-ihn.de"
SITEMAP = f"{SITE}/sitemap.php"
OUT = Path(__file__).resolve().parents[1] / "data" / "pages.json"
PLATFORM_ROOTS = {"registration", "login", "suche", "hilfe", "kontakt", "gutschein", "datenschutz.html", "impressum.html", "agb.html", "magazin"}
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

session = requests.Session()
session.headers["User-Agent"] = "Er-sucht-Ihn migration snapshot/1.0"


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


def validate_source_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not _safe_authority(parsed, SOURCE_HOSTS) or parsed.fragment:
        raise FetchPolicyError(f"Refusing source URL outside the HTTPS market allowlist: {url}")
    try:
        addresses = socket.getaddrinfo(parsed.hostname, parsed.port or 443, type=socket.SOCK_STREAM)
    except socket.gaierror as error:
        raise FetchPolicyError(f"Could not resolve approved source host: {parsed.hostname}") from error
    if not addresses:
        raise FetchPolicyError(f"Approved source host resolved to no addresses: {parsed.hostname}")
    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if not ip.is_global:
            raise FetchPolicyError(f"Refusing non-public source address for {parsed.hostname}: {ip}")
    return url


def _read_bounded_response(response: requests.Response, expected_types: tuple[str, ...]) -> requests.Response:
    content_type = response.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
    if not content_type or not any(content_type == expected or content_type.startswith(f"{expected}+") for expected in expected_types):
        response.close()
        raise FetchPolicyError(f"Unexpected response content type: {content_type or 'missing'}")
    try:
        declared_size = int(response.headers.get("Content-Length", "0"))
    except ValueError:
        response.close()
        raise FetchPolicyError("Invalid Content-Length from source")
    if declared_size > MAX_RESPONSE_BYTES:
        response.close()
        raise FetchPolicyError(f"Response exceeds {MAX_RESPONSE_BYTES} bytes")
    chunks = []
    size = 0
    for chunk in response.iter_content(chunk_size=64 * 1024):
        if not chunk:
            continue
        size += len(chunk)
        if size > MAX_RESPONSE_BYTES:
            response.close()
            raise FetchPolicyError(f"Response exceeds {MAX_RESPONSE_BYTES} bytes")
        chunks.append(chunk)
    response._content = b"".join(chunks)
    response._content_consumed = True
    return response


def fetch(url: str, attempts: int = 4, expected_types: tuple[str, ...] = ("text/html", "application/xml", "text/xml")) -> requests.Response:
    last = None
    for attempt in range(attempts):
        current = url
        for redirect_count in range(MAX_REDIRECTS + 1):
            validate_source_url(current)
            last = session.get(current, timeout=FETCH_TIMEOUT, allow_redirects=False, stream=True)
            if last.status_code in {301, 302, 303, 307, 308}:
                location = last.headers.get("Location")
                last.close()
                if not location or redirect_count == MAX_REDIRECTS:
                    raise FetchPolicyError("Source exceeded the safe redirect limit")
                current = urljoin(current, location)
                continue
            if last.status_code == 200:
                return _read_bounded_response(last, expected_types)
            break
        time.sleep(0.7 * (attempt + 1))
    assert last is not None
    return last


def normalize_path(url: str) -> str:
    path = urlparse(url).path
    return "/" if path == "/" else "/" + path.strip("/")


def page_type(path: str) -> str:
    root = path.lstrip("/").split("/", 1)[0]
    if root in PLATFORM_ROOTS:
        return "platform"
    if root == "partnersuche":
        return "location"
    if root == "lexikon":
        return "lexicon"
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
    absolute = urljoin(source_url, raw)
    parsed = urlparse(absolute)
    if parsed.scheme not in {"http", "https"} or parsed.hostname in EXCLUDED_RESOURCE_HOSTS:
        return None
    if not _safe_authority(parsed, {parsed.hostname.lower()} if parsed.hostname else set()):
        return None
    if is_internal_market_url(parsed):
        path = normalize_path(absolute)
        path = KNOWN_PATH_FIXES.get(path, path)
        root = path.lstrip("/").split("/", 1)[0]
        if root in PLATFORM_ROOTS:
            suffix = parsed.query and f"?{parsed.query}" or ""
            return f"{SITE}{path}{suffix}"
        return path
    return absolute


def clean_content(soup: BeautifulSoup, kind: str, source_url: str) -> str:
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
            source = urljoin(source_url, node.get("src", ""))
            parsed = urlparse(source)
            decoded_path = unquote(parsed.path)
            if (
                parsed.scheme != "https"
                or not _safe_authority(parsed, ALLOWED_IMAGE_HOSTS)
                or parsed.hostname in EXCLUDED_RESOURCE_HOSTS
                or FORBIDDEN_IMAGE_PATH.search(decoded_path)
            ):
                node.decompose()
                continue
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


def main():
    sitemap_response = fetch(SITEMAP, expected_types=("application/xml", "text/xml"))
    sitemap_response.raise_for_status()
    urls = re.findall(r"<loc>(.*?)</loc>", sitemap_response.text)
    seen = set()
    pages = []
    for index, source_url in enumerate(urls, 1):
        path = normalize_path(source_url)
        if path in seen:
            continue
        seen.add(path)
        kind = page_type(path)
        response = fetch(source_url, expected_types=("text/html",))
        soup = BeautifulSoup(response.text, "html.parser") if response.status_code == 200 else BeautifulSoup("", "html.parser")
        title = text_or(soup.title, fallback_title(path))
        description_node = soup.find("meta", attrs={"name": "description"})
        description = (description_node.get("content", "").strip() if description_node else "") or f"Informationen und hilfreiche Einstiege zu {fallback_title(path)} auf Er-sucht-Ihn.de."
        h1 = text_or(soup.find("h1"), fallback_title(path))
        canonical = f"{SITE}{'/' if path == '/' else path}"
        content = clean_content(soup, kind, source_url)
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
            "widgetUrl": None,
            "sourceStatus": response.status_code,
        })
        print(f"[{index}/{len(urls)}] {response.status_code} {path}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"source": SITEMAP, "pages": pages}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(pages)} unique pages to {OUT}")


if __name__ == "__main__":
    main()
