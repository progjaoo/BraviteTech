# Carrossel de tecnologias e navegação pela logo

A faixa de tecnologias fica imediatamente depois de `#solucoes` e antes de Processo. A mesma faixa foi removida da posição anterior, depois do FAQ. Mantém a paleta preta, azul e branca da Bravite.

## Catálogo

A home apresenta os nomes nesta ordem:

1. OpenAI
2. Next.js
3. JavaScript
4. TypeScript
5. React
6. Node.js
7. PostgreSQL
8. SQL Server
9. Neon DB
10. Electron
11. React Native
12. Figma
13. Hermes Agent + n8n

`src/lib/technologies.ts` é a fonte única do catálogo, compartilhado com as categorias da página Sobre. Ele representa as ferramentas da empresa, sem instalar ou integrar essas ferramentas ao runtime do site.

## Movimento infinito

- GSAP, já instalado, controla exclusivamente o `transform` da faixa. A distância de um ciclo é a largura medida de um grupo completo, incluindo o espaço final; `ease: 'none'` e `repeat: -1` dão movimento constante e continuidade entre o último item e o primeiro.
- A largura da viewport determina o número de repetições: `max(2, ceil(viewport / grupo) + 1)`. Assim, sempre sobra um grupo para cobrir a passagem entre ciclos, inclusive em telas maiores que uma lista inteira.
- `ResizeObserver` acompanha o grupo e a viewport. Ao mudar tamanho ou fonte, o tween é recriado preservando a fase do ciclo. A velocidade é de 60 px/s no desktop e 46 px/s abaixo de 760 px.
- A faixa começa automaticamente, inclusive com movimento reduzido. Hover e foco não interrompem a animação. O botão permite pausa e retomada manual, com rótulo e `aria-pressed` coerentes; as demais transições de interface continuam seguindo a preferência do sistema.
- Fora da viewport ou em aba oculta, o tween suspende seus frames. Ao voltar, retoma automaticamente, respeitando uma pausa manual escolhida pelo usuário.
- Apenas a primeira lista é exposta às tecnologias assistivas; as repetições usam `aria-hidden`. Sem JavaScript, a lista original pode ser percorrida horizontalmente, sem cópias visíveis. Observers, listeners e tween são removidos ao desmontar o componente.

## Logo do header

- Links da logo mantêm `href="/"`. De uma página interna, a navegação Next.js existente abre a home no topo.
- Quando já está na home, `onNavigate` cancela a navegação redundante e solicita retorno ao topo. Hash ou query são removidos da URL sem recarregar a página. Cliques com Ctrl/Cmd mantêm o comportamento nativo de abrir outra aba.
- `src/lib/scroll-navigation.ts` emite um evento cancelável que o `ScrollEffects` atende. A instância ativa do Lenis executa `scrollTo(0)` e substitui qualquer inércia anterior. Sem Lenis, usa scroll nativo, instantâneo com movimento reduzido e suave nos demais cenários.
- A logo do menu mobile fecha o diálogo antes do retorno. O listener é removido ao trocar de rota; não há ticker ou instância adicional de Lenis.

## Validação no navegador

Chromium na cópia de trabalho em nuvem, sem criar leads nem enviar mensagens:

- Ordem Serviços → Tecnologias → Processo e os 13 nomes exatos: passaram.
- Movimento automático, continuidade sob hover e pausa/retomada manual: passaram.
- Um ciclo real foi observado. A transição passou de `x = -3034,14` para `x = -16,44`, com largura de grupo de `3038,70 px`. O mesmo item deslocou-se aproximadamente 21 px em 350 ms através da troca entre grupos, sem salto visual ou espaço vazio.
- Tela de 3840 px: três grupos preencheram a faixa durante o ciclo. Mobile 390 e 320 px: movimento e ausência de overflow horizontal passaram.
- Movimento reduzido na carga e alteração da preferência com a página aberta: faixa permaneceu animada.
- Logo clicada repetidamente na home, home com hash, página interna e menu mobile: retorno ao topo passou. O diálogo mobile fechou corretamente.
- Navegação para página interna e retorno: uma única faixa foi montada. A página Sobre exibiu o mesmo catálogo.
- Nenhum erro de JavaScript nas interações verificadas.
- `npm run build --workspace=@bravite/web` passou, incluindo validação TypeScript e geração das páginas.

Prévias: [desktop](previews/technology-marquee-after-services-desktop.png) e [mobile](previews/technology-marquee-after-services-mobile-390.png). As verificações foram feitas no navegador da nuvem; esta sessão não inspeciona diretamente o localhost do Mac.
