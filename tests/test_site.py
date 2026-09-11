"""Static-site acceptance checks, run with python3 -m unittest discover -s tests."""
from html.parser import HTMLParser
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.elements = []
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))

class SiteTests(unittest.TestCase):
    def test_landing_page_is_rebranded_and_self_hosted(self):
        index = ROOT / 'index.html'
        self.assertTrue(index.is_file(), 'The Eden Properties landing page must exist')
        text = index.read_text()
        page = Page(text)
        self.assertIn('Eden Properties', text)
        self.assertNotRegex(text.lower(), r'elyse|webflow|liguria|390187')
        self.assertIn('name="viewport"', text)
        self.assertIn('<main', text)
        images = [attrs for tag, attrs in page.elements if tag == 'img']
        self.assertGreaterEqual(len(images), 5)
        for attrs in images:
            self.assertIn('alt', attrs)
        for tag, attrs in page.elements:
            if tag in ('img', 'script', 'source'):
                src = attrs.get('src', '')
                self.assertFalse(src.startswith('http'), f'Remote dependency: {src}')
                if src:
                    self.assertTrue((ROOT / src).is_file(), f'Missing asset: {src}')
            if tag == 'a' and attrs.get('href', '').startswith('#'):
                target = attrs['href'][1:]
                self.assertTrue(target, 'No dead placeholder links')
                self.assertTrue(any(a.get('id') == target for _, a in page.elements), target)

if __name__ == '__main__':
    unittest.main()
