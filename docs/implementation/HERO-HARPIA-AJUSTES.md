# Hero e contato — Bravite

Referência visual inspecionada em 2 de outubro de 2026: https://harpia.digital/, em Chromium desktop (1440 × 1000) e mobile (390 × 844). A hero da Harpia apresenta uma onda de símbolos azuis em profundidade. A Bravite usa esse princípio de movimento contínuo e composição discreta na sua própria cena de galáxia, mantendo a identidade, conteúdo e planetas da marca.

## Cena Three.js

- `WebGLRenderer.setAnimationLoop` com delta em segundos controla a cena; GSAP mantém as timelines de entrada e os efeitos de scroll. Motion continua responsável pelas transições dos componentes.
- A câmera perspectiva tem FOV de 42°, iluminação direcional e ambiente, materiais Standard e texturas procedurais locais. Os planetas têm rotação, flutuação leve e atmosfera; as partículas formam três braços de uma galáxia em movimento.
- O tamanho dos planetas é calculado em pixels e convertido para unidades da câmera na profundidade de cada corpo. No desktop, os diâmetros máximos dos corpos são 120 / 80 / 40 px (o anel amplia o segundo corpo para até 146 px). No mobile, os máximos são 48 / 30 / 20 px. A composição reserva a região central para título e CTAs.
- O ponteiro move a câmera com interpolação exponencial e parallax de profundidade. Eventos de toque não movem a câmera nem capturam o scroll.
- Pausa manual, movimento reduzido, hero fora da viewport e aba oculta interrompem o loop. O retorno começa com delta zero, sem salto. O pixel ratio é limitado a 1,5 no desktop e 1,25 no mobile.
- ResizeObserver recalcula projeção e escala. Geometrias, materiais, texturas, listeners e contexto são liberados no unmount. A perda de WebGL exibe o fundo estático, também disponível sem JavaScript.

## Navegação e WhatsApp

Serviços mantém a semântica de `details` / `summary` e fecha ao clicar fora, mover foco para fora, pressionar Escape ou navegar. Escape devolve foco ao summary.

O botão flutuante usa o azul Bravite e um link direto para `https://wa.me/5524999119722`, com a mensagem inicial definida em `brand.whatsapp`. Está nas páginas públicas, com nome acessível, foco visível, tooltip, área de toque de 52/56 px e proteção de safe areas. Diálogos nativos ficam acima do botão. `/admin` mantém seu shell próprio.

## Atualizar a cópia local

Com o servidor parado e a árvore local limpa:

```bash
cd /Users/joaomvalente/Projetos/BraviteTech
git pull --ff-only
npm run dev
```

Não há alteração de dependências nesta entrega. As verificações do navegador são executadas no checkout da nuvem; a sessão não tem acesso ao filesystem nem às abas localhost do Mac.

## Verificações concluídas

Chromium com WebGL em desktop 1440 × 1000, mobile 390 × 844 / 320 × 740 e tablet 768 × 900:

- A página respondeu HTTP 200. Comparação de frames confirmou movimento contínuo, quadro estável durante pausa e retomada. Matrizes enviadas ao WebGL mudaram com o ponteiro, confirmando parallax real da câmera.
- A cena interrompeu o loop ao sair da viewport e ao ativar movimento reduzido. Perda e restauração reais do contexto WebGL alternaram corretamente entre fundo estático e cena ativa.
- Serviços permaneceu aberto em clique interno e fechou em clique externo, Escape e Tab para fora. Escape devolveu foco ao summary. O submenu mobile fechou por clique externo e Escape, preservando a hierarquia com o diálogo principal.
- Navegação para serviço removeu o canvas; retorno à home criou somente um. O WhatsApp manteve a posição fixa, área de toque e link direto, permaneceu abaixo dos diálogos e foi omitido do admin.
- Não houve overflow horizontal ou sobreposição entre o botão WhatsApp e o controle de pausa nos viewports verificados. O fundo estático e o link WhatsApp permaneceram disponíveis sem WebGL e sem JavaScript.
- Nenhum erro inesperado de JavaScript ou shader foi registrado nas interações. O teste que desativa WebGL produz o diagnóstico esperado do Three.js e confirma o fundo estático. O endpoint de intenção de análise foi interceptado; nenhum lead nem mensagem foram enviados.
- `npm run build --workspace=@bravite/web` passou, incluindo TypeScript e geração de todas as páginas do frontend.

Prévia: [desktop](previews/hero-refined-desktop.png), [mobile 390 px](previews/hero-refined-mobile-390.png), [mobile 320 px](previews/hero-refined-mobile-320.png).
