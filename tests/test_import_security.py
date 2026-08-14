import unittest
from bs4 import BeautifulSoup
from scripts.import_public_pages import clean_content, safe_href


class ImportSecurityTests(unittest.TestCase):
    def test_rejects_active_url_schemes_and_excluded_review_host(self):
        source = "https://er-sucht-ihn.de/partnersuche/berlin/"
        self.assertIsNone(safe_href("javascript:alert(1)", source))
        self.assertIsNone(safe_href("data:text/html,unsafe", source))
        self.assertIsNone(safe_href("https://singleboersen-ueberblick.de/tracking", source))

    def test_normalizes_known_internal_link_errors(self):
        source = "https://er-sucht-ihn.de/lexikon/"
        self.assertEqual(safe_href("../../lexikon/gaychat", source), "/lexikon/gaychat")
        self.assertEqual(safe_href("/videodate.html", source), "/videodating.html")
        self.assertEqual(safe_href("/startseite", source), "/")
        self.assertEqual(
            safe_href("hhttps://er-sucht-ihn.de/partnersuche/hamburg/", source),
            "/partnersuche/hamburg",
        )

    def test_sanitizer_uses_strict_markup_and_resource_allowlists(self):
        markup = """
        <main>
          <script>alert(1)</script><iframe src="https://js.icony.com/frame/x"></iframe>
          <form><input name="private"></form><video src="https://evil.example/video"></video>
          <a href="javascript:alert(1)">unsafe</a>
          <a href="/registration/?AID=location">register</a>
          <img src="https://singleboersen-ueberblick.de/pixel.png" alt="tracking">
          <img src="https://static-cms.icony-hosting.de/cms/city.jpg" alt="city" onerror="alert(1)">
        </main>
        """
        cleaned = clean_content(
            BeautifulSoup(markup, "html.parser"),
            "location",
            "https://er-sucht-ihn.de/partnersuche/berlin/",
        )
        for forbidden in ("<script", "<iframe", "<form", "<video", "javascript:", "onerror", "singleboersen-ueberblick.de"):
            self.assertNotIn(forbidden, cleaned.lower())
        cleaned_soup = BeautifulSoup(cleaned, "html.parser")
        registration = cleaned_soup.find("a", class_="inline-content-cta")
        self.assertEqual(registration["href"], "https://er-sucht-ihn.de/registration/?AID=location")
        self.assertIn('src="https://static-cms.icony-hosting.de/cms/city.jpg"', cleaned)

    def test_fragment_drops_renderer_owned_main_and_h1_but_preserves_article_structure(self):
        markup = """
        <main id="static">
          <h1>Imported duplicate title</h1>
          <p>Useful introduction.</p>
          <h2>Useful section</h2>
          <p>Useful details.</p>
        </main>
        """
        cleaned = clean_content(
            BeautifulSoup(markup, "html.parser"),
            "lexicon",
            "https://er-sucht-ihn.de/lexikon/example",
        )
        self.assertNotIn("<main", cleaned)
        self.assertNotIn("<h1", cleaned)
        self.assertIn("<h2>Useful section</h2>", cleaned)
        self.assertIn("Useful introduction.", cleaned)
        self.assertIn("Useful details.", cleaned)

    def test_importer_classifies_only_text_registration_ctas(self):
        markup = """
        <main id="static">
          <p><a href="/registration">Jetzt kostenlos registrieren</a></p>
          <p><a href="/registration/?ref=test">Mit Referenz registrieren</a></p>
          <p><a href="//er-sucht-ihn.de/registration">Protokollrelativ registrieren</a></p>
          <a href="/registration/profile">Registrierungsprofil</a>
          <a href="/registrationevil">Ähnlicher Pfad</a>
          <a href="https://er-sucht-ihn.de.evil.example/registration">Fremder Lookalike-Host</a>
          <a href="https://er-sucht-ihn.de:444/registration">Fremder Port</a>
          <a href="https://user@er-sucht-ihn.de/registration">URL mit Userinfo</a>
          <a href="/registration">Außen <a href="/registration">Innen</a></a>
          <a href="/registration"><img src="https://static-cms.icony-hosting.de/cms/promo.jpg" alt="Promo"></a>
          <a href="/registration"></a>
          <a href="/lexikon/gaychat">Normaler Inhaltslink</a>
        </main>
        """
        editorial = clean_content(
            BeautifulSoup(markup, "html.parser"),
            "lexicon",
            "https://er-sucht-ihn.de/lexikon/example",
        )
        location = clean_content(
            BeautifulSoup(markup, "html.parser"),
            "location",
            "https://er-sucht-ihn.de/partnersuche/berlin",
        )
        editorial_soup = BeautifulSoup(editorial, "html.parser")
        location_soup = BeautifulSoup(location, "html.parser")
        self.assertEqual(len(editorial_soup.select("a.inline-content-cta")), 3)
        self.assertTrue(all(a["href"] == "https://er-sucht-ihn.de/registration/?AID=magazin" for a in editorial_soup.select("a.inline-content-cta")))
        self.assertEqual(location_soup.select_one("a.inline-content-cta")["href"], "https://er-sucht-ihn.de/registration/?AID=location")
        self.assertIsNone(editorial_soup.select_one('a[href="/registration/profile"].inline-content-cta'))
        self.assertIsNone(editorial_soup.select_one('a[href="/registrationevil"].inline-content-cta'))
        self.assertIsNone(editorial_soup.select_one('a[href*="evil.example"].inline-content-cta'))
        self.assertEqual(editorial_soup.select_one('a[href*="evil.example"]')["rel"], ["nofollow", "noopener", "noreferrer"])
        self.assertIsNone(editorial_soup.select_one('a[href*=":444/registration"].inline-content-cta'))
        self.assertEqual(editorial_soup.select_one('a[href*=":444/registration"]')["rel"], ["nofollow", "noopener", "noreferrer"])
        self.assertIsNone(editorial_soup.select_one('a[href*="user@"].inline-content-cta'))
        self.assertEqual(editorial_soup.select_one('a[href*="user@"]')["rel"], ["nofollow", "noopener", "noreferrer"])
        self.assertNotIn("Außen <a", editorial)
        self.assertIn("Außen Innen", editorial)
        self.assertIn('<a href="/lexikon/gaychat">Normaler Inhaltslink</a>', editorial)
        self.assertEqual(editorial.count('<a href="https://er-sucht-ihn.de/registration">'), 2)


if __name__ == "__main__":
    unittest.main()
