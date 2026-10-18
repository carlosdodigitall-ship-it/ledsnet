"""Testes offline do adaptador de resultados do scraper."""
import json
import os
import tempfile
import unittest
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import import_scraper_results as importer


class ScraperImportTests(unittest.TestCase):
    def write_temp(self, content):
        handle = tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False)
        try:
            handle.write(content)
            return handle.name
        finally:
            handle.close()

    def tearDown(self):
        if hasattr(self, "path") and os.path.exists(self.path):
            os.unlink(self.path)

    def test_gosom_fields_and_email_normalization(self):
        self.path = self.write_temp(json.dumps([
            {
                "title": "Clínica Exemplo",
                "link": "https://www.google.com/maps/place/clinica-exemplo",
                "address": "Salvador, BA",
                "phone": "+55 71 3333-4444",
                "website": "https://example.com",
                "review_rating": 4.7,
                "review_count": 19,
                "category": "Clínica",
                "emails": ["CONTATO@EXAMPLE.COM", "contato@example.com"]
            }
        ], ensure_ascii=False))
        rows = importer.load_rows(self.path, "firebase-uid")
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["name"], "Clínica Exemplo")
        self.assertEqual(rows[0]["place_id"], "https://www.google.com/maps/place/clinica-exemplo")
        self.assertEqual(rows[0]["rating"], 4.7)
        self.assertEqual(rows[0]["review_count"], 19)
        self.assertEqual(rows[0]["emails"], ["contato@example.com"])
        self.assertEqual(rows[0]["user_id"], "firebase-uid")

    def test_jsonl_and_duplicate_removal(self):
        self.path = self.write_temp(
            '{"title":"Empresa A","cid":"123","review_rating":4.2}\n'
            '{"title":"Empresa A atualizada","cid":"123","review_rating":4.4}\n'
            '{"title":"Empresa B","cid":"456"}\n'
        )
        rows = importer.load_rows(self.path, "uid")
        self.assertEqual(len(rows), 2)
        by_id = {row["place_id"]: row for row in rows}
        self.assertEqual(by_id["123"]["name"], "Empresa A atualizada")
        self.assertEqual(by_id["123"]["rating"], 4.4)

    def test_empty_file_returns_no_leads(self):
        self.path = self.write_temp("  \n")
        self.assertEqual(importer.load_rows(self.path, "uid"), [])

    def test_invalid_jsonl_reports_line(self):
        self.path = self.write_temp('{"title":"ok","cid":"1"}\n{bad json}\n')
        with self.assertRaisesRegex(ValueError, "linha 2"):
            importer.load_rows(self.path, "uid")


if __name__ == "__main__":
    unittest.main()
