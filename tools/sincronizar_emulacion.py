"""Genera el catálogo web a partir de fichas revisadas manualmente."""
import argparse
import json
from collections import Counter
from pathlib import Path
import re
import unicodedata
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SETUP = ("Configuración inicial para tu Ally X: selecciona modo Mando en Armoury Crate, "
         "configura la cruceta y botones en mGBA para Windows x64, y usa escalado entero "
         "para mantener los píxeles nítidos. Ajustes de partida, sin mediciones en la consola.")
SYSTEMS = {
    "gb": {"name": "Game Boy", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Game-Boy-Original.png/330px-Game-Boy-Original.png"},
    "gbc": {"name": "Game Boy Color", "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Game-Boy-Color-Purple.png/330px-Game-Boy-Color-Purple.png"},
}
for system in SYSTEMS.values():
    system.update(emulator="mGBA", emulatorUrl="https://mgba.io/downloads.html", setup=SETUP)


def read_jsonl(path):
    with path.open(encoding="utf-8-sig") as stream:
        for number, line in enumerate(stream, 1):
            if not line.strip():
                continue
            try:
                row = json.loads(line)
                if not isinstance(row, dict):
                    raise ValueError("se esperaba un objeto")
            except ValueError as error:
                raise ValueError(f"{path}:{number}: {error}") from error
            yield row


def https_url(value):
    url = urlsplit(value)
    return url.scheme == "https" and url.hostname and not (url.username or url.password)


def build_catalog():
    games, ids, titles = [], set(), set()
    fields = ("id", "system", "title", "edition", "language", "size", "format",
              "download", "cover", "setup")
    for row in read_jsonl(ROOT / "tools/emulacion.jsonl"):
        if any(not isinstance(row.get(key), str) or not row[key].strip() for key in fields):
            raise ValueError("Ficha incompleta")
        if row["system"] not in SYSTEMS or "español" not in row["language"].casefold():
            raise ValueError(f"Sistema o idioma sin verificar: {row['id']}")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", row["id"]):
            raise ValueError(f"Identificador inválido: {row['id']}")
        if not all(https_url(row[key]) for key in ("download", "cover")):
            raise ValueError(f"Enlace HTTPS inválido: {row['id']}")
        if not re.fullmatch(r"\d+(?:[.,]\d+)? (?:kB|MB|GB|B)(?: \(.+\))?", row["size"]):
            raise ValueError(f"Tamaño inválido: {row['id']}")
        title = unicodedata.normalize("NFKC", row["title"]).casefold()
        key = (row["system"], title)
        if row["id"] in ids or key in titles:
            raise ValueError(f"Juego duplicado: {row['title']}")
        ids.add(row["id"])
        titles.add(key)
        games.append({field: row[field] for field in fields})
    if not games:
        raise ValueError("Catálogo vacío")
    return json.dumps({"systems": SYSTEMS, "games": sorted(games, key=lambda row: row["title"].casefold())},
                      ensure_ascii=False, indent=2) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="comprueba que el catálogo está actualizado")
    parser.add_argument("--audit-arley", type=Path, nargs="+", help="resume tipos y campos sin importar enlaces")
    args = parser.parse_args()
    if args.audit_arley:
        for path in args.audit_arley:
            rows = list(read_jsonl(path))
            print(path.name, len(rows), dict(Counter(row.get("type") for row in rows)),
                  sorted({key for row in rows for key in row}))
        return
    target = ROOT / "dist/datos/emulacion.json"
    catalog = build_catalog()
    if args.check:
        if target.read_text(encoding="utf-8") != catalog:
            parser.exit(1, "El catálogo publicado difiere del inventario.\n")
    else:
        temporary = target.with_suffix(".tmp")
        temporary.write_text(catalog, encoding="utf-8")
        temporary.replace(target)


if __name__ == "__main__":
    main()
