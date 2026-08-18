import unittest
from scripts.import_magazine import _extension, _prepare_media, _valid_signature, sanitize_magazine_html
from scripts.import_public_pages import FetchPolicyError


class MagazineImportTests(unittest.TestCase):
    def test_sanitizer_localizes_media_and_preserves_safe_editorial_structure(self):
        media = "https://er-sucht-ihn.de/magazin/wp-content/uploads/2026/07/photo.jpg"
        html = f"""
        <div style="color:red" onclick="alert(1)">
          <h2 id="intro">Ein guter Einstieg</h2>
          <p>Text mit <strong>Betonung</strong>.</p>
          <img src="{media}" srcset="{media} 2x" alt="Editorial">
          <table><tbody><tr><th>Frage</th><td>Antwort</td></tr></tbody></table>
          <script>alert(1)</script><form><input name="private"></form>
        </div>
        """
        cleaned = sanitize_magazine_html(html, "https://er-sucht-ihn.de/magazin/example/", {media: "/magazine/media/photo.jpg"})
        self.assertIn('<h2 id="intro">Ein guter Einstieg</h2>', cleaned)
        self.assertIn('<img alt="Editorial" loading="lazy" src="/magazine/media/photo.jpg"/>', cleaned)
        self.assertIn("<table>", cleaned)
        for forbidden in ("style=", "onclick", "srcset", "<script", "<form", "<input"):
            self.assertNotIn(forbidden, cleaned.lower())

    def test_sanitizer_normalizes_internal_links_and_tracking(self):
        html = """
        <p><a href="https://er-sucht-ihn.de/magazin/coming-out/">Coming-out</a></p>
        <p><a href="/registration">Jetzt registrieren</a></p>
        <p><a href="https://example.org/source">Quelle</a></p>
        <p><a href="javascript:alert(1)">Unsicher</a></p>
        <p><a href="https://er-sucht-ihn.de/magazin/tv-show-prince-charming-staffel-1/">Alte Staffel</a></p>
        <p><a href="https://er-sucht-ihn.de/partnersuche/bayern/m%C3%BCnchen/">München</a></p>
        <p><a href="https://er-sucht-ihn.de/magazin/gay/leerer-tag/">Leerer Tag</a></p>
        """
        cleaned = sanitize_magazine_html(html, "https://er-sucht-ihn.de/magazin/example/", {})
        self.assertIn('href="/magazin/coming-out"', cleaned)
        self.assertIn('href="https://er-sucht-ihn.de/registration/?AID=magazin"', cleaned)
        self.assertIn('href="https://example.org/source" rel="nofollow noopener noreferrer" target="_blank"', cleaned)
        self.assertNotIn("javascript:", cleaned)
        self.assertIn('href="/magazin/prince-charming-2019-staffel-1"', cleaned)
        self.assertIn('href="/partnersuche/bayern/muenchen"', cleaned)
        self.assertIn("Leerer Tag", cleaned)
        self.assertNotIn("/magazin/gay/leerer-tag", cleaned)

    def test_sanitizer_turns_youtube_iframes_into_safe_links_and_drops_getty_embeds(self):
        html = """
        <iframe src="https://www.youtube.com/embed/abc123"></iframe>
        <iframe src="https://embed.gettyimages.com/embed/123"></iframe>
        """
        cleaned = sanitize_magazine_html(html, "https://er-sucht-ihn.de/magazin/example/", {})
        self.assertNotIn("<iframe", cleaned)
        self.assertIn('href="https://www.youtube.com/watch?v=abc123"', cleaned)
        self.assertNotIn("embed.gettyimages.com", cleaned)

    def test_sanitizer_fails_closed_for_unlocalized_or_member_media(self):
        html = """
        <img src="https://er-sucht-ihn.de/magazin/wp-content/uploads/missing.jpg" alt="missing">
        <img src="https://cdn3.icony-hosting.de/user-media/member.jpg" alt="member">
        <audio controls><source src="https://er-sucht-ihn.de/magazin/wp-content/uploads/missing.mp3" type="audio/mpeg"></audio>
        """
        cleaned = sanitize_magazine_html(html, "https://er-sucht-ihn.de/magazin/example/", {})
        self.assertNotIn("<img", cleaned)
        self.assertNotIn("<audio", cleaned)
        self.assertNotIn("user-media", cleaned)
    def test_sanitizer_rejects_repeatedly_encoded_external_member_media(self):
        sources = (
            "https://static-cms.icony-hosting.de/%2575ser-media/member.jpg",
            "https://static-cms.icony-hosting.de/editorial/%252e%252e/user-media/member.jpg",
            "https://static-cms.icony-hosting.de/%255cuser-media%255cmember.jpg",
        )
        html = "".join(f'<img src="{source}" alt="member">' for source in sources)
        cleaned = sanitize_magazine_html(html, "https://er-sucht-ihn.de/magazin/example/", {})
        self.assertNotIn("<img", cleaned)
        self.assertNotIn("user-media", cleaned)

    def test_webp_signature_requires_riff_and_webp_markers(self):
        self.assertFalse(_valid_signature(b"RIFF\x04\x00\x00\x00WAVEpayload", "image/webp"))
        self.assertTrue(_valid_signature(b"RIFF\x04\x00\x00\x00WEBPpayload", "image/webp"))

    def test_media_extension_is_derived_from_validated_mime_type(self):
        self.assertEqual(_extension("https://example.test/file.html", "image/jpeg"), ".jpg")
        self.assertEqual(_extension("https://example.test/file.jpg", "image/webp"), ".webp")
        self.assertEqual(_extension("https://example.test/file.bin", "audio/mpeg"), ".mp3")
    def test_media_manifest_rejects_unsafe_remote_slugs(self):
        base = {
            "id": 2000,
            "mime_type": "image/jpeg",
            "source_url": "https://er-sucht-ihn.de/magazin/wp-content/uploads/2026/08/safe.jpg",
            "media_details": {},
        }
        for slug in ("../../outside", r"..\..\outside", "/absolute", "C:-outside", ""):
            with self.subTest(slug=slug), self.assertRaises(FetchPolicyError):
                _prepare_media([{**base, "slug": slug}])
        prepared, _, _ = _prepare_media([{**base, "slug": "safe_slug-1280"}])
        self.assertEqual(prepared[2000]["filename"], "2000-safe_slug-1280.jpg")


if __name__ == "__main__":
    unittest.main()
