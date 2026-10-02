#!/usr/bin/env python3
"""Gera o PDF do PRD e prévias do exemplo digital a partir de arquivos locais."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from threading import Thread

ROOT=Path(__file__).resolve().parents[1]
BUILD=Path('/tmp/bravite-build')
BUILD.mkdir(exist_ok=True)
class LocalHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(LocalHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}/'

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-breakpad','--disable-crash-reporter'])
    page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
    # Arquivos locais apenas; bloqueia chamadas remotas das páginas de exemplo.
    page.route('**/*',lambda route:route.continue_() if route.request.url.startswith(base) else route.abort())
    for file in ['midia-kit/index.html','midia-kit/04-web/exemplo.html','docs/prd/PRD-Bravite.html']:
        page.goto(base+file,wait_until='load')
        page.evaluate('document.fonts.ready')
        page.evaluate('async () => { const images=Array.from(document.images); images.forEach(i=>i.loading="eager"); await Promise.allSettled(images.map(i=>i.decode())); }')
        missing=page.evaluate('Array.from(document.images).filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute("src"))')
        if missing:raise RuntimeError(f'{file}: imagens ausentes: {missing}')
        print(file, '— imagens locais carregadas',flush=True)
        if file.endswith('exemplo.html'):
            page.screenshot(path=str(ROOT/'midia-kit/04-web/previa-desktop.png'),full_page=True)
            page.set_viewport_size({'width':390,'height':844})
            page.screenshot(path=str(ROOT/'midia-kit/04-web/previa-mobile.png'),full_page=True)
            print('Mobile: largura do documento',page.evaluate('document.documentElement.scrollWidth'),flush=True)
            page.set_viewport_size({'width':1440,'height':1000})
        elif file.endswith('index.html'):
            page.screenshot(path=str(BUILD/'catalogo.png'),full_page=False)
        else:
            page.pdf(path=str(ROOT/'docs/prd/PRD-Bravite.pdf'),format='A4',print_background=True,tagged=True,outline=True,margin={'top':'16mm','bottom':'18mm','left':'15mm','right':'15mm'},display_header_footer=True,header_template='<span></span>',footer_template='<div style="font-family:Arial;font-size:8px;width:100%;text-align:center;color:#5A6475">Bravite · PRD 1.2 · Rebrand 2026 · <span class="pageNumber"></span> / <span class="totalPages"></span></div>')
    browser.close()
server.shutdown()
print('PRD PDF e prévias digitais gerados.',flush=True)
