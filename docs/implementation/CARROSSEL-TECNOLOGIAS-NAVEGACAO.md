# Carrossel de tecnologias e navegação pela logo

A faixa fica entre Serviços e Processo. Fundo, fonte e bordas usam os tokens `--black`, `--white`, `--font` e `--dark-line` da Bravite.

## Catálogo

A ordem do catálogo compartilhado entre a home e a página Sobre é: OpenAI, Next.js, JavaScript, TypeScript, React, Node.js, C#, .NET, PostgreSQL, SQL Server, Neon DB, Electron, React Native, Figma e Hermes Agent + n8n. C# e .NET vêm imediatamente depois de Node.js, conforme solicitado.

O carrossel adiciona NestJS, Docker, Cloudflare e Motion, fechando 19 itens. A lista não inclui os demais detalhes da infraestrutura da aplicação, como GSAP, Three.js, Lenis ou Zod.

## Ícones e visual

As marcas disponíveis são componentes nomeados de `react-icons/si`. OpenAI, SQL Server, C# e Motion usam SVGs estáticos em `apps/web/public/icons/`, renderizados por componentes React com `next/image`. As fontes, rotas de origem e licenças estão registradas em `apps/web/public/icons/README.md`; os avisos MIT das coleções foram preservados junto aos arquivos. O logo do n8n identifica Hermes Agent + n8n; o ícone `SiHermes` representa a marca de moda.

Todos os itens começam em escala de cinza e opacidade discreta. No hover, recuperam a cor, a opacidade e sobem 3 px, com transição de 0,3 s. O fade lateral usa o token `--black` e largura responsiva.

## Movimento e acessibilidade

- `react-fast-marquee` controla o loop infinito com `autoFill` e `loop={0}`; não há tween GSAP nem keyframes próprios para essa faixa.
- O loop começa automaticamente quando a faixa está visível, não para com hover e oferece pausa/retomada manual por botão com `aria-pressed`.
- A aba oculta ou uma faixa fora da viewport pausam a animação e retomam o loop ao voltar.
- `prefers-reduced-motion` mantém o carrossel ativo, com velocidade máxima de 24, e remove as transições de hover.
- As repetições visuais ficam ocultas para tecnologias assistivas; uma lista sem duplicatas anuncia cada nome uma vez.
- Observers e listeners são removidos ao desmontar o componente.

## Reutilização

`TechnologyMarquee` recebe `technologies?: readonly Technology[]`, `speed?: number` e `id?: string`. Cada tecnologia tem `{ name, icon, color }`; `icon` é um componente `IconType`. O valor padrão é a lista de 19 itens descrita acima. Uma lista vazia não renderiza a seção; uma lista com um item fica estática. Listas customizadas com componentes de ícone devem ser montadas num Client Component, conforme a fronteira de serialização do Next.js.

## Logo do header

O comportamento existente permanece: `href="/"` em páginas internas, retorno ao topo na home com Lenis ou scroll nativo, limpeza de hash/query e fechamento do menu mobile. `src/lib/scroll-navigation.ts` e o header não fazem parte desta mudança.

## Verificação

`npm run typecheck --workspace=@bravite/web` passou. Em Chromium local, o loop CSS avançou por 400 ms tanto com movimento normal quanto com `prefers-reduced-motion: reduce`; a velocidade reduzida ficou em 24 e o estado permaneceu `running` mesmo com o ponteiro sobre a seção. A pausa/retomada manual também alternou entre `paused` e `running`.

O navegador encontrou os 19 itens na ordem documentada, sem erros JavaScript ou overflow em 320 px. As imagens locais de OpenAI, C# e SQL Server carregaram no primeiro trecho visível; o SVG de Motion permanece lazy-loaded até se aproximar da viewport horizontal do marquee. A checagem não conectou ao PostgreSQL e usou uma API local somente de leitura, com respostas vazias.
