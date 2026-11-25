"""Convierte el catálogo PC de RecompStore en metadatos de consulta en español."""

import re
import unicodedata
from urllib.parse import urlsplit, urlunsplit


ORIGENES_ES = {
    "gc": "Nintendo GameCube", "dc": "Dreamcast", "saturn": "Sega Saturn",
    "genesis": "Mega Drive / Genesis", "s32x": "Sega 32X", "gg": "Game Gear",
    "pce": "PC Engine / TurboGrafx-16", "mobile": "Móviles", "other": "Otras plataformas",
}
SISTEMAS = {"windows": "Windows", "linux": "Linux", "macos": "macOS"}
ESTADOS = {"ended": "Desarrollo finalizado", "paused": "Desarrollo en pausa", "complete": "Proyecto completado"}


def limpio(value):
    return " ".join(str(value or "").split())


def clave(value):
    return re.sub(r"[^a-z0-9]+", " ", unicodedata.normalize("NFKD", limpio(value)).encode("ascii", "ignore").decode().lower()).strip()


def plataformas(doc):
    """Devuelve los orígenes declarados por la fuente, incluso si no tienen proyectos."""
    return [
        {"id": item["id"], "name": ORIGENES_ES.get(item["id"], item["name"])}
        for item in doc.get("origins", [])
    ]


def url_https(value):
    """Conserva una URL navegable del catálogo, sin credenciales ni esquemas ejecutables."""
    url = urlsplit(limpio(value))
    if url.scheme != "https" or not url.hostname or url.username or url.password:
        return ""
    return urlunsplit(url)


def repositorio(app):
    repo = limpio(app.get("repo"))
    if not repo or any(c.isspace() for c in repo):
        return ""
    if "://" in repo:
        return url_https(repo)
    host = (app.get("host") or "github").lower()
    if host in ("github", "gitlab"):
        if not re.fullmatch(r"[\w.-]+(?:/[\w.-]+)+", repo):
            return ""
        return f"https://{host}.com/{repo}"
    if host in ("forgejo", "gitea") and re.fullmatch(r"[\w.-]+\.[\w.-]+(?:/[\w.-]+)+", repo):
        return url_https("https://" + repo)
    return ""


# Expresiones para el tipo de proyecto. Los textos editoriales sirven de evidencia y no se publican.
def tipo(app):
    nombre, juego = clave(app.get("name")), clave(app.get("game"))
    titulo_tecnico = nombre.replace(juego, "").strip() if juego else nombre
    resumen = clave(limpio(app.get("blurb"))[:320])
    datos = resumen + " " + titulo_tecnico
    if re.search(r"\b(?:decompilation and recompilation|decompilation and static recompilation)\b", datos):
        return "Descompilación y recompilación"
    if re.search(r"\b(?:source port|port of the source code)\b", datos):
        return "Port del código fuente"
    if re.search(r"\b(?:via|through|by|using|via a|of the|native|static|statically|binary|full|direct) (?:static |native |binary )?(?:recompil\w+|recomp)\b|\brecompilacion estatica\b|\brecompiled (?:from|for|to run|with)\b|\b(?:xenonrecomp|n64recomp|rexglue)\b", datos):
        return "Recompilación"
    if re.search(r"recomp(?:iled|ilation|ile|ilado)?\b", titulo_tecnico) or re.search(r"\b(?:recompiled|recompilation)\b", resumen):
        return "Recompilación"
    if re.search(r"\b(?:decompilation|decomp|decompiled|decompilacion)\b", datos):
        return "Descompilación"
    if re.search(r"\b(?:reimplementation|re implementation|engine recreation|engine reimplementation|reimplements|reimplementacion)\b", datos):
        return "Reimplementación"
    if re.search(r"\b(?:a |fan |fan made |unofficial |open source )remake (?:of|for)\b|\b(?:rust|fan made|fan) remake\b", resumen) or re.search(r"\bremake\b", titulo_tecnico):
        return "Remake"
    if re.search(r"^(?:(?:an? |the |all in one |unofficial |open source |windows |custom |game |pc |native |desktop |graphical |gui )+)?(?:launcher|frontend)\b|^(?:setup and tools |tools )for\b", resumen) or re.search(r"\b(?:launcher|frontend)\b", titulo_tecnico):
        return "Lanzador o herramienta"
    if re.search(r"^(?:(?:an? |the |unofficial |standalone |open source |multiplatform |cross platform |experimental )+)?(?:\w+ )?emulator (?:for|of)\b|\bruns (?:in|on|through) (?:the )?(?:dolphin|pcsx2|rpcs3|xenia|shadps4)\b", resumen) or re.search(r"\bemulator\b", titulo_tecnico):
        return "Emulación"
    if re.search(r"\b(?:cross platform wrapper|compatibility layer|compatibility wrapper)\b", datos):
        return "Capa de compatibilidad"
    if re.search(r"\b(?:game engine|engine rewrite|engine recreation|open source engine)\b", datos):
        return "Motor de juego"
    if re.search(r"^(?:an? |the )?(?:(?:unofficial|community|overhaul|conversion|widescreen|remaster|graphics|restoration|texture|expansion|fan) )*(?:mod|patch|translation) (?:for|of|that|to)\b", resumen):
        return "Mod o parche"
    if re.search(r"\b(?:port|portage|ported|adaptacion nativa|native version|native pc|native windows|natively on|native game|as a standalone pc program)\b", datos):
        return "Port para PC"
    return "Proyecto de catálogo"


def estado(app):
    explicit = app.get("status")
    if explicit:
        return ESTADOS.get(explicit, limpio(explicit))
    if app.get("archived"):
        return "Repositorio archivado"
    if app.get("soon"):
        return "Próximamente"
    if app.get("version") and app.get("released"):
        return "Versión publicada"
    return "Sin estado indicado"


_TAGS = {
    "Widescreen|Widescree": "Pantalla panorámica",
    "Ultrawide|Ultrawidescreen": "Pantalla ultrapanorámica",
    "Controller|Controller Support": "Mando",
    "Keyboard & Mouse|Keyboard and Mouse|Mouse and Keyboard": "Teclado y ratón",
    "Keyboard": "Teclado", "Gyro": "Giroscopio", "Mouse Look": "Cámara con ratón",
    "High FPS": "Altas tasas de fotogramas", "High Resolution": "Alta resolución",
    "Upscaling": "Reescalado", "Upscaling/FSR|FSR": "AMD FSR", "DLSS|DLSS Support": "NVIDIA DLSS",
    "Framegen": "Generación de fotogramas", "Adaptive aspect-ratio": "Relación de aspecto adaptable",
    "Experimental Ultrawide": "Ultrapanorámico experimental", "Ray Tracing": "Trazado de rayos",
    "HD Textures|HD Texture": "Texturas HD", "Texture Packs": "Paquetes de texturas",
    "Mods|Mod Support": "Mods", "Online": "Juego en línea", "Netplay": "Netplay",
    "Multiplayer": "Multijugador", "Split Screen": "Pantalla dividida",
    "Local Co-op": "Cooperativo local", "Co-op": "Cooperativo", "Achievements": "Logros",
    "Save States": "Estados guardados", "Save Manager": "Gestión de partidas",
    "Cheats|Cheat Menu": "Trucos", "Randomizer": "Randomizador",
    "Fan Translation": "Traducción de la comunidad", "DLC": "Contenido descargable",
    "4K Shadows": "Sombras en 4K", "FOV": "Campo de visión ajustable",
    "3D Conversion": "Conversión a 3D", "Shaders": "Shaders", "Rewind": "Rebobinado",
}
ETIQUETAS = {clave(tag): es for grupo, es in _TAGS.items() for tag in grupo.split("|")}
for _tag in ["4K", "1440p", "HDR", "VRR"]:
    ETIQUETAS[clave(_tag)] = _tag


def caracteristicas(app):
    # Las etiquetas proceden del proyecto. Las cifras describen funciones, nunca mediciones de la Ally.
    features = []
    for tag in app.get("tags", []) + app.get("features", []):
        key = clave(tag)
        result = ETIQUETAS.get(key)
        if not result and (match := re.fullmatch(r"(\d{2,3}) ?fps(?: support)?", key)):
            result = f"{match[1]} FPS"
        if result and result not in features:
            features.append(result)
    return features


_FILE_FORMAT = re.compile(r"(?<![\w])\.?(ISO|XISO|ROMFS|EXEFS|XCI|NSP|NUP|CHD|RVZ|GDI|GCM|WAD|Z64|N64|V64|XEX|XBE|PKG|PBP|CCI|CSO|3DSX|GBC|NDS|CUE|BIN|WIA|GCZ|CISO)(?![\w])", re.I)
_REGIONS = [
    (r"\b(?:ntsc[- ]u|usa|north america(?:n)?|us release|us version)\b", "Norteamérica"),
    (r"\b(?:europe(?:an)?|europe pal|pal version|pal release)\b", "Europa"),
    (r"\b(?:ntsc[- ]j|japan(?:ese)?)\b", "Japón"),
    (r"\b(?:any region|all regions|region.free)\b", "cualquier región"),
]


def requisitos(app):
    original = limpio(app.get("needs"))
    if not original:
        return ""
    txt = original.lower()
    if re.match(r"nothing\b", txt):
        if "demo" in txt:
            return "Incluye una demo. Los demás contenidos los aporta el jugador."
        return "Datos iniciales incluidos en la distribución."
    if re.search(r"\b(?:your|own|legally owned|original (?:disc|game|rom|files)|su[ao] (?:copia|cópia)|tu copia|bought on steam)\b", txt):
        labels = ["Copia propia del juego"]
    elif re.search(r"\b(?:dump|rom|image|iso|disc|cartucho|files|rip)\b", txt):
        labels = ["Archivos del juego original"]
    else:
        labels = []
    # Se evitan confusiones entre una plataforma (N64, GBC) y la extensión de un archivo.
    formatos = []
    for match in _FILE_FORMAT.finditer(original):
        upper = match[1].upper()
        if upper in {"N64", "GBC", "NDS"} and not match[0].startswith("."):
            continue
        if upper not in formatos:
            formatos.append(upper)
    if formatos:
        labels.append("Formatos citados " + ", ".join(formatos))
    for pattern, region in _REGIONS:
        if re.search(pattern, txt):
            labels.append(region)
    ids = list(dict.fromkeys(re.findall(r"\b(?:[A-Z]{4}[- ]?\d{4,5}|[0-9A-F]{8})\b", original)))
    if ids:
        labels.append("ID " + ", ".join(ids[:5]))
    actualizaciones = re.findall(r"\b(?:version|revision|update|patch|rev\.?|versión|actualización|v)\s*[:(]?\s*(\d+(?:\.\d+){1,3}[a-z]?)\b", txt)
    if actualizaciones:
        labels.append("Versión " + ", ".join(dict.fromkeys(actualizaciones)))
    if re.search(r"\bsteam\b", txt):
        labels.append("Steam")
    if not labels:
        return "El proyecto especifica requisitos propios."
    return " · ".join(labels)


def normalizar(doc):
    nombres = {p["id"]: p["name"] for p in plataformas(doc)}
    grupos = {t["id"]: t for t in doc.get("titles", [])}
    por_proyecto = {pid: t["id"] for t in grupos.values() for pid in t.get("pc", [])}
    por_id = {a["id"]: (a, "") for a in doc.get("apps", [])}
    for condicion in doc.get("apps_min", []):
        for app in condicion.get("apps", []):
            por_id.setdefault(app["id"], (app, limpio(condicion.get("min"))))

    registros = []
    for pid, (app, minimo) in por_id.items():
        grupo = app.get("title") or por_proyecto.get(pid)
        grupo_editorial = grupos.get(grupo, {})
        nombre_juego = limpio(grupo_editorial.get("name") or app.get("game") or app["name"])
        origin = limpio(app.get("origin"))
        incluidos = []
        for miembro in app.get("games", []):
            subid = pid + "--" + miembro["id"]
            subgrupo = miembro.get("title") or por_proyecto.get(subid)
            g = grupos.get(subgrupo, {})
            incluidos.append({
                "id": subid, "group": subgrupo or "app:" + subid,
                "game": limpio(g.get("name") or miembro.get("name")),
                "cover": url_https(miembro.get("cover")),
            })
        portable = app.get("handheld") or {}
        registros.append({
            "id": pid, "name": limpio(app["name"]), "game": nombre_juego,
            "group": grupo or "app:" + pid, "origin": origin, "platform": nombres.get(origin, origin),
            "author": limpio(app.get("author")), "repo": repositorio(app),
            "version": limpio(app.get("version")), "date": limpio(app.get("released")),
            "cover": url_https(app.get("cover")), "type": "Emulación" if pid == "nx2navi" else tipo(app), "status": estado(app),
            "systems": [SISTEMAS.get(s, s) for s in app.get("systems", [])],
            "features": caracteristicas(app), "needs": requisitos(app), "license": limpio(app.get("license")),
            "includedGames": incluidos, "minLauncher": minimo,
            "handheldDevices": list(portable.get("devices", [])) if portable.get("ok") is True else [],
            "archived": bool(app.get("archived")), "upcoming": bool(app.get("soon")),
            "preferred": (grupo_editorial.get("pick") == "pc:" + pid),
        })
    return registros
