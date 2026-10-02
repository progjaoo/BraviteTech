#!/usr/bin/env python3
"""Aplica a paleta aprovada aos vetores e reexporta o kit sem redesenhar a marca.

Dependências: Inkscape, Pillow, PyMuPDF, python-pptx e ReportLab.
Execute na raiz: python scripts/rebrand-media-kit.py
As matrizes SVG são a fonte de edição. O backup anterior fica em archive/.
"""
from pathlib import Path
from hashlib import sha256
from io import BytesIO
import base64
import os
import re
import subprocess
import xml.etree.ElementTree as ET
from PIL import Image
import fitz

ROOT = Path(__file__).resolve().parents[1]
KIT = ROOT / 'midia-kit'
SVG = 'http://www.w3.org/2000/svg'
ET.register_namespace('', SVG)
COLORS = {
    '#132A21': '#0A0A0A', '#14211D': '#0A0A0A', '#15372E': '#0A0A0A',
    '#17372E': '#0A0A0A', '#000000': '#0A0A0A', '#111111': '#0A0A0A',
    '#B1E634': '#2D6BFF', '#B4F03B': '#2D6BFF', '#F7F6F2': '#FFFFFF',
    '#51665E': '#5A6475', '#557067': '#5A6475', '#66756E': '#5A6475',
    '#CCD4CC': '#D9DEE7', '#CBD2C9': '#D9DEE7', '#D7DED6': '#D9DEE7',
    '#ECEFE8': '#F3F4F6', '#E7EAE3': '#F3F4F6', '#E6EAE4': '#F3F4F6',
    '#E7EBE3': '#F3F4F6', '#EEF1EA': '#F3F4F6', '#B8CABF': '#B6BDC9',
    '#3D574C': '#454B55',
}
def recolor(s):
    return re.sub(r'#[0-9a-fA-F]{6}\b', lambda m: COLORS.get(m[0].upper(), m[0]), s)

def number(s, default=0):
    m = re.search(r'-?[0-9.]+', s or '')
    return float(m[0]) if m else default

def migrate_svg(path):
    original = path.read_text()
    root = ET.fromstring(original)
    rects = []
    bg = '#FFFFFF'
    for e in root.iter():
        tag = e.tag.split('}')[-1]
        if tag == 'rect':
            fill = e.get('fill', '').upper()
            x, y, w, h = (number(e.get(k)) for k in ('x', 'y', 'width', 'height'))
            if fill and w > 0 and h > 0:
                rects.append((x, y, x+w, y+h, fill))
                if x == y == 0 and w >= number(root.get('width')) and h >= number(root.get('height')):
                    bg = fill
        if tag == 'text':
            x, y = number(e.get('x')), number(e.get('y'))
            surface = bg
            for x0, y0, x1, y1, f in rects:
                if x0 <= x <= x1 and y0 <= y <= y1:
                    surface = f
            ink = e.get('fill', '').upper()
            if surface == '#B1E634' and ink != 'none':
                e.set('fill', '#FFFFFF')
            elif surface in ('#132A21', '#14211D', '#0A0A0A'):
                if ink == '#B1E634' and number(e.get('font-size')) < 60:
                    e.set('fill', '#FFFFFF')
                elif ink in ('#51665E', '#557067', '#66756E'):
                    e.set('fill', '#B6BDC9')
    # Peças com fundo azul usam marca e texto brancos, incluindo a versão monocromática.
    if bg == '#B1E634':
        for e in root.iter():
            for attr in ('fill', 'stroke'):
                if e.get(attr, '').upper() in ('#132A21', '#14211D', '#51665E', '#557067'):
                    e.set(attr, '#FFFFFF')
    # O OG traz textos convertidos em curvas; também recebem a correção de contraste.
    if bg in ('#132A21', '#0A0A0A'):
        for g in root.iter(f'{{{SVG}}}g'):
            if g.get('aria-label') == 'bravite.com.br':
                for child in g:
                    if child.get('fill', '').upper() in ('#B1E634', '#2D6BFF'):
                        child.set('fill', '#FFFFFF')
    s = recolor(ET.tostring(root, encoding='unicode'))
    s = s.replace('Concentre a lima', 'Concentre o azul')
    s = s.replace('Geometria de 45°, alinhamento', 'Diagonais da marca, alinhamento')
    s = s.replace('Estrutura / opção 03', 'Estrutura / rebrand 2026')
    s = s.replace('SISTEMA ESTRUTURA / OPÇÃO 03', 'ESTRUTURA / PRETO, AZUL E BRANCO')
    path.write_text(s)

def palette_page():
    def text(x,y,s,size=24,fill='#0A0A0A',weight=400):
        from html import escape
        return f'<text x="{x}" y="{y}" font-family="Space Grotesk" font-size="{size}" font-weight="{weight}" fill="{fill}">{escape(s)}</text>'
    s = f'<svg xmlns="{SVG}" width="1600" height="1000" viewBox="0 0 1600 1000"><title>Bravite — paleta e contraste do rebrand</title><rect width="1600" height="1000" fill="#FFFFFF"/>'
    s += text(80,58,'BRAVITE / GUIA DA MARCA',18,weight=500)+text(1435,58,'06 / 12',18)
    s += '<path d="M80 81H1520 M80 925H1520" stroke="#0A0A0A"/>'
    s += text(80,172,'Cor com função.',64,weight=500)
    s += text(82,224,'Preto dá estrutura. Azul marca a ação. Branco abre espaço.',24,'#5A6475')
    swatches = [('PRETO BRAVITE','#0A0A0A','10 / 10 / 10','#FFFFFF'),('AZUL BRAVITE','#2D6BFF','45 / 107 / 255','#FFFFFF'),('BRANCO','#FFFFFF','255 / 255 / 255','#0A0A0A'),('CINZA DE APOIO','#F3F4F6','243 / 244 / 246','#0A0A0A')]
    for i,(label,color,rgb,ink) in enumerate(swatches):
        x=80+i*369
        s += f'<rect x="{x}" y="286" width="339" height="300" fill="{color}" stroke="#D9DEE7"/>'
        s += text(x+24,343,label,18,ink,700)+text(x+24,489,color,34,ink,500)+text(x+24,541,'RGB '+rgb,21,ink)
    pairs=[('#FFFFFF','#0A0A0A','19,80:1','Preto sobre branco'),('#2D6BFF','#FFFFFF','4,51:1','Branco sobre azul'),('#0A0A0A','#FFFFFF','19,80:1','Branco sobre preto')]
    for i,(surface,ink,ratio,label) in enumerate(pairs):
        x=80+i*492
        s += f'<rect x="{x}" y="640" width="452" height="81" fill="{surface}" stroke="#D9DEE7"/>'
        s += text(x+22,697,'Aa',44,ink,500)+text(x+302,694,ratio,30,ink,500)+text(x,766,label,24,'#5A6475')
    s += text(80,824,'Azul sobre preto: 4,39:1. Use apenas em títulos grandes ou elementos gráficos.',23,'#5A6475')
    s += text(80,870,'Botões: branco sobre azul sólido. Cinza #F3F4F6 é apoio; não é uma nova cor de destaque.',23,'#5A6475')
    s += text(80,963,'BRAVITE.COM.BR',17,weight=500)+text(1320,963,'@BRAVITE.BR',17,weight=500)+'</svg>'
    (KIT/'00-guia/paginas-editaveis/06-paleta-contraste.svg').write_text(s)

def export(path, sizes):
    for ext in ('png','pdf'):
        out=path.with_suffix('.'+ext)
        if not out.exists(): continue
        cmd=['inkscape',str(path),'--export-filename='+str(out)]
        if ext=='png':
            size=sizes.get(str(out))
            if size: cmd += ['--export-width='+str(size[0]),'--export-height='+str(size[1])]
        if ext=='pdf': cmd += ['--export-text-to-path']
        result=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        if result.returncode: raise RuntimeError(result.stderr.decode())

def main():
    build=Path('/tmp/bravite-build');build.mkdir(exist_ok=True)
    fontconf=build/'fonts.conf'
    fontconf.write_text(f'<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include><dir>{KIT}/05-fontes/desktop</dir><cachedir>{build}/font-cache</cachedir></fontconfig>')
    os.environ['FONTCONFIG_FILE']=str(fontconf)
    subprocess.run(['fc-cache','-f'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
    paths=[*KIT.rglob('*.svg'),*ROOT.joinpath('docs/prd/assets').glob('*.svg'),*ROOT.joinpath('branding').glob('03*.svg')]
    sizes={str(f):Image.open(f).size for base in [KIT,ROOT/'docs/prd/assets',ROOT/'branding'] for f in base.rglob('*.png')}
    hashes={sha256(f.read_bytes()).hexdigest():f for f in KIT.rglob('*.png')}
    embedded={}
    for path in paths:
        refs=[]
        for e in ET.parse(path).getroot().iter():
            if e.tag.endswith('image'):
                attr='href' if e.get('href') else '{http://www.w3.org/1999/xlink}href'
                v=e.get(attr,'')
                if v.startswith('data:'):
                    target=hashes.get(sha256(base64.b64decode(v.split(',',1)[1])).hexdigest())
                    if not target:raise RuntimeError(f'Embedded image without source: {path}')
                    refs.append((attr,target))
        if refs:embedded[path]=refs
    for path in paths:migrate_svg(path)
    palette_page()
    for path in paths:
        if path not in embedded:export(path,sizes)
    # As prévias têm dependências: exportar assinatura/cartão antes do painel geral.
    for path in sorted(embedded,key=lambda p:p.name=='visao-geral.svg'):
        root=ET.parse(path).getroot();refs=iter(embedded[path])
        for e in root.iter():
            if e.tag.endswith('image'):
                attr,target=next(refs)
                e.set(attr,'data:image/png;base64,'+base64.b64encode(target.read_bytes()).decode())
        path.write_text(ET.tostring(root,encoding='unicode'));export(path,sizes)
    print('SVG, PNG e PDF reexportados, incluindo imagens incorporadas.',flush=True)
    for stem,files in [('00-guia/bravite-manual-da-marca', sorted((KIT/'00-guia/paginas-editaveis').glob('*.pdf'))),('03-papelaria/cartao-frente-verso',[KIT/'03-papelaria/cartao-frente.pdf',KIT/'03-papelaria/cartao-verso.pdf'])]:
        merged=fitz.open()
        for f in files:
            d=fitz.open(f)
            if 'cartao-' in stem:
                for p in d:
                    inset=3*72/25.4
                    p.set_trimbox(fitz.Rect(inset,inset,p.rect.width-inset,p.rect.height-inset))
                    p.set_bleedbox(p.mediabox)
                temporary=f.with_name(f.stem+'-boxes.pdf');d.save(temporary);d.close();temporary.replace(f);d=fitz.open(f)
            merged.insert_pdf(d);d.close()
        merged.set_metadata({'title':'Bravite — rebrand preto, azul e branco','author':'Bravite'})
        merged.save(KIT/(stem+'.pdf'));merged.close()
    icons=KIT/'04-web/icones'
    source=icons/'bravite-app-icon.svg'
    for size in (16,32,48,192,512):
        subprocess.run(['inkscape',str(source),f'--export-width={size}',f'--export-height={size}',f'--export-filename={icons/f"favicon-{size}.png"}'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    subprocess.run(['inkscape',str(source),'--export-width=180','--export-height=180',f'--export-filename={icons/"apple-touch-icon-180.png"}'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    Image.open(icons/'favicon-512.png').save(icons/'favicon.ico',sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
    subprocess.run(['inkscape',str(ROOT/'branding/03-estrutura-avatar.svg'),'--export-width=32','--export-height=32',f'--export-filename={ROOT/"branding/03-estrutura-favicon-32.png"}'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    subprocess.run(['python',str(KIT/'06-institucional/gerar-apresentacao.py')],check=True,env=os.environ)
    print('Manual, cartões, ícones e apresentação gerados.',flush=True)

if __name__=='__main__':main()
