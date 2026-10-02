# AURA: auditoria de movimento e aplicação na Bravite

Inspeção em 2 de outubro de 2026 do [preview enviado](https://21st-aura-svelte-preview-jdpo1k26v-larsen3.vercel.app/). A URL foi aberta em Chromium, percorrida de cima a baixo em desktop (1440 × 1000) e conferida em mobile (390 × 844). Foram inspecionados DOM, estilos computados, deslocamentos durante o scroll, scripts públicos e o upstream preservado em `template-reference/aura-upstream`.

## O que o preview realmente usa

O site retornou HTTP 200. A aplicação é Svelte; os scripts públicos confirmam **GSAP, ScrollTrigger e Lenis**. Não foi encontrada integração `motion/react`. O nome “Motion Identity” é conteúdo de um card, não evidência de uma biblioteca. A Bravite continua usando Motion for React nas transições dos componentes React.

A hero do preview não contém canvas nem iframe. O movimento do fundo é visual/parallax; a galáxia e os planetas 3D são uma implementação adicional solicitada para a Bravite.

## Leitura completa dos comportamentos

| Área do modelo | Comportamento observado / confirmado no código | Aplicação na Bravite |
| --- | --- | --- |
| Header | Barra flutuante escura, navegação persistente, CTA e menu mobile; entrada com fade/deslocamento | Mantido o header fixo existente e seus controles |
| Hero | Altura de uma viewport; título grande em duas linhas, recorte por linha, entrada de baixo para cima, CTA e descrição em sequência | Timeline GSAP existente mantida; fundo substituído por cena Three.js |
| Ponteiro | Parallax de fundo e título no desktop; acompanhamento suavizado | Movimento aplicado à cena 3D; texto e CTAs permanecem estáveis |
| Manifesto | Texto muda de tom progressivamente, palavra a palavra, associado ao scroll | SplitText + ScrollTrigger, com `scrub: 0.7`; texto completo disponível para tecnologia assistiva |
| Faixa de marcas | Conteúdo repetido em loop linear, com bordas suavizadas | Carrossel contínuo de tecnologias, grupos duplicados e velocidade constante |
| Serviços | Cards entram de baixo para cima, com fade e stagger; destaque no hover | Reveals suaves mantidos/refinados; nenhum segundo controlador Motion no mesmo alvo |
| Trabalhos | Lista de projetos e interação de hover, com movimento e informações secundárias | Preservados os cards de cases reais; não foram copiados projetos ou clientes do modelo |
| Depoimentos | Transição entre frases com fade e deslocamento; troca periódica | Fora desta entrega; depende de depoimentos autorizados |
| Indicadores | Contadores acionados ao entrar na região da viewport no upstream | Fora desta entrega; métricas exigem dados reais |
| FAQ | Abertura/fechamento das respostas e feedback no controle | Mantido o FAQ da Bravite com Motion |
| Footer | Encerramento com chamada de contato em tipografia grande e links | Mantidos conteúdo, marca e contatos da Bravite |
| Scroll | Inércia de roda via Lenis integrada ao ticker GSAP e ScrollTrigger | Lenis no desktop com ponteiro fino; scroll nativo em touch, movimento reduzido e admin |

Parâmetros do preview confirmados nos scripts: manifesto com `start: 'top 80%'`, `end: 'bottom 50%'`, `scrub: 1`; faixa de marcas com `xPercent: -50`, `repeat: -1`, duração de 25 s e `ease: 'none'`; Lenis com duração de 1.2 s. O upstream usa títulos com duração de 1.4 s, stagger de 0.1 s e `expo.out`, e cards com duração de 1.2 s, stagger de 0.15 s e entrada em `top 80%`.

A ordem do preview é hero → manifesto → marcas → serviços → trabalhos → depoimentos → indicadores → FAQ → footer. O layout mobile observado não apresentou overflow horizontal. O preview usa uma estética editorial com serifas; a Bravite conserva Space Grotesk, seus vetores aprovados e a paleta preta, azul e branca.

## Ajustes em relação ao modelo

- O ticker GSAP é usado uma única vez por subsistema. Lenis tem `autoRaf: false`; a função passada a `ticker.add` é a mesma removida no cleanup. Isso evita repetir o padrão do upstream, que combina autoRaf com ticker e remove uma função diferente.
- A galáxia não move a tipografia; os CTAs permanecem estáveis e clicáveis. Canvas e fallback não capturam eventos.
- A cena pausa fora da viewport, em aba oculta, por comando do usuário e com movimento reduzido. O carrossel também pausa no hover e no foco.
- A cópia do carrossel é oculta das tecnologias assistivas. Com movimento reduzido, a lista fica estática e quebra linhas para mostrar todas as tecnologias.
- SplitText preserva rótulo acessível e recompõe linhas ao mudar a largura. O manifesto começa em opacidade 0.36, em vez do tom quase invisível do upstream.
- Animações são criadas em componentes cliente, com cleanup por rota. GSAP administra scroll/timelines; Motion administra mudanças de estado. O admin recebe scroll nativo.
- A preferência de movimento reduzido usa `useSyncExternalStore`: o primeiro snapshot é consistente entre servidor e hidratação, e os controles acompanham mudanças em tempo real. O `MotionConfig` recebe a preferência explicitamente.
- A troca de rota inicia a nova página no topo ou em sua âncora. Navegação pelo histórico mantém a restauração do navegador/Next; Lenis interrompe inércia ao navegar.

## Sphere e alternativas

O [repositório Sphere informado](https://github.com/sphere-engine/agent-skills) contém uma skill para as APIs de Compilers e Problems, que executam e avaliam código. Ele não é um renderer de esferas, planetas ou galáxias.

| Opção | Quando escolher | Decisão |
| --- | --- | --- |
| [Three.js](https://threejs.org/) | Cena WebGL personalizada, shaders, geometria esférica e controle no código | Escolhida pelo usuário; MIT, sem editor ou serviço externo obrigatório |
| [Babylon.js](https://www.babylonjs.com/) | Aplicações 3D com ferramentas de cena, física e recursos de motor mais amplos | Alternativa para um escopo 3D maior |
| [Spline](https://spline.design/) | Equipe prefere criar e ajustar a cena em editor visual | Alternativa; avaliar condições do serviço e integração de runtime |

Não foi instalada a skill Sphere, pois seu domínio não corresponde a esta implementação. Nenhuma biblioteca alternativa foi instalada além da opção escolhida e de Lenis para o scroll.

## Implementação entregue

- `hero-galaxy.tsx`: import dinâmico de Three.js após idle; três planetas com `SphereGeometry`, superfícies procedurais, anéis, partículas em braços espirais e estrelas. Sem arquivos de textura, modelos externos ou chamadas a serviços 3D. Ponteiro altera suavemente a orientação da cena. Movimento contínuo usa o ticker GSAP.
- `hero.tsx`: timeline de entrada, cena de fundo e controle de pausa. Camada central escura preserva a leitura.
- `scroll-effects.tsx`: SplitText, ScrollTrigger e Lenis; remoção de listeners, splits, instâncias e ticker ao trocar de rota. Diálogos recebem scroll nativo e bloqueiam a página por trás.
- `technology-marquee.tsx`: dois grupos de largura idêntica, animação GSAP linear na largura medida, controles de pausa e retomada, resize e estado de visibilidade.
- `technologies.ts`: lista compartilhada entre home e sobre: Next.js, React, TypeScript, Tailwind CSS, GSAP, Motion, Three.js, Lenis, Node.js, NestJS, PostgreSQL, OpenAPI, Swagger, Zod, class-validator, Git, GitHub, Docker e Cloudflare. Cloudflare continua dependendo da configuração de credenciais para uso real.

Dependências adicionadas ao frontend: `three@0.186.1`, `lenis@1.3.26` e `@types/three@0.186.0` (desenvolvimento). GSAP e Motion permanecem nas versões já instaladas.

## Limites e validação

A auditoria descreve o comportamento público e os scripts acessíveis do preview; não equivale a acesso ao código privado da edição adquirida. A aba do aplicativo não tem uma ferramenta de inspeção direta nesta sessão: a mesma URL foi aberta no Chromium disponível no ambiente em nuvem.

A renderização 3D depende de WebGL. Quando indisponível, a hero conserva um fundo SVG estático; sem JavaScript, texto, links e o fallback também permanecem visíveis. A preferência de movimento reduzido torna a cena estática e remove os reveals e o scroll com inércia.

As verificações de renderização em Chromium usam SwiftShader no ambiente em nuvem. Elas comprovam funcionamento dos shaders e das interações verificadas; não são uma medição de FPS em hardware de clientes. O pixel ratio é limitado a 1.75 no desktop e 1.25 em telas estreitas, e a cena reduz o número de partículas em uma carga inicial mobile.

### Resultado das verificações

- `npm run typecheck --workspace @bravite/web`: passou; o build final também executou a validação TypeScript.
- `npm run build --workspace @bravite/web`: passou. A versão standalone de produção foi iniciada em `http://localhost:3001` para as verificações, mantendo o dev na porta 3000.
- Desktop 1440 × 1000: WebGL pronto, movimento de cena após deslocar o ponteiro, pausa com imagem estável e retomada, revelação progressiva de palavras, loop de tecnologias, pausa/retomada do carrossel, formulário e processo com Motion: passaram.
- Troca de rota: canvas anterior removido, uma única instância ao retornar, retorno ao topo, restauração de posição pelo botão voltar e âncora `/sobre#tecnologia` com offset de 110 px: passaram.
- Preferência de movimento reduzido alterada com a página aberta: cena e controles acompanharam a mudança, splits foram removidos e o scroll passou a nativo; retomada também passou.
- Mobile 390 × 844 e 320 × 844 (este com movimento reduzido desde a carga inicial): nenhum overflow horizontal, menu e Escape funcionaram; lista estática completa coube na largura de 320 px.
- WebGL desabilitado: fundo SVG e título permaneceram visíveis. JavaScript desabilitado: conteúdo e fundo SVG permaneceram visíveis.
- Nenhum erro JavaScript nas interações verificadas, incluindo hidratação em movimento reduzido. O formulário foi apenas aberto e fechado; o endpoint de intenção foi interceptado, sem criar leads de teste.

Capturas da implementação: [hero desktop](previews/hero-desktop-galaxy.png), [hero mobile](previews/hero-galaxy-mobile-390.png), [carrossel desktop](previews/technology-marquee-desktop.png) e [lista com movimento reduzido](previews/technology-marquee-mobile-320.png).
