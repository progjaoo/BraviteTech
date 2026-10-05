# Carrossel de tecnologias e navegação pela logo

A faixa continua depois de Serviços e antes de Processo. Seu fundo, fonte e bordas usam os tokens `--black`, `--white`, `--font` e `--dark-line` da Bravite. As cores de marca pertencem somente aos ícones e badges.

## Stack identificado

- Frontend: Next.js, React, JavaScript/TypeScript, Tailwind CSS, GSAP, Motion for React, Three.js, Lenis e Zod. Fontes: `apps/web/package.json`, PostCSS, CSS e componentes.
- Backend: NestJS em Node.js; PostgreSQL com driver `pg` e migrações SQL em `packages/database/migrations/`. Fontes: `apps/api/package.json` e infraestrutura da API.
- Infraestrutura: Docker prepara PostgreSQL 16 no desenvolvimento por `scripts/start-database.mjs`. Cloudflare Images tem integração opcional de upload e otimização implementada na API/Next.js; seu uso depende da configuração.
- Ferramentas da empresa: OpenAI, Next.js, JavaScript, TypeScript, React, Node.js, PostgreSQL, SQL Server, Neon DB, Electron, React Native, Figma e Hermes Agent + n8n, conforme `src/lib/technologies.ts` e a documentação anterior. Essa lista registra o catálogo da empresa; não significa que todas estejam integradas ao runtime deste site.
- Gerenciador: npm, workspaces e `package-lock.json`. As novas dependências são `react-fast-marquee@1.6.5` e `react-icons@5.7.0`, fixadas no workspace web.

O padrão em `src/lib/technology-icons.ts` preserva as 13 ferramentas da empresa e acrescenta NestJS, Tailwind CSS, Docker, GSAP, Motion, Three.js, Lenis, Zod e Cloudflare: 22 itens. A página Sobre continua usando o catálogo compartilhado da empresa.

## Ícones e visual

Os símbolos disponíveis vêm de imports nomeados de `react-icons/si`, com cores oficiais e variantes brancas para marcas monocromáticas em fundo escuro. OpenAI, SQL Server, Motion e Lenis usam badges explícitos OAI, SQL, M e L, pois não têm o símbolo correspondente nesse pacote. Hermes Agent + n8n usa o símbolo oficial do n8n; o ícone `SiHermes` é da marca de moda e não representa o agente.

Cada item começa com `grayscale(1)` e opacidade discreta. No hover, recupera sua cor, opacidade e sobe 3 px, com transição de 0,3 s. O módulo CSS isola o acabamento dos itens. Os fades são os da biblioteca, com `gradientColor="var(--black)"` e largura responsiva.

## Movimento e acessibilidade

- `react-fast-marquee` controla o loop; `autoFill` preenche viewports largas e `loop={0}` mantém repetição infinita. Não há tween GSAP nem keyframes próprios para essa faixa.
- `pauseOnHover` pausa o conteúdo do carrossel. O estado do ponteiro da seção também pausa sobre o cabeçalho e os espaços da seção, sem prender a animação com eventos de toque.
- O botão existente preserva pausa/retomada manual e seu estado `aria-pressed`. Fora da viewport ou em aba oculta, o loop pausa e retoma quando apropriado.
- `prefers-reduced-motion` usa o hook existente, seguro para hidratação e atualizado em tempo real. Nessa preferência, a faixa exibe uma lista estática com quebra de linha, todos os itens disponíveis e sem deslocamento no hover.
- Na renderização do servidor e antes da hidratação, o catálogo real permanece em uma lista horizontal navegável. As repetições animadas ficam ocultas para tecnologias assistivas; uma lista sem duplicatas fornece os nomes uma única vez.
- Observers e listeners são removidos ao desmontar. O carregamento de dependências e o comportamento do carrossel não alteram a hero, o scroll ou a navegação.

## Reutilização

`TechnologyMarquee` recebe `technologies?: readonly Technology[]`, `speed?: number` e `id?: string`. Cada tecnologia possui `{ name, icon, color }`; `icon` aceita `IconType` de react-icons ou uma sigla explícita para badge. O valor padrão funciona com `<TechnologyMarquee />` na page existente. Listas customizadas com funções de ícone devem ser montadas num Client Component, conforme a fronteira de serialização do Next.js. Uma lista vazia não renderiza a seção; uma lista com um item fica estática.

## Logo do header

O comportamento existente permanece: `href="/"` em páginas internas, retorno ao topo na home com Lenis ou scroll nativo, limpeza de hash/query e fechamento do menu mobile. `src/lib/scroll-navigation.ts` e o header não fazem parte dessa mudança.

## Verificação da mudança

Na cópia temporária de revisão, `npm run typecheck --workspace=@bravite/web` passou. Chromium confirmou 22 itens, os ícones e badges, grayscale em repouso e cor/translateY de -3 px no hover, pausa sobre o cabeçalho e os itens, pausa manual e retomada, gradiente com o token preto e ausência de erros JavaScript. Uma inspeção determinística da animação CSS na fronteira do ciclo posicionou o mesmo item a +5 px e depois a -5 px, mantendo continuidade e cobertura da viewport.

Viewports de 390, 320 e 3840 px não apresentaram overflow horizontal. Movimento reduzido funcionou ao alterar a preferência com a página aberta e na carga inicial em mobile, exibindo todos os 22 nomes. No mobile com toque e movimento normal, tocar um item não deixou o loop preso em pausa. A revisão usou uma API temporária de leitura com listas vazias para renderizar a home, sem acessar PostgreSQL nem registrar leads.
