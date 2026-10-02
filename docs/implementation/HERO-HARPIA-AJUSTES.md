# Hero e contato — Bravite

Referência visual inspecionada em 2 de outubro de 2026: https://harpia.digital/, em Chromium desktop (1440 × 1000) e mobile (390 × 844). A Harpia apresenta uma fita de símbolos azuis que muda de forma continuamente, com profundidade e reação local ao ponteiro. A inspeção dos contextos gráficos confirmou Canvas2D nessa referência. A Bravite usa uma implementação própria desse princípio, com Three.js, os planetas solicitados e a identidade da marca.

## Diagnóstico e correção da animação parada

O usuário relatou planetas visíveis, mas imóveis no Mac. A cópia da nuvem respondeu HTTP 200, inicializou WebGL e apresentou frames diferentes no Chromium padrão e em renderização por software. Isso não confirma o estado da aba local do Mac: esta sessão não tem acesso àquele navegador nem ao filesystem `/Users/joaomvalente/Projetos/BraviteTech`. O MOV enviado excedeu o limite de transferência de 32 MiB e não foi aberto; a referência foi analisada na versão pública.

Dois comportamentos da implementação anterior podiam deixar o fundo estático: falha de WebGL levava a um SVG/CSS imóvel, e a preferência de movimento reduzido desabilitava o botão de ativação. A galáxia também girava lentamente como um conjunto rígido, produzindo pouca mudança de silhueta. A revisão corrige esses comportamentos sem atribuir uma causa não confirmada ao navegador do Mac.

## Cena e ciclo de vida

- `hero-galaxy.tsx` possui um único `requestAnimationFrame` para controlar tempo, ponteiro, pausa e visibilidade. GSAP mantém as timelines e o scroll; Motion mantém as transições de componentes. O fundo não escreve nas propriedades controladas por essas bibliotecas.
- O Canvas2D anima desde a hidratação, enquanto `hero-webgl.ts` carrega dinamicamente. A troca para Three.js acontece depois de dimensionar e renderizar o primeiro frame com sucesso. Não depende de `requestIdleCallback` para iniciar.
- `hero-field.ts` compartilha a composição entre os renderers: uma fita galáctica azul com partículas e símbolos, torção, mudanças de largura e deslocamento em profundidade. O ponteiro tem interpolação exponencial, parallax da câmera e deformação local da fita.
- No Three.js, posições são recalculadas e enviadas em um `BufferAttribute` com `DynamicDrawUsage`. O shader desenha partículas e símbolos de um atlas criado localmente. A câmera perspectiva tem FOV de 42°, iluminação direcional e ambiente; os planetas usam `SphereGeometry`, materiais Standard, texturas procedurais e um anel no segundo corpo. Não há dependência de imagens ou serviços externos.
- Os diâmetros máximos dos corpos são 84 / 56 / 30 px no desktop e 40 / 26 / 16 px no mobile. O anel amplia o segundo corpo em até 1,8 vez. A escala em pixels é convertida para unidades da câmera na profundidade de cada planeta. O centro permanece reservado para título e CTAs.
- Falha no carregamento do módulo, indisponibilidade de WebGL2, falha de shader e perda do contexto preservam a alternativa Canvas2D animada. Depois de uma perda de contexto, Canvas2D permanece ativo até a próxima montagem da hero; não há tentativas repetidas de recriar o contexto perdido. Sem JavaScript ou sem ambos os contextos gráficos, o CSS/SVG estático permanece visível.
- Pausa manual, hero fora da viewport e aba oculta interrompem o loop. O retorno começa com delta zero, sem salto. O delta é limitado a 50 ms e o pixel ratio a 1,5 no desktop e 1,25 no mobile. A fita usa 2.376 partículas no desktop e 864 no mobile.
- Movimento reduzido inicia o fundo pausado. O botão ▶ permite ativação explícita, apenas para esse fundo; a escolha manual prevalece enquanto a hero estiver montada. Sem escolha manual, mudanças da preferência do sistema são acompanhadas em tempo real. As demais animações do site continuam respeitando a preferência.
- Eventos de toque não movem a câmera nem capturam o scroll. `ResizeObserver` recalcula projeção e escala. RAF, observers, listeners, geometrias, materiais, texturas e contexto são liberados ao desmontar a hero.
- Atributos técnicos disponíveis para diagnóstico, sem interface adicional: `data-engine` (`webgl`, `canvas2d`, `static`), `data-renderer` (`loading`, `ready`, `fallback`) e `data-motion` (`running`, `paused`). `ready` exige que um frame tenha sido renderizado com sucesso.

## Navegação e WhatsApp

Serviços mantém a semântica de `details` / `summary`. No desktop, abre ao passar o mouse e permanece aberto durante o trajeto até os links; sai ao retirar o mouse, desde que o foco não esteja dentro do menu. Clique e teclado continuam disponíveis. No mobile, abre por toque. Também fecha ao clicar fora, mover foco para fora, pressionar Escape ou navegar. Escape devolve foco ao summary.

O botão flutuante usa o azul Bravite e um link direto para `https://wa.me/5524999119722`, com a mensagem inicial definida em `brand.whatsapp`. Está nas páginas públicas, com nome acessível, foco visível, tooltip, área de toque de 52/56 px e proteção de safe areas. Diálogos nativos ficam acima do botão. `/admin` mantém seu shell próprio.

## Atualizar a cópia local

Pare o servidor com Ctrl+C e, com a árvore local limpa, execute:

```bash
cd /Users/joaomvalente/Projetos/BraviteTech
git pull --ff-only
npm run dev
```

Não há alteração de dependências nesta entrega. Se houver mudanças locais, preserve-as antes de atualizar; os comandos não fazem reset nem removem arquivos. Abra novamente `http://localhost:3000/`. Se a hero apresentar ▶ por movimento reduzido, use o botão para ativar o fundo.

## Verificações

Os testes de navegador foram executados na cópia em nuvem, sem criar leads ou enviar mensagens. O endpoint de intenção de análise foi interceptado.

- Comparação de pixels confirmou movimento contínuo, quadro estável durante pausa e retomada. Matrizes enviadas ao WebGL mudaram com o ponteiro, confirmando parallax real.
- Preferência de movimento reduzido, ativação explícita pelo botão e mudanças da preferência sem escolha manual funcionaram.
- A cena pausou fora da viewport e retomou ao voltar. Navegação para serviço removeu o canvas; o retorno à home criou somente um.
- WebGL desabilitado e perda real do contexto em execução mantiveram um Canvas2D animado, com pausa e retomada. Falha de carregamento do módulo Three.js manteve o Canvas2D. Sem ambos os contextos gráficos ou sem JavaScript, o fundo estático continuou visível.
- Desktop 1440 × 1000, mobile 390 × 844 / 320 × 740 e tablet 768 × 900: sem overflow horizontal ou sobreposição entre WhatsApp e controle de pausa.
- Serviços passou nas verificações de clique interno/externo, Escape e Tab. O WhatsApp manteve link, foco e posição, ficou abaixo dos diálogos e foi omitido do admin.
- Nenhum erro inesperado de JavaScript ou shader nas interações verificadas.
- `npm run build --workspace=@bravite/web` passou, incluindo TypeScript e geração das páginas do frontend.

Prévia: [desktop](previews/hero-wave-desktop.png), [mobile 390 px](previews/hero-wave-mobile-390.png), [mobile 320 px](previews/hero-wave-mobile-320.png). Capturas mostram a composição em um instante; a confirmação do movimento usa comparação entre frames e matrizes de câmera.
