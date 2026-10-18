#!/usr/bin/env python3
"""Importa resultados JSON/JSONL do Google Maps Scraper para o Cloud Firestore."""
import hashlib
import json
import os
import sys
from datetime import datetime, timezone


def value(item, *keys):
    for key in keys:
        current = item.get(key)
        if current not in (None, ""):
            return current
    return None


def read_payload(path):
    """Aceita JSON (lista/objeto) e JSON Lines, formatos comuns do scraper."""
    with open(path, "r", encoding="utf-8-sig") as handle:
        raw = handle.read().strip()
    if not raw:
        return []
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        payload = []
        for line_number, line in enumerate(raw.splitlines(), start=1):
            if not line.strip():
                continue
            try:
                payload.append(json.loads(line))
            except json.JSONDecodeError as exc:
                raise ValueError(f"JSON/JSONL inválido na linha {line_number}: {exc.msg}") from exc
    if isinstance(payload, dict):
        for key in ("results", "places", "data", "items"):
            if isinstance(payload.get(key), list):
                return payload[key]
        return [payload]
    if not isinstance(payload, list):
        raise ValueError("Formato inesperado: esperava uma lista, objeto ou JSONL.")
    return payload


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
    """Normaliza os aliases do scraper e remove duplicatas do mesmo arquivo."""
    payload = read_payload(path)
    rows_by_place = {}
    search_query = os.environ.get("SEARCH_QUERY", "").strip() or None
    now = datetime.now(timezone.utc).isoformat()
    for item in payload:
        if not isinstance(item, dict):
            continue
        name = value(item, "name", "title", "company")
        place_id = value(item, "place_id", "placeId", "cid", "data_id", "link", "url")
        if not name or not place_id:
            continue
        rating_raw = value(item, "rating", "review_rating")
        try:
            rating = float(rating_raw) if rating_raw is not None else None
        except (TypeError, ValueError):
            rating = None
        if rating is not None and not 0 <= rating <= 5:
            rating = None
        review_raw = value(item, "review_count", "reviews_count", "reviews", "user_ratings_total")
        try:
            reviews = int(review_raw) if review_raw is not None else None
        except (TypeError, ValueError):
            reviews = None
        category = value(item, "category", "categories", "type")
        if isinstance(category, list):
            category = ", ".join(str(part) for part in category if part)
        elif category is not None:
            category = str(category)
        address = value(item, "address", "complete_address", "formatted_address")
        phone = value(item, "phone", "phone_number")
        website = value(item, "website", "site", "url_website")
        emails = normalize_emails(value(item, "emails", "email"))
        row = {
            # Legacy snake_case aliases are retained for the existing offline tests/import clients.
            "user_id": user_id,
            "ownerId": user_id,
            "place_id": str(place_id),
            "placeId": str(place_id),
            "name": str(name).strip(),
            "nome": str(name).strip(),
            "address": address,
            "endereco": address,
            "phone": phone,
            "telefone": phone,
            "website": website,
            "site": website,
            "emails": emails,
            "email": emails[0] if emails else None,
            "rating": rating,
            "nota": rating,
            "review_count": reviews,
            "numeroAvaliacoes": reviews,
            "category": category,
            "ramo": category,
            "region": search_query,
            "regiao": search_query,
            "score": 0,
            "status": "novo",
            "source": "google_maps_scraper",
            "origem": "google_maps_scraper",
            "raw_data": item,
            "criadoEm": now,
            "atualizadoEm": now,
        }
        rows_by_place[row["place_id"]] = row
    return list(rows_by_place.values())


def firestore_document_id(place_id):
    # Document IDs cannot contain '/', and hashes avoid oversized IDs from Maps URLs.
    return hashlib.sha256(str(place_id).encode("utf-8")).hexdigest()


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Uso: import_scraper_results.py caminho/resultados.json")
    user_id = os.environ.get("FIREBASE_UID", "").strip()
    project_id = os.environ.get("FIREBASE_PROJECT_ID", "").strip()
    database_id = os.environ.get("FIRESTORE_DATABASE_ID", "(default)").strip() or "(default)"
    raw_credentials = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY", "").strip()
    if not user_id or not project_id or not raw_credentials:
        raise SystemExit("FIREBASE_UID, FIREBASE_PROJECT_ID e FIREBASE_SERVICE_ACCOUNT_KEY são obrigatórios.")
    try:
        parsed_account = json.loads(raw_credentials)
    except json.JSONDecodeError as exc:
        raise SystemExit("FIREBASE_SERVICE_ACCOUNT_KEY precisa conter JSON válido.") from exc

    rows = load_rows(sys.argv[1], user_id)
    if not rows:
        print("Nenhum resultado válido para importar; não foram criados leads fictícios.")
        return

    try:
        import firebase_admin
        from firebase_admin import auth, credentials, firestore
    except ImportError as exc:
        raise SystemExit("Dependência ausente. Instale firebase-admin antes da importação.") from exc

    credential = credentials.Certificate(parsed_account)
    app_name = "ledsnet-scraper-import"
    try:
        app = firebase_admin.get_app(app_name)
    except ValueError:
        app = firebase_admin.initialize_app(credential, {"projectId": project_id}, name=app_name)

    try:
        auth.get_user(user_id, app=app)
    except Exception as exc:
        raise SystemExit(f"FIREBASE_UID não corresponde a uma conta Firebase válida neste projeto: {exc}") from exc

    client = firestore.client(app=app, database_id=None if database_id in ('', '(default)') else database_id)
    collection = client.collection("users").document(user_id).collection("leads")
    saved = 0
    for row in rows:
        ref = collection.document(firestore_document_id(row["place_id"]))
        existing = ref.get()
        if existing.exists:
            row["id"] = existing.id
            row["criadoEm"] = (existing.to_dict() or {}).get("criadoEm", row["criadoEm"])
        else:
            row["id"] = ref.id
        ref.set(row, merge=True)
        saved += 1
    print(f"Importação concluída: {saved} leads gravados no Cloud Firestore (UID proprietário: {user_id}).")


if __name__ == "__main__":
    main()
