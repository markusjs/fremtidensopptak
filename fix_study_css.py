#!/usr/bin/env python3
"""
Fikser KUN CSS på studiesidene uten å røre HTML/tilpasninger.

Kristiania har rotert innholds-hashene på /dist CSS-filene (gamle gir 404),
men CSS-modul-klassenavnene er uendret. Vi laster derfor ned gjeldende CSS
lokalt og bytter ut de døde CDN-lenkene med lokale kopier. Handlekurv (basket.js),
__reactProps, skjult dobbelt søkeikon og fravær av cookie-banner bevares.
"""
import os
import re
import requests
from generate_study_pages import PROGRAMS

REPO_DIR = os.path.dirname(os.path.abspath(__file__))
STUDIER_DIR = os.path.join(REPO_DIR, "studier")
DIST_DIR = os.path.join(STUDIER_DIR, "_dist")
CDN = "https://www.kristiania.no"

HEADERS = {
    'User-Agent': ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                   'AppleWebKit/537.36 (KHTML, like Gecko) '
                   'Chrome/120.0.0.0 Safari/537.36'),
    'Accept-Language': 'no,nb;q=0.9,en;q=0.8',
}

# Live-side stilark-lenker (rekkefølge bevart)
LIVE_CSS_RE = re.compile(r'<link[^>]*rel="stylesheet"[^>]*href="(/dist/[^"]+\.css)"')
# Døde CDN-lenker i den lagrede siden
DEAD_CDN_LINK_RE = re.compile(
    r'\s*<link[^>]*rel="stylesheet"[^>]*href="https://www\.kristiania\.no/dist/[^"]+\.css"[^>]*/?>'
)


def fix_css_urls(css):
    css = css.replace('url(/dist/', f'url({CDN}/dist/')
    css = css.replace('url("/dist/', f'url("{CDN}/dist/')
    css = css.replace("url('/dist/", f"url('{CDN}/dist/")
    css = css.replace('url(/contentassets/', f'url({CDN}/contentassets/')
    css = css.replace('url("/contentassets/', f'url("{CDN}/contentassets/')
    css = css.replace("url('/contentassets/", f"url('{CDN}/contentassets/")
    css = re.sub(r'url\((["\']?)(?!https?:|/|data:|#)',
                 lambda m: f'url({m.group(1)}{CDN}/dist/', css)
    return css


def download_css(rel_url):
    """rel_url er '/dist/<navn>.css'. Returnerer lokalt filnavn eller None."""
    basename = rel_url.rsplit('/', 1)[-1]
    local_path = os.path.join(DIST_DIR, basename)
    if os.path.exists(local_path):
        return basename
    url = CDN + rel_url
    try:
        r = requests.get(url, headers=HEADERS, timeout=30)
        if r.status_code != 200:
            print(f"    ADVARSEL {r.status_code}: {url}")
            return None
        with open(local_path, 'w', encoding='utf-8') as f:
            f.write(fix_css_urls(r.text))
        print(f"    lastet ned: {basename}")
        return basename
    except Exception as e:
        print(f"    FEIL {url}: {e}")
        return None


def get_live_css(url):
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    seen, ordered = set(), []
    for rel in LIVE_CSS_RE.findall(r.text):
        if rel not in seen:
            seen.add(rel)
            ordered.append(rel)
    return ordered


def process(url, filename):
    print(f"Behandler: {filename}")
    path = os.path.join(STUDIER_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    if 'kristiania.no/dist/' not in html:
        print("  (ingen døde CDN-css – hopper over)")
        return True

    # 1) Hent gjeldende css-liste fra live-siden + last ned lokalt
    try:
        css_list = get_live_css(url)
    except Exception as e:
        print(f"  FEIL henting: {e}")
        return False

    locals_ = []
    for rel in css_list:
        bn = download_css(rel)
        if bn:
            locals_.append(bn)

    # 2) Fjern alle døde CDN-stilark-lenker
    html = DEAD_CDN_LINK_RE.sub('', html)

    # 3) Sett inn lokale lenker rett før </head>
    links = '\n'.join(
        f'<link rel="stylesheet" href="_dist/{bn}" />' for bn in locals_
    )
    html = html.replace('</head>', links + '\n</head>', 1)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"  OK ({len(locals_)} lokale stilark satt inn)")
    return True


if __name__ == '__main__':
    os.makedirs(DIST_DIR, exist_ok=True)
    ok = 0
    for url, filename, _ in PROGRAMS:
        if process(url, filename):
            ok += 1
    print(f"\n--- Ferdig: {ok}/{len(PROGRAMS)} ---")
