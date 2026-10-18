#!/usr/bin/env python3
"""Importa resultados JSON do gosom/google-maps-scraper no Supabase REST API."""
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

def value(item, *keys):
    for key in keys:
        current = item.get(key)
        if current not in (None, ""):
            return current
    return None

def normalize_emails(raw):
    if raw is None:
        return []
    if isinstance(raw, str):
        raw = raw.replace(",", ";").split(";")
    if not isinstance(raw, list):
        return []
    seen, result = set(), []
    for entry in raw:
        email = str(entry).strip().lower()
        if email and "@" in email and email not in seen:
            seen.add(email)
            result.append(email)
    return result

def load_rows(path, user_id):
    with open(path, "r", encoding="utf-8") as f:
        payload = json.load(f)
    if isinstance(payload, dict):
        payload = payload.get("results", payload.get("places", payload.get("data", [])))
    if not isinstance(payload, list):
        raise ValueError("Formato JSON inesperado: esperava uma lista de resultados.")
    rows = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        name = value(item, "name", "title", "company")
        place_id = value(item, "place_id", "placeId", "cid", "data_id", "url")
        if not name or not place_id:
            continue
        try:
            rating = float(value(item, "rating")) if value(item, "rating") is not None else None
        except (TypeError, ValueError):
            rating = None
        review_raw = value(item, "reviews", "review_count", "reviews_count", "user_ratings_total")
        try:
            reviews = int(review_raw) if review_raw is not None else None
        except (TypeError, ValueError):
            reviews = None
        rows.append({
            "user_id": user_id,
            "place_id": str(place_id),
            "name": str(name).strip(),
            "address": value(item, "address", "complete_address", "formatted_address"),
            "phone": value(item, "phone", "phone_number"),
            "website": value(item, "website", "site", "url_website"),
            "emails": normalize_emails(value(item, "emails", "email")),
            "rating": rating,
            "review_count": reviews,
            "category": value(item, "category", "categories", "type"),
            "source": "google_maps_scraper",
            "raw_data": item,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    return rows

def main():
    if len(sys.argv) != 2:
        raise SystemExit("Uso: import_scraper_results.py caminho/resultados.json")
    base = os.environ.get("SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    user_id = os.environ.get("FIREBASE_UID", "").strip()
    if not base.startswith("https://") or not key or not user_id:
        raise SystemExit("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e FIREBASE_UID são obrigatórios.")
    rows = load_rows(sys.argv[1], user_id)
    if not rows:
        print("Nenhum resultado válido para importar; não foram criados leads fictícios.")
        return
    endpoint = base + "/rest/v1/ledsnet_leads?on_conflict=user_id%2Cplace_id"
    saved = 0
    for start in range(0, len(rows), 100):
        batch = rows[start:start + 100]
        request = urllib.request.Request(
            endpoint,
            data=json.dumps(batch, ensure_ascii=False).encode("utf-8"),
            headers={
                "apikey": key,
                "Authorization": "Bearer " + key,
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                if response.status not in (200, 201, 204):
                    raise RuntimeError("Supabase respondeu HTTP " + str(response.status))
                saved += len(batch)
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            raise SystemExit(f"Supabase HTTP {exc.code}: {body[:1200]}")
    print(f"Importação concluída: {saved} leads enviados para Supabase (UID proprietário: {user_id}).")

if __name__ == "__main__":
    main()
