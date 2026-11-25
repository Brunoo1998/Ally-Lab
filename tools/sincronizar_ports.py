"""Actualizar desde el catálogo público. Un error deja intacta la última copia válida."""
import argparse
import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from normalizar_ports import normalizar

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'dist/datos/ports.json'
CATALOG = 'https://recomplauncher.com/pc-catalog.json'

def dump_atomic(data):
    with tempfile.NamedTemporaryFile(mode='w', encoding='utf8', dir=OUTPUT.parent, delete=False) as f:
        try:
            json.dump(data, f, separators=(',', ':'), ensure_ascii=False, allow_nan=False)
            f.write('\n')
            f.flush()
            os.fsync(f.fileno())
        except Exception:
            os.unlink(f.name)
            raise
    os.replace(f.name, OUTPUT)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archivo', type=Path, help='Procesar una copia local del mismo catálogo.')
    args = parser.parse_args()
    old = json.loads(OUTPUT.read_text()) if OUTPUT.exists() else {}
    headers = {'User-Agent': 'AllyLab-Catalog/1.0', 'Accept': 'application/json'}
    etag=old.get('meta', {}).get('etag', '')
    if etag: headers['If-None-Match']=etag
    if args.archivo:
        raw = json.loads(args.archivo.read_text())
        etag=''
    else:
        try:
            with urlopen(Request(CATALOG, headers=headers), timeout=25) as response:
                raw=json.load(response)
                etag=response.headers.get('ETag','')
        except HTTPError as e:
            if e.code==304:
                print('La fuente confirma que el catálogo sigue vigente.'); return
            raise
    if raw.get('platform')!='pc' or not isinstance(raw.get('apps'),list) or not raw['apps']:
        raise ValueError('Respuesta de catálogo incompleta.')
    projects=normalizar(raw)
    expected={a['id'] for a in raw['apps']}
    for block in raw.get('apps_min',[]):
        expected.update(a['id'] for a in block.get('apps',[]))
    if len(projects)!=len(expected) or {p['id'] for p in projects}!=expected:
        raise ValueError('Faltan proyectos o hay identificadores duplicados.')
    if not all(p.get('group') and p.get('game') and p.get('platform') for p in projects):
        raise ValueError('Faltan datos esenciales.')
    if old and len(projects)<.85*len(old['projects']):
        raise ValueError('Reducción superior al 15 %: se conserva el catálogo hasta revisar la fuente.')
    verified=json.loads((ROOT/'tools/repos-ports.json').read_text())
    tests=json.loads((ROOT/'tools/notas-ports.json').read_text())
    if old and all([projects==old['projects'],verified==old['verified'],tests==old['tests'],raw.get('updated')==old['meta']['updated']]):
        print('Sin cambios.');return
    meta=dict(source=CATALOG,updated=raw['updated'],synced=datetime.now(timezone.utc).isoformat(),etag=etag)
    dump_atomic(dict(meta=meta,projects=projects,verified=verified,tests=tests))
    print(f'{len(projects)} proyectos, {len({p["platform"] for p in projects})} plataformas.')
if __name__=='__main__':main()
