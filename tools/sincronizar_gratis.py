"""Actualiza promociones de PC verificadas para España."""
import argparse
import json
import os
import re
import tempfile
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

GP = 'https://www.gamerpower.com/api/giveaways?type=game'
EPIC = 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=es-ES&country=ES&allowCountries=ES'
OUTPUT = Path('dist/datos/gratis.json')

def request(url):
    return urlopen(Request(url, headers={'User-Agent': 'AllyLab/1.0', 'Accept': 'application/json'}), timeout=20)

def read(url):
    with request(url) as response:
        data = json.load(response)
        return [] if response.status == 201 else data

def parsed(value):
    return datetime.fromisoformat(value.replace('Z','+00:00'))

def key(title):
    value = re.split(r' \((?:Epic Games(?: Store)?|Steam|GOG)\)', title, flags=re.I)[0]
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', value.casefold()))

def safe(url, hosts):
    p = urlsplit(url or '')
    return p.scheme == 'https' and p.hostname in hosts and not p.username and not p.password

def valid_page(url):
    with request(url) as response:
        return safe(response.url, {'store.epicgames.com'}) and '/p/' in urlsplit(response.url).path

def collect(gamerpower, epic, now, check=valid_page):
    if not isinstance(gamerpower, list) or any(not isinstance(g, dict) for g in gamerpower):
        raise ValueError('Respuesta inesperada de GamerPower')
    candidates = {key(g.get('title','')):g for g in gamerpower
                  if g.get('type')=='Game' and 'Epic Games Store' in g.get('platforms','')
                  and 'PC' in g.get('platforms','') and g.get('status')=='Active'}
    results = {}
    elements = epic['data']['Catalog']['searchStore']['elements']
    if not isinstance(elements, list):
        raise ValueError('Respuesta inesperada de Epic')
    for game in elements:
        price = game['price']['totalPrice']
        categories = {c['path'] for c in game.get('categories', [])}
        if (game['offerType'] != 'BASE_GAME' or 'freegames' not in categories
            or game.get('isCodeRedemptionOnly') or price['currencyCode'] != 'EUR'
            or price['originalPrice'] <= 0 or price.get('voucherDiscount', 0)):
            continue
        slug = next((m['pageSlug'] for m in game.get('offerMappings', []) if m.get('pageType') == 'productHome'), '')
        if not re.fullmatch(r'[a-zA-Z0-9-]+', slug):
            continue
        url = 'https://store.epicgames.com/es-ES/p/' + slug
        gp = candidates.get(key(game['title']))
        images = [i for i in game.get('keyImages', []) if safe(i['url'], {'cdn1.epicgames.com','cdn2.unrealengine.com','cdn2.epicgames.com'})]
        promotions = game.get('promotions') or {}
        for kind in ('promotionalOffers','upcomingPromotionalOffers'):
            for group in promotions.get(kind, []):
                for offer in group['promotionalOffers']:
                    start,end = map(parsed,(offer['startDate'],offer['endDate']))
                    active = start <= now < end
                    discount = offer['discountSetting']
                    if end <= max(now,start) or discount.get('discountType')!='PERCENTAGE' or discount.get('discountPercentage')!=0:
                        continue
                    # Epic confirma precio actual. Los anuncios futuros solo se muestran en Próximos.
                    if active and (kind!='promotionalOffers' or price['discountPrice']!=0):
                        continue
                    if not check(url):
                        continue
                    cover = next((i['url'] for i in images if i['type']=='OfferImageTall'), None)
                    gp_url = (gp or {}).get('gamerpower_url')
                    gp_image = (gp or {}).get('image')
                    entry = dict(id='epic:'+game['id']+':'+start.isoformat(),title=game['title'],platform='Epic Games Store',
                                 description=(gp or {}).get('description') or game.get('description'),start=start.isoformat(),
                                 end=end.isoformat(),url=url,original=price['originalPrice']/(10**price['currencyInfo']['decimals']),
                                 region='ES',cover=cover or (gp_image if safe(gp_image,{'www.gamerpower.com'}) else None),
                                 gallery=list(dict.fromkeys(i['url'] for i in images if i['type']=='featuredMedia'))[:8],
                                 source=gp_url if safe(gp_url,{'www.gamerpower.com'}) else None)
                    results[(key(entry['title']),start.isoformat())] = entry
    return list(results.values())

def refresh(previous, now):
    found = collect(read(GP), read(EPIC), now)
    old = {item['id']:item for item in previous.get('offers', [])}
    offers = [dict(item, added=old.get(item['id'],{}).get('added', now.isoformat())) for item in found]
    # Solo promociones observadas como activas entran en el historial.
    for item in offers:
        item['seenActive'] = parsed(item['start']) <= now or old.get(item['id'],{}).get('seenActive',False)
    ids = {item['id'] for item in offers}
    history = sorted((i for k,i in old.items() if k not in ids and i.get('seenActive') and parsed(i['end'])<=now),key=lambda i:i['end'],reverse=True)
    return dict(checked=now.isoformat(),stale=False,offers=offers+history[:100])

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=OUTPUT)
    path=parser.parse_args().output
    previous=json.loads(path.read_text()) if path.exists() else {}
    try:
        result=refresh(previous,datetime.now(timezone.utc))
    except (OSError,ValueError,KeyError,TypeError) as exc:
        print(f'Actualización pendiente: {exc}')
        result=dict(previous,stale=True) if previous else dict(checked=None,stale=True,offers=[])
    path.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile(mode='w',dir=path.parent,encoding='utf8',delete=False) as stream:
        json.dump(result,stream,ensure_ascii=False,indent=2)
        stream.write('\n')
    os.replace(stream.name,path)
    print(len(result['offers']),'promociones y registros de historial')

if __name__=='__main__':
    main()
