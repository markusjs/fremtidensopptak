#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bygg de lokale enkeltemnesidene i prototypen.

De 253 sidene med slug-filnavn (enkeltemner/merkevareledelse.html osv.) er
generert med dette skriptet. De 8 opprinnelige sidene er håndscrapet med
«save page as» og har egne *_files/-mapper – dem rører skriptet ikke.

Hvorfor splicing og ikke bare nedlasting: live-HTML-en fra kristiania.no er
server-rendret for alt emneinnhold (hero, kjøpsknapp, faktatabell, akkordeoner,
«Dette emnet inngår i»), men *topbaren er fullstendig React-rendret*. React
hydrerer aldri i prototypen – alle /dist/*.chunk.js 404-er – så en side bygget
rett fra live-HTML får ingen topbar, og dermed ingen handlekurv eller
«Min søknad»-teller. Derfor tas chrome (topbar, mega-meny, footer, basket.js)
fra en av de håndscrapede sidene, og emneinnholdet splices inn fra live.

Assets deles i enkeltemner/_felles/. De matches på bundle-navn, ikke hash:
kristiania.no bygges om jevnlig, så /dist/30466.<ny-hash>.css må mappes til den
lokale 30466.<gammel-hash>_tupb.css.

Bruk:
    python3 tools/build-enkeltemner.py              # bygg alle som mangler side
    python3 tools/build-enkeltemner.py --only hrm   # bygg én side
    python3 tools/build-enkeltemner.py --refetch     # tving ny nedlasting
    python3 tools/build-enkeltemner.py --assets      # last ned manglende bundles

Etterpå: legg nye sider inn i localPages i studietilbud-search.js, ellers vises
de ikke i søket på /utdanning (søket viser kun oppføringer som har lokal side).
"""
import argparse
import io
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENK = os.path.join(ROOT, 'enkeltemner')
FELLES_DIR = os.path.join(ENK, '_felles')
CACHE = os.path.join(ROOT, '.cache', 'enkeltemner-live')

# Håndscrapet side som gir chrome. Må være lagret etter React-hydrering.
SHELL_NAME = 'Ta emnet Innføring i strategi på nett'
SHELL = os.path.join(ENK, SHELL_NAME + '.html')
SHELL_FILES = SHELL_NAME + '_files/'
FELLES = '_felles/'

SOK = '/sok-skjema.html'          # lokal søknadsflyt
BASE = 'https://www.kristiania.no'
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

# Finnes ikke i repoet i det hele tatt, og 404-er likt på alle sider fra før.
BASELINE_MISSING = {'iconsSprite.svg', 'GraphikRegular.woff', 'GraphikMedium.woff',
                    'GraphikSemibold.woff', 'GraphikBold.woff', 'ProduktSemibold.woff'}


def fetch(url, timeout=45):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    return urllib.request.urlopen(req, timeout=timeout).read()


def asset_key(fn):
    """Bundle-identitet uten hash og uten scrape-suffiks."""
    fn = re.sub(r'_[A-Za-z0-9]{4}(?=(\.[A-Za-z0-9]+)?$)', '', fn)
    m = re.match(r'^(.*?)((?:\.chunk)?)\.[0-9a-f]{8,32}(\.[A-Za-z0-9]+)$', fn)
    return (m.group(1) + m.group(2) + m.group(3)) if m else fn


def load_assets():
    assets = {}
    for f in sorted(os.listdir(FELLES_DIR)):
        assets.setdefault(asset_key(f), f)
    return assets


def load_catalog():
    """Katalogen slik studietilbud-data.js har den."""
    src = io.open(os.path.join(ROOT, 'studietilbud-data.js'), encoding='utf-8').read()
    return json.loads(src[src.index('['):src.rindex(']') + 1])


def mapped_link_urls():
    """linkUrl-er som allerede har en lokal side (localPages i søket)."""
    src = io.open(os.path.join(ROOT, 'studietilbud-search.js'), encoding='utf-8').read()
    start = src.index('var localPages = {')
    blk = src[start:src.index('  };', start)]
    return set(re.findall(r"'(/studier/[^']+)':", blk))


def cache_name(link_url):
    return re.sub(r'[^A-Za-z0-9._-]', '_', link_url.strip('/')) + '.html'


def get_live(link_url, refetch=False):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, cache_name(link_url))
    if refetch or not os.path.exists(p) or os.path.getsize(p) < 5000:
        io.open(p, 'wb').write(fetch(BASE + link_url))
    return io.open(p, encoding='utf-8', errors='replace').read()


def localize_assets(html, assets, unresolved):
    def sub(m):
        k = asset_key(m.group(1))
        if k in assets:
            return FELLES + assets[k]
        if k not in BASELINE_MISSING:
            unresolved.add(m.group(1))
        return m.group(0)
    return re.sub(r'/dist/([A-Za-z0-9~._-]+\.(?:css|js|woff2?|svg))', sub, html)


def localize_application_urls(html):
    """Alt som fører til kjøp/søknad skal peke på den lokale flyten.

    Live legger URL-en i React-props (onlineApplicationUrl / campusApplicationUrl)
    og fyller «Gå til din søknad»-lenken derfra; server-HTML-en rendrer den med
    tom href.
    """
    html = html.replace('href="%s/checkout/"' % BASE, 'href="%s"' % SOK)
    html = html.replace('href="/checkout/"', 'href="%s"' % SOK)
    html = html.replace('"href":"/checkout/"', '"href":"%s"' % SOK)
    html = html.replace('"onlineApplicationUrl":"/checkout/"', '"onlineApplicationUrl":"%s"' % SOK)
    html = html.replace('"campusApplicationUrl":"/soknad/"', '"campusApplicationUrl":"%s"' % SOK)
    html = re.sub(r'<a href=""(?=[^>]*>(?:<div[^>]*>)?\s*(?:Gå|G&#xE5;) til din s(?:ø|&#xF8;)knad)',
                  '<a href="%s"' % SOK, html)
    return html


def absolutize_relative(html):
    """Rot-relative lenker gjøres absolutte, ellers 404-er de mot prototypen.

    MERK: «Dette emnet inngår i»-lenkene beholder kanonisk
    /studier/nettstudier/bachelor/...-sti. basket.js kobler emnet til
    studieprogram på nettopp den stien (programKeyFromHref + COMPLETED_BY_PROGRAM)
    og filtrerer på /bachelor/. Skriver man dem om til lokale sidenavn, slutter
    «fortsett på påbegynt studieprogram» å virke.
    """
    def abs_href(m):
        p = m.group(2)
        if p.startswith(('/sok-skjema', '/utdanning')):
            return m.group(0)
        return '%s="%s%s"' % (m.group(1), BASE, p)
    return re.sub(r'\b(href)="(/(?!/)[^"]*)"', abs_href, html)


def build(live_html, assets):
    """Sett sammen én side. Returnerer (html, uløste assets)."""
    shell = io.open(SHELL, encoding='utf-8').read()
    START, END = '<article class="SubjectPage">', '<footer'
    la = live_html.index(START); lb = live_html.index(END, la)
    sa = shell.index(START);     sb = shell.index(END, sa)

    unresolved = set()
    body = absolutize_relative(localize_assets(live_html[la:lb], assets, unresolved))

    head = shell[:sa].replace(SHELL_FILES, FELLES)
    tail = shell[sb:].replace(SHELL_FILES, FELLES)

    # tittel + description fra live
    m = re.search(r'<title>.*?</title>', live_html, re.S)
    if m:
        head = re.sub(r'<title>.*?</title>', lambda _: m.group(0), head, count=1, flags=re.S)
    m = re.search(r'<meta name="description" content="[^"]*"', live_html)
    if m:
        head = re.sub(r'<meta name="description" content="[^"]*"', lambda _: m.group(0), head, count=1)

    # CSS-bundles denne siden trenger, men shell-headen ikke laster
    need = {asset_key(f) for f in re.findall(r'_felles/([A-Za-z0-9~._-]+\.css)', body)}
    have = {asset_key(f) for f in re.findall(r'_felles/([A-Za-z0-9~._-]+\.css)', head)}
    extra = ''.join('<link rel="stylesheet" href="%s%s">' % (FELLES, assets[k])
                    for k in sorted(need - have) if k in assets)
    if extra:
        head = head.replace('</head>', extra + '</head>', 1)

    # Kjøps-URL-er finnes både i innholdet og i header-propsene fra shell-en.
    return localize_application_urls(head + body + tail), unresolved


def download_missing_assets(catalog, refetch=False):
    """Hent /dist-bundles som sidene trenger men _felles/ mangler."""
    assets = load_assets()
    want = {}
    for it in catalog:
        if it['levelLabel'] != 'Enkeltemne':
            continue
        p = os.path.join(CACHE, cache_name(it['linkUrl']))
        if not os.path.exists(p):
            continue
        s = io.open(p, encoding='utf-8', errors='replace').read()
        for m in re.finditer(r'/dist/([A-Za-z0-9~._-]+\.(?:css|js))', s):
            k = asset_key(m.group(1))
            if k not in assets and k not in BASELINE_MISSING:
                want.setdefault(k, m.group(1))
    for k, fn in sorted(want.items()):
        try:
            io.open(os.path.join(FELLES_DIR, fn), 'wb').write(fetch(BASE + '/dist/' + fn))
            print('  hentet  %s' % fn)
        except Exception as e:
            print('  FEIL    %s (%s)' % (fn, e))
    if not want:
        print('  ingen manglende bundles')
    return len(want)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', help='bygg bare denne slugen')
    ap.add_argument('--refetch', action='store_true', help='last ned live-HTML på nytt')
    ap.add_argument('--assets', action='store_true', help='hent manglende /dist-bundles først')
    args = ap.parse_args()

    catalog = load_catalog()
    enkeltemner = [i for i in catalog if i['levelLabel'] == 'Enkeltemne']

    # Emner som er dekket av en håndscrapet side skal ikke genereres. De
    # kjennes igjen på at localPages-målet har en egen *_files/-mappe.
    handmade = set()
    src = io.open(os.path.join(ROOT, 'studietilbud-search.js'), encoding='utf-8').read()
    start = src.index('var localPages = {')
    for m in re.finditer(r"'(/studier/[^']+)': '/enkeltemner/([^']+)'",
                         src[start:src.index('  };', start)]):
        if os.path.isdir(os.path.join(ENK, m.group(2) + '_files')):
            handmade.add(m.group(1))

    targets = [(it['linkUrl'].rstrip('/').split('/')[-1], it)
               for it in enkeltemner if it['linkUrl'] not in handmade]
    if args.only:
        targets = [t for t in targets if t[0] == args.only]
        if not targets:
            sys.exit('fant ikke slug: %s' % args.only)

    print('laster ned live-HTML (%d emner, cache: %s)' % (len(targets), CACHE))
    for slug, it in targets:
        try:
            get_live(it['linkUrl'], refetch=args.refetch)
        except Exception as e:
            print('  FEIL %s: %s' % (slug, e))

    if args.assets:
        print('sjekker assets:')
        download_missing_assets(catalog, args.refetch)

    assets = load_assets()
    written, fails, unresolved = 0, [], {}
    for slug, it in targets:
        try:
            live = get_live(it['linkUrl'])
            html, unres = build(live, assets)
            io.open(os.path.join(ENK, slug + '.html'), 'w', encoding='utf-8').write(html)
            written += 1
            for u in unres:
                unresolved[u] = unresolved.get(u, 0) + 1
        except Exception as e:
            fails.append((slug, '%s: %s' % (type(e).__name__, e)))

    print('\nskrevet: %d sider' % written)
    if fails:
        print('feilet: %d' % len(fails))
        for f in fails[:15]:
            print('   %s -> %s' % f)
    print('uløste assets:', unresolved or 'ingen')
    if unresolved:
        print('  (kjør med --assets for å hente dem)')


if __name__ == '__main__':
    main()
