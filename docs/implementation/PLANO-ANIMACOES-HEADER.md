# Plano de animações e header — Bravite

Data: 2 de outubro de 2026. Escopo: manter a identidade Bravite e o conteúdo existente, consolidar a divisão das animações e manter a navegação visível durante o scroll.

## 1. Diagnóstico e nomenclatura

A aplicação já tem `gsap@3.15.0` e `motion@13.5.1` em `apps/web/package.json`. Os componentes React já importam `motion/react`; não há necessidade de instalar novamente nem de adicionar o pacote legado `framer-motion`.

A documentação oficial chama a biblioteca de **Motion for React**. O guia de migração orienta substituir o pacote `framer-motion` por `motion` e os imports por `motion/react`.

O header estava com `position: absolute`: acompanhava o início da página e saía da tela ao rolar. A alteração usa `position: fixed`, preservando o desenho flutuante e os offsets existentes: 24 px no desktop e 16 px até 900 px de largura.

## 2. Responsabilidades

| Comportamento | Responsável | Arquivo |
| --- | --- | --- |
| Timeline de entrada do hero | GSAP | `apps/web/src/components/hero.tsx` |
| Galáxia e planetas interativos | Three.js + alternativa Canvas2D, um único `requestAnimationFrame` | `hero-galaxy.tsx`, `hero-webgl.ts`, `hero-field.ts` |
| Entradas dos cards ao rolar | GSAP + ScrollTrigger | `apps/web/src/components/showcase.tsx` |
| Entradas de elementos com `data-reveal`, por rota | GSAP + ScrollTrigger/SplitText | `apps/web/src/components/scroll-effects.tsx` |
| Inércia de roda no desktop | Lenis + ticker GSAP | `apps/web/src/components/scroll-effects.tsx` |
| Faixa contínua de tecnologias | GSAP | `apps/web/src/components/technology-marquee.tsx` |
| Entrada do menu mobile | Motion for React | `apps/web/src/components/header.tsx` |
| Transições do formulário de análise | Motion for React | `apps/web/src/components/providers.tsx` |
| Abrir e fechar respostas do FAQ | Motion for React | `apps/web/src/components/faq.tsx` |
| Troca de etapa e diagrama do processo | Motion for React | `apps/web/src/components/process.tsx` |
| Posição fixa do header e estados simples de hover/foco | CSS | `apps/web/src/app/globals.css` |

GSAP e Motion têm capacidades que se sobrepõem. Para este projeto, timelines e efeitos ligados ao scroll ficam com GSAP; mudanças de estado dos componentes ficam com Motion. A posição fixa do header não exige uma animação nem um listener de scroll.

## 3. Regras para novas animações

1. Um único controlador por elemento e propriedade. Não combinar `gsap.to()` e `motion` alterando `transform`, `opacity` ou altura do mesmo elemento. Quando necessário, usar um wrapper para o reveal GSAP e um filho para a transição Motion.
2. Não usar `useScroll`/`whileInView` do Motion em elementos já controlados pelo ScrollTrigger. Remover o controlador anterior antes de migrar um efeito.
3. Criar timelines e ScrollTriggers em efeitos de componentes cliente, com refs e seletores limitados ao componente. Usar `gsap.context()` e `context.revert()` no cleanup. Recriar efeitos de página ao trocar a rota e evitar registros duplicados.
4. Respeitar `prefers-reduced-motion`: GSAP usa `matchMedia`; Motion recebe `always`/`never` no `MotionConfig` conforme a preferência lida por um hook com `useSyncExternalStore`, que preserva a hidratação e acompanha mudanças em tempo real. Com movimento reduzido, o conteúdo continua visível e os controles funcionam. Por decisão de produto, o fundo decorativo da hero inicia automaticamente também nessa preferência, sem botão de play/pause.
5. Priorizar `transform` e `opacity`. Animações de altura ficam limitadas a componentes que precisam disso, como o FAQ; não alterar repetidamente o layout durante scroll.
6. Manter a semântica, teclado, foco e Escape dos diálogos nativos. Animação não substitui comportamento acessível.

## 4. Sequência de implementação

1. Auditar dependências, imports e os efeitos existentes. Resultado: a divisão já está aplicada; atualizar a documentação com o nome Motion for React e explicitar as responsabilidades.
2. Alterar apenas o posicionamento do header em CSS para `fixed`. Preservar o layout da página, a paleta, o logo, o dropdown e os breakpoints. Manter `z-index: 30`; diálogos nativos continuam na camada superior do navegador.
3. Conferir que o `scroll-padding-top: 110px` existente mantém destinos de âncoras abaixo do header. Verificar navegação desktop, mobile, páginas internas e a preferência de movimento reduzido.
4. Executar a checagem de tipos do frontend, validar a geometria e os controles em Chromium e publicar a correção no repositório.

Não há alteração de backend, banco de dados, dependências ou contratos de API nesta entrega.

A entrega posterior da galáxia/carrossel adiciona Three.js e Lenis ao frontend. O escopo e as dependências dessa atualização estão descritos na [auditoria de movimento do AURA](AUDITORIA-AURA-MOVIMENTO.md).

## 5. Critérios de aceitação

- O header permanece no mesmo offset da viewport antes e depois do scroll, inclusive perto do rodapé.
- Desktop: links e dropdown de serviços permanecem visíveis e operáveis durante o scroll.
- Mobile: menu abre acima do header, permite navegação e fecha com Escape; sem overflow horizontal.
- O formulário de análise abre acima da navegação e mantém seus controles acessíveis.
- Destinos de âncoras respeitam o espaço reservado pelo `scroll-padding-top`.
- Páginas públicas internas também têm header fixo; `/admin` mantém seu shell próprio.
- As verificações de tipos passam; não surgem erros JavaScript nas interações verificadas.
- Em movimento reduzido, header e navegação funcionam sem depender de animação.

## 6. Referências consultadas

- [Motion: instalação e imports](https://motion.dev/docs/react-installation)
- [Motion: guia de migração do Framer Motion](https://motion.dev/docs/react-upgrade-guide)
- [GSAP: context e cleanup](https://gsap.com/docs/v3/GSAP/gsap.context/)
- [GSAP: ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- Guia `use client` da versão instalada do Next.js: `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`.

Os guias oficiais de instalação e migração do Motion foram conferidos nesta entrega. O Context7 solicitado não está disponível entre as ferramentas desta sessão; não foi utilizado.

## 7. Atualização da cópia no Mac

Esta entrega é feita na cópia em nuvem e publicada no GitHub. A pasta `/Users/joaomvalente/Projetos/BraviteTech` não é acessível por esta sessão. Para trazer a alteração ao computador, com a árvore local limpa:

```bash
cd /Users/joaomvalente/Projetos/BraviteTech
git pull --ff-only
npm run dev
```

Se já houver alterações locais nos mesmos arquivos, resolva-as antes do pull. As dependências permanecem iguais; não é preciso reinstalá-las para esta correção.

## 8. Validação realizada

- `npm run typecheck --workspace @bravite/web`: passou.
- Chromium em `http://localhost:3000`, viewports 1440 × 900, 390 × 900 e 320 × 900: header manteve o offset de 24/16 px após scroll de 1200 px e até o fim da página.
- Dropdown desktop com seis serviços, navegação para página interna, menu mobile, fechamento com Escape e abertura do formulário a partir do header/menu: passaram.
- Âncora `#solucoes` abaixo do header, ausência de overflow horizontal e shell `/admin` sem o header público: passaram.
- Viewport de 320 px com movimento reduzido: passou. Nenhum erro JavaScript nas interações verificadas.
- O formulário foi apenas aberto e fechado; o endpoint de interesse foi interceptado na verificação para não criar registros de teste. Nenhum lead foi enviado.

As verificações foram feitas no ambiente em nuvem. A execução no Mac depende da atualização da cópia local.
