#!/usr/bin/env python3
"""Sincroniza a documentação e os tokens com o rebrand Bravite de 01/10/2026."""
from pathlib import Path
import json, re
import runpy
ROOT=Path(__file__).resolve().parents[1]
COLORS=runpy.run_path(str(Path(__file__).with_name('rebrand-media-kit.py')))['COLORS']
KIT=ROOT/'midia-kit'
PRD=ROOT/'docs/prd'

def convert(s):
    s=re.sub(r'#[0-9a-fA-F]{6}\b',lambda m:COLORS.get(m[0].upper(),m[0]),s)
    for old,new in [('logo-verde','logo-principal'),('verde-floresta','preto'),('verde floresta','preto'),('Verde floresta','Preto'),('verde profundo','preto'),('VERDE ESTRUTURA','PRETO BRAVITE'),('Verde','Preto'),('verde','preto'),('verdes','pretas'),('Lima','Azul'),('lima','azul'),('floresta','preto'),('Floresta','Preto'),('branco quente','branco'),('--forest','--black'),('--lime','--blue'),('--paper','--white'),('bravite-forest','bravite-black'),('bravite-lime','bravite-blue'),('bravite-paper','bravite-white'),('color-forest','color-black'),('color-lime','color-blue'),('color-paper','color-white'),('brand.forest','brand.black'),('brand.lime','brand.blue'),('surface.paper','surface.white')]:
        s=s.replace(old,new)
    return s

# Mantém o código das apresentações editável e alinhado aos arquivos de marca.
p=KIT/'06-institucional/gerar-apresentacao.py';s=p.read_text()
for a,b in [('forest','black'),('lime','blue'),('paper','white'),('verde','principal')]:s=s.replace(a,b)
for a,b in COLORS.items():s=s.replace(a[1:],b[1:])
s=s.replace("'white':'FFFFFF','muted'", "'white':'FFFFFF','muted'")
s=s.replace("('clara',C['white'])", "('clara',C['white'])")
s=s.replace("txt(74,379,'SOFTWARE HOUSE',12,700,'black'", "txt(74,379,'SOFTWARE HOUSE',12,700,'white'")
s=s.replace("txt(x+10,268,n,15,700,width=28)", "txt(x+10,268,n,15,700,'white',width=28)")
s=s.replace("16,500,'blue' if dark else 'black'", "16,500,'white' if dark else 'black'")
s=s.replace("12,500,'blue',width=240", "12,500,'white',width=240")
p.write_text(s)
for f in (KIT/'06-institucional/recursos').glob('logo-verde.*'):
    f.rename(f.with_name(f.name.replace('logo-verde','logo-principal')))

for base in (KIT,PRD):
    for p in base.rglob('*'):
        if p.suffix in ('.md','.html','.css','.json','.txt','.webmanifest') and p.name!='OFL.txt':
            p.write_text(convert(p.read_text()))

# Fontes completas para português, sem colisão entre subconjuntos latin/latin-ext.
p=KIT/'04-web/bravite.css';s=p.read_text();s=s[s.index(':root'):]
fontcss='/* Bravite 2.0 — paleta aprovada: preto, azul e branco. */\n'
for w in (400,500,700):
    fontcss+=f"@font-face {{ font-family:'Space Grotesk'; font-weight:{w}; font-style:normal; font-display:swap; src:url('../05-fontes/desktop/SpaceGrotesk-{w}.ttf') format('truetype'); }}\n"
s=s.replace('  --bravite-white: #FFFFFF;\n  --bravite-white: #FFFFFF;', '  --bravite-white: #FFFFFF;\n  --bravite-gray: #F3F4F6;\n  --bravite-muted: #5A6475;\n  --bravite-border: #D9DEE7;')
s=s.replace('color: var(--bravite-black); background: var(--bravite-blue);','color: var(--bravite-white); background: var(--bravite-blue);')
s=s.replace('border: 2px solid var(--bravite-black); border-radius: 0;', 'border: 2px solid var(--bravite-blue); border-radius: 0;')
s+='\n.bravite-dark .bravite-button:hover { color:var(--bravite-black); background:var(--bravite-white); border-color:var(--bravite-white); }\n.bravite-button:focus-visible { outline:3px solid currentColor; outline-offset:4px; }\n'
# Focus follows the surrounding surface, rather than the button's white text.
s=s.replace('.bravite-button:focus-visible { outline:3px solid currentColor; outline-offset:4px; }', '.bravite-ui .bravite-button:focus-visible { outline:3px solid var(--bravite-black); outline-offset:4px; }\n.bravite-dark .bravite-button:focus-visible { outline-color:var(--bravite-white); }')
p.write_text(fontcss+s)

p=KIT/'index.html';s=p.read_text().replace('class="lime"','class="blue"').replace('.lime{','.blue{')
s=s.replace('.top span{color:var(--blue)', '.top span{color:white')
s=s.replace('text-decoration:none;color:var(--black);font-weight:700}', 'text-decoration:none;color:white;font-weight:700}')
s=s.replace('.links a:hover{background:var(--blue)}','.links a:hover{background:var(--blue);color:white}')
s=s.replace('border:1px solid var(--line);background:white;color:var(--black);padding:10px 14px', 'border:1px solid var(--muted);background:white;color:var(--black);padding:10px 14px')
s=s.replace('</style>','*:focus-visible{outline:3px solid #0A0A0A;outline-offset:4px}header :focus-visible,footer :focus-visible{outline-color:#FFFFFF}</style>')
p.write_text(s)

p=KIT/'04-web/exemplo.html';s=p.read_text()
s=s.replace('#15372e33','#0a0a0a33').replace('background:#2D6BFF;color:#0A0A0A','background:#2D6BFF;color:#FFFFFF')
s=s.replace('Papel · #FFFFFF','Branco · #FFFFFF')
s=s.replace('</div>\n  <p class="example-footer">','<div class="example-swatch" style="background:#F3F4F6;color:#0A0A0A">Cinza de apoio · #F3F4F6</div>\n  </div>\n  <p class="example-footer">')
p.write_text(s)
p=KIT/'04-web/README.md';s=p.read_text()
s=re.sub(r'Textos em preto funcionam.*?branco\.', 'Use texto preto em fundo branco e texto branco em fundo preto. Nos botões azuis, use branco sólido (4,51:1). Azul sobre preto (4,39:1) fica restrito a títulos grandes e detalhes gráficos.',s)
p.write_text(s)
p=KIT/'01-logos/README.md';s=p.read_text().replace('A marca em azul puro não é uma variante fornecida.', 'Sobre fundo azul #2D6BFF, use a variante branca monocromática.').replace('ou colocar o detalhe azul sobre fundo claro fora da composição original','ou alterar a faixa central azul fora das variantes fornecidas');p.write_text(s)
p=KIT/'06-institucional/LEIA-ME.md';p.write_text(p.read_text().replace('a versão clara apenas troca o preto pelo tom claro da paleta','a versão clara usa branco com faixa central azul'))
p=KIT/'03-papelaria/LEIA-ME.md';s=p.read_text().replace('O preto azul pode mudar na impressão.','O azul pode mudar na impressão.').replace('papel #FFFFFF','branco #FFFFFF');p.write_text(s)

def luminance(h):
    v=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    return sum((c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4)*w for c,w in zip(v,(.2126,.7152,.0722)))
def contrast(a,b):
    lo,hi=sorted((luminance(a),luminance(b)))
    return round((hi+.05)/(lo+.05),2)

t=json.loads((PRD/'design-system.tokens.json').read_text())
t['meta'].update(version='2.0',authority='Paleta aprovada pelo proprietário em 01/10/2026; geometria da opção 03 preservada')
t['color']={
 'black':{'value':'#0A0A0A','type':'color','source':'approved:rebrand','usage':'primary text and dark surfaces'},
 'blue':{'value':'#2D6BFF','type':'color','source':'approved:rebrand','usage':'logo central band, accents and solid CTA background with white text'},
 'white':{'value':'#FFFFFF','type':'color','source':'approved:rebrand','usage':'light surfaces and inverse text'},
 'gray':{'value':'#F3F4F6','type':'color','source':'recommended:neutral-support','usage':'secondary surfaces'},
 'muted':{'value':'#5A6475','type':'color','source':'recommended:functional-neutral','usage':'secondary text on white'},
 'mutedInverse':{'value':'#B6BDC9','type':'color','source':'recommended:functional-neutral','usage':'secondary text on black'},
 'subtleBorder':{'value':'#D9DEE7','type':'color','source':'recommended:functional-neutral','usage':'decorative divider; use muted for input outlines'},
 'error':{'value':'#B42318','type':'color','source':'proposed:functional-extension'},
 'warning':{'value':'#955B00','type':'color','source':'proposed:functional-extension'},
 'info':{'value':'#2D6BFF','type':'color','source':'brand:functional-role'},
 'success':{'value':'#0A0A0A','type':'color','source':'brand:functional-role','usage':'confirmation with text and icon'},
}
t['contrast']={k:contrast(a,b) for k,a,b in [('blackOnWhite','#0A0A0A','#FFFFFF'),('whiteOnBlue','#FFFFFF','#2D6BFF'),('blueOnBlack','#2D6BFF','#0A0A0A'),('blackOnGray','#0A0A0A','#F3F4F6'),('mutedOnWhite','#5A6475','#FFFFFF'),('mutedOnGray','#5A6475','#F3F4F6'),('mutedInverseOnBlack','#B6BDC9','#0A0A0A'),('subtleBorderOnWhite','#D9DEE7','#FFFFFF')]}
t['contrastUsage']={'primaryButton':'white on blue, without opacity','blueOnDark':'large headings or graphics only; normal text must be white','normalText':'minimum 4.5:1','largeText':'minimum 3:1'}
(PRD/'design-system.tokens.json').write_text(json.dumps(t,ensure_ascii=False,indent=2)+'\n')
kit_tokens=json.loads(json.dumps(t))
kit_tokens['meta']['specification']='REBRAND.md e 00-guia/bravite-manual-da-marca.pdf'
kit_tokens['logo'].update(primary='01-logos/horizontal/bravite-horizontal-principal.svg',onDark='01-logos/horizontal/bravite-horizontal-reversa.svg',master='06-institucional/recursos/logo-original-opcao03.svg')
(KIT/'04-web/design-system.tokens.json').write_text(json.dumps(kit_tokens,ensure_ascii=False,indent=2)+'\n')

p=PRD/'design-system.css';s=p.read_text()
s=s.replace('  --bravite-white: #FFFFFF;\n  --bravite-white: #FFFFFF;', '  --bravite-white: #FFFFFF;\n  --bravite-gray: #F3F4F6;\n  --bravite-muted-inverse: #B6BDC9;')
s=s.replace('  --color-white: var(--bravite-white);','  --color-white: var(--bravite-white);\n  --color-brand-gray: var(--bravite-gray);')
s=s.replace('--bravite-info: #175CD3','--bravite-info: #2D6BFF')
s=s.replace('border: 2px solid var(--bravite-black);','border: 2px solid var(--bravite-blue);')
s=s.replace('background: var(--bravite-blue);\n  color: var(--bravite-black);','background: var(--bravite-blue);\n  color: var(--bravite-white);')
p.write_text(s)

palette='''### 6.2 Cores e papéis

Paleta aprovada pelo proprietário no rebrand de 01/10/2026. A geometria da opção 03 permanece como matriz; as cores abaixo substituem as cores dos anexos anteriores.

| Token | Valor | Origem | Uso |
| --- | --- | --- | --- |
| `brand.black` | `#0A0A0A` | Proprietário | Fundos fortes, títulos e texto principal |
| `brand.blue` | `#2D6BFF` | Proprietário | Faixa central da logo, acentos gráficos e CTA |
| `surface.white` | `#FFFFFF` | Proprietário | Fundo claro e texto reverso |
| `surface.gray` | `#F3F4F6` | Cinza de apoio recomendado | Fundos secundários e separação de conteúdo |
| `text.primary` | `#0A0A0A` | Marca | Texto principal em fundo claro |
| `text.muted` | `#5A6475` | Neutro funcional | Legendas em fundo claro |
| `text.mutedInverse` | `#B6BDC9` | Neutro funcional | Legendas em fundo preto |
| `border.subtle` | `#D9DEE7` | Neutro funcional | Divisor decorativo; inputs usam contorno muted |
| `state.error` | `#B42318` | Extensão funcional | Erros com texto e ícone |
| `state.warning` | `#955B00` | Extensão funcional | Avisos com texto e ícone |
| `state.info` | `#2D6BFF` | Marca | Informação com texto e ícone |
| `state.success` | `#0A0A0A` | Marca | Confirmação com texto e ícone |

O cinza é apoio neutro. Preto e branco organizam a composição; azul concentra o destaque. Cores de feedback ficam limitadas aos estados funcionais. A paleta do template não prevalece sobre esta especificação.

### 6.3 Contraste medido

Razões pela luminância relativa sRGB. WCAG AA: 4,5:1 para texto normal; 3:1 para texto grande (24 px regular ou aproximadamente 18,7 px bold) e indicadores essenciais.

| Combinação | Razão aproximada | Regra |
| --- | --- | --- |
| Preto sobre branco / branco sobre preto | 19,80:1 | Qualquer texto |
| Branco sobre azul / azul sobre branco | 4,51:1 | Texto normal; cor sólida, sem reduzir opacidade |
| Azul sobre preto / preto sobre azul | 4,39:1 | Somente texto grande e elementos gráficos; não usar em labels pequenos |
| Preto sobre cinza de apoio | 17,98:1 | Qualquer texto |
| Muted sobre branco | 5,98:1 | Texto normal |
| Muted sobre cinza de apoio | 5,43:1 | Texto normal |
| Muted inverse sobre preto | 10,49:1 | Texto normal |
| Borda subtle sobre branco | 1,35:1 | Apenas divisor decorativo |

Botão primário: fundo azul e texto branco sólido. Sobre preto, textos pequenos são brancos; azul aparece em faixas, grafismos e títulos grandes. A marca reversa é branca com faixa azul; sobre azul, usar a versão branca monocromática. Não aplicar filtros, transparência ou gradientes à assinatura.

'''
# Ratios are inserted from measured tokens, keeping the source of truth consistent.
for approximate,key in [('17,98','blackOnGray'),('5,43','mutedOnGray'),('10,49','mutedInverseOnBlack'),('1,35','subtleBorderOnWhite')]:
    palette=palette.replace(approximate,str(t['contrast'][key]).replace('.',','))
p=PRD/'PRD-Bravite.md';s=p.read_text()
s=re.sub(r'### 6\.2 Cores e papéis.*?(?=### 6\.4 Logo)',lambda m:palette,s,flags=re.S)
s=s.replace('**Versão:** 1.1','**Versão:** 1.2')
s=s.replace('superior/inferior pretos e central azul','superior/inferior pretas e central azul')
s=s.replace('Primário azul/preto; hover preto/branco; secundário contorno preto','Primário azul/branco; hover preto/branco; secundário contorno preto')
s=s.replace('CTA, acentos gráficos, destaque sobre fundo escuro','CTA, acentos gráficos e títulos grandes')
s=s.replace('`logo-principal.svg` enviado','`logo-principal.svg` rebrand').replace('`logo-clara.svg` enviado','`logo-clara.svg` rebrand')
s=s.replace('papel e azul','branco e azul').replace('papel `#FFFFFF` + azul','branco `#FFFFFF` + azul')
s=s.replace('preto, papel e branco, usando azul como acento','preto e branco, com cinza de apoio e azul como acento')
s=s.replace('papel em escuro','branco em escuro').replace('papel em fundo escuro','branco em fundo escuro')
s=s.replace('anexos vetoriais mais recentes prevalecem em caso de divergência','geometria aprovada e a paleta do rebrand de 01/10/2026 prevalecem sobre cores dos anexos anteriores')
s=s.replace('Os documentos anexados são materiais de referência.', 'A paleta do rebrand aprovada em 01/10/2026 substitui as cores dos anexos anteriores. Os documentos anexados são materiais de referência.')
p.write_text(s)

# HTML retains its complete original renderer/layout; replace changed sections from Markdown.
def inline(s):
    from html import escape
    s=escape(s);s=re.sub(r'`([^`]+)`',r'<code>\1</code>',s)
    return s
def html_section(md):
    out=[];table=False
    for line in md.splitlines():
        if line.startswith('|'):
            if re.match(r'^\|\s*-',line):continue
            vals=[v.strip() for v in line.strip('|').split('|')]
            if not table:out.append('<div class="table-scroll"><table>');table=True;tag='th'
            else:tag='td'
            out.append('<tr>'+''.join(f'<{tag}>'+inline(v)+f'</{tag}>' for v in vals)+'</tr>')
        else:
            if table:out.append('</table></div>');table=False
            if line.startswith('### 6.2'):out.append('<h3 id="6-2-cores-e-pap-is">6.2 Cores e papéis</h3>')
            elif line.startswith('### 6.3'):out.append('<h3 id="6-3-contraste-medido">6.3 Contraste medido</h3>')
            elif line.strip():out.append('<p>'+inline(line)+'</p>')
    if table:out.append('</table></div>')
    return '\n'.join(out)+'\n'
p=PRD/'PRD-Bravite.html';h=p.read_text()
h=re.sub(r'<h3 id="6-2-cores-e-pap-is">.*?(?=<h3 id="6-4-logo)',lambda m:html_section(palette),h,flags=re.S)
for a,b in [('VERSÃO 1.1','VERSÃO 1.2'),('Primário azul/preto','Primário azul/branco'),('superior/inferior pretos','superior/inferior pretas'),('papel e azul','branco e azul'),('papel <code>#FFFFFF</code> + azul','branco <code>#FFFFFF</code> + azul'),('preto, papel e branco, usando azul como acento','preto e branco, com cinza de apoio e azul como acento'),('papel em escuro','branco em escuro'),('papel em fundo escuro','branco em fundo escuro'),('os anexos vetoriais mais recentes prevalecem em caso de divergência','a geometria aprovada e a paleta do rebrand de 01/10/2026 prevalecem sobre cores dos anexos anteriores'),('class="eyebrow"','class="eyebrow"')]:h=h.replace(a,b)
h=h.replace('.eyebrow{color:var(--blue)', '.eyebrow{color:#FFFFFF')
p.write_text(h)

p=PRD/'INSTRUCOES-REPLIT.md';s=p.read_text()
s=re.sub(r'Azul sobre branco/(?:papel|cinza).*?preto como texto\.', 'Branco sobre azul sólido tem contraste 4,51:1 e é o padrão do botão primário. Azul sobre preto tem 4,39:1: reservar a títulos grandes ou grafismos. Textos pequenos em fundo preto usam branco.',s)
s=s.replace('Preto `#0A0A0A`, azul `#2D6BFF`, papel `#FFFFFF`, branco `#FFFFFF`','Preto `#0A0A0A`, azul `#2D6BFF`, branco `#FFFFFF`, cinza de apoio `#F3F4F6`')
s=s.replace('Use logo preto em fundo claro','Use logo principal em fundo claro')
s=s.replace('branco/papel','branco/cinza').replace('cores vêm do mídia kit Bravite','cores vêm do mídia kit Bravite após o rebrand de 01/10/2026')
p.write_text(s)
p=PRD/'NEXSTUDIO-AUDITORIA.md';s=p.read_text()
s=s.replace('CTA azul com texto preto','CTA azul com texto branco').replace('papel `#FFFFFF`, branco e preto','branco, cinza de apoio `#F3F4F6` e preto')
p.write_text(s)

start=KIT/'COMECE-AQUI.md';s=start.read_text()
s=s.replace('# Bravite — mídia kit da opção 03, Estrutura','# Bravite — mídia kit 2.0 / rebrand')
s=s.replace('## Comece aqui','**Paleta atual:** preto `#0A0A0A`, azul `#2D6BFF`, branco `#FFFFFF`. **Apoio recomendado:** cinza `#F3F4F6`. A geometria da opção 03 permanece intacta; esta versão substitui as cores do kit anterior.\n\nLeia [a direção do rebrand](REBRAND.md) e consulte os tokens em `04-web/design-system.tokens.json`.\n\n## Comece aqui')
start.write_text(s)
print('Documentação, CSS, tokens e apresentação sincronizados.')
