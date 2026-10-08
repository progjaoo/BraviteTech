# Bravite

Site institucional em português com Next.js, NestJS e PostgreSQL. A composição adapta o AURA para React e usa a identidade Bravite 2.0: preto `#0A0A0A`, azul `#2D6BFF`, branco `#FFFFFF`, Space Grotesk e os vetores aprovados da opção 03.

## Executar localmente

Requisitos locais: Node.js 22 ou superior, npm e Docker funcionando. No Replit ou em um host gerenciado, use o PostgreSQL persistente da plataforma; Docker não é necessário quando `DATABASE_URL` aponta para um servidor externo.

```bash
npm ci
npm run db:start
npm run db:migrate
npm run db:bootstrap-admin
npm run dev
```

`db:start` cria `.env.local` com segredos aleatórios na primeira execução, inicia PostgreSQL 16 e aguarda o banco responder. O volume `bravite-postgres-data` é reutilizado nas próximas execuções. `db:migrate` aplica as migrações SQL e configura o papel runtime; `db:bootstrap-admin` cria uma conta inicial sem sobrescrever contas existentes. A API não altera o schema ou semeia conteúdo quando inicia.

- Site: http://localhost:3000
- Painel: use `ADMIN_PANEL_PATH` do `.env.local` em `http://localhost:3000/<valor>`; `/admin` responde 404.
- Swagger (somente desenvolvimento): http://localhost:3000/api/docs
- OpenAPI JSON: http://localhost:3000/api/docs-json
- Saúde da API: http://localhost:3000/api/v1/health

Login administrativo: consulte `ADMIN_EMAIL` e `ADMIN_PASSWORD` locais em `.env.local`, ignorado pelo Git. Rode o bootstrap uma vez depois da migration; alterar a senha em `.env.local` depois não troca a senha gravada no banco.

## Funcionalidades

Home, sobre, seis páginas específicas de serviços, contato, cases, blog, política de privacidade e termos. Header fixo durante o scroll, com dropdown e menu mobile, hero animado, processo interativo com diagrama de sequência e FAQ. WhatsApp: `+55 24 99911-9722`. Instagram: `@bravite.br`.

O CTA registra um interesse anônimo e abre o formulário. Nome, e-mail, WhatsApp e desafio tornam-se um lead identificável após envio e consentimento. O painel permite acompanhar e excluir pedidos, editar e publicar artigos e cases, visualizar Markdown e enviar capas com descrição. Não há identificação automática de quem apenas visita nem disparo de WhatsApp sem dados de contato.

O schema pode começar sem conteúdo editorial; não há seed automático no startup de produção. Publique artigos e cases aprovados pelo painel. Depoimentos podem ser acrescentados quando houver material aprovado.

GSAP controla o hero, as timelines e as entradas por scroll com ScrollTrigger/SplitText. Motion for React (antes Framer Motion) usa o pacote `motion` e imports de `motion/react` para as transições de menu, formulário, FAQ e etapas do processo. `react-fast-marquee` controla o loop do carrossel de tecnologias. Cada propriedade de um elemento deve ter um único controlador de animação. As animações de interface respeitam a preferência de movimento reduzido e removem seus efeitos ao desmontar os componentes. O header usa `position: fixed` em CSS. Veja o [plano de animações e header](docs/implementation/PLANO-ANIMACOES-HEADER.md).

A hero tem uma galáxia Three.js com três planetas de tamanho limitado, iluminação, anel, partículas e parallax suave da câmera ao mover o mouse. A onda de partículas e símbolos se deforma continuamente e reage ao ponteiro. O Canvas2D começa na hidratação enquanto o módulo Three.js carrega; import indisponível, erro de shader ou perda de contexto preservam uma alternativa animada. O fundo inicia automaticamente, inclusive com movimento reduzido, conforme a configuração de produto solicitada. Não há botão de play/pause. Um único loop nativo mantém a animação enquanto a hero está visível; fora da tela ou em aba oculta, suspende os frames e retoma automaticamente ao voltar. Sem JavaScript, permanece o fundo CSS/SVG. Há limites de resolução e partículas para mobile. Lenis suaviza o scroll no desktop, integrado ao ticker GSAP; touch, admin e movimento reduzido mantêm scroll nativo. O manifesto revela palavras conforme a rolagem e os demais títulos entram por linhas. Veja [hero e contato](docs/implementation/HERO-HARPIA-AJUSTES.md) para a composição, comportamento do menu Serviços e botão flutuante de WhatsApp.

A faixa de tecnologias fica entre Serviços e Processo. `react-fast-marquee` inicia sozinho, preenche a largura com `autoFill`, repete sem emenda e aplica fade nas bordas. O loop não para no hover; o botão oferece pausa manual e a faixa suspende quando sai da viewport ou quando a aba fica oculta. Com `prefers-reduced-motion`, continua em velocidade reduzida. C# e .NET aparecem logo após Node.js. Os ícones oficiais de OpenAI, SQL Server, C# e Motion são arquivos SVG locais documentados em `apps/web/public/icons/README.md`; os demais usam Simple Icons. Todos ficam em escala de cinza em repouso e recuperam a cor no hover. A lista reúne as tecnologias da empresa solicitadas mais NestJS, Docker, Cloudflare e Motion. A logo do header retorna ao topo mesmo na home, usando Lenis quando ativo e scroll nativo nos demais cenários. Veja [carrossel e navegação pela logo](docs/implementation/CARROSSEL-TECNOLOGIAS-NAVEGACAO.md) para o catálogo, comportamento e reutilização.

## Estrutura

```text
apps/
  web/                         Next.js App Router, React, GSAP, Motion
    src/app/                   Rotas públicas e painel
    src/components/            Componentes visuais e interativos
    src/lib/                   Marca, serviços e cliente de API
    public/                    Logos aprovadas, fontes e ícones locais
  api/                         NestJS
    src/presentation/          HTTP, DTOs, validação e OpenAPI
    src/application/           Leads, conteúdo e autenticação
    src/domain/                Contratos independentes de HTTP
    src/infrastructure/        PostgreSQL e inicialização
packages/
  database/migrations/         DDL versionado
  shared/                      Tipos compartilhados e envelope
scripts/                       Banco, produção e testes de integração
midia-kit/                     Kit completo e tokens da marca
template-reference/            Upstream público MIT do AURA
docs/implementation/           Referência, validação e capturas
```

O navegador chama `/api/v1/...` no mesmo domínio; o Next encaminha ao NestJS. As respostas JSON seguem `{ success: true, data, meta: { requestId } }` ou `{ success: false, error: { code, message, details? }, meta: { requestId } }`. Downloads de imagem e documentação usam seu formato próprio. DTOs com class-validator e @nestjs/swagger geram os contratos de entrada.

Autenticação administrativa usa cookie HttpOnly/SameSite Strict, sessões opacas armazenadas como hash, senha com scrypt, verificação de origem em operações de escrita e queries parametrizadas. A interface fica em `ADMIN_PANEL_PATH`; o login tem rate limit local e compartilhado pelo PostgreSQL. Swagger/OpenAPI é desligado em produção. Imagens aceitas: PNG, JPEG, WebP e AVIF até 4 MiB; SVG enviado pelo painel é rejeitado. Markdown não executa HTML arbitrário.

O formulário possui máscara de WhatsApp, validação no servidor, serviços permitidos, limite de JSON, honeypot e proteção contra repetição e abuso. Os controles e as referências OWASP estão em [Segurança do formulário](docs/implementation/SEGURANCA-FORMULARIO.md). Rode `npm run test:form-security` para verificar esses controles localmente, sem banco ou envio de e-mail.

O aviso de cookies permite aceitar, rejeitar e escolher por categoria, com acesso às preferências pelo rodapé. As escolhas duram até 180 dias; fechar o aviso mantém os opcionais bloqueados. Atualmente, há somente o cookie de preferência e a sessão administrativa, sem ferramentas de análise ou publicidade ativas. As integrações futuras devem usar os controles de consentimento e limpar seus recursos na revogação. Consulte [a estratégia e o inventário de cookies](docs/implementation/COOKIES.md) e rode `npm run test:cookies`.

## E-mail e Cloudflare

Os pedidos são persistidos e as notificações para `bravitetech@gmail.com` entram numa fila transacional. A integração preferencial usa o SMTP do Resend com a chave privada em `RESEND_API_KEY` e o remetente em `RESEND_FROM`. Para este domínio, o exemplo usa `Bravite <site@resend.grupogtf.com.br>`; o domínio `resend.grupogtf.com.br` precisa estar verificado na conta do Resend e a chave precisa ter permissão de envio. No SMTP do Resend, o host é `smtp.resend.com`, a porta é `465` com TLS e o usuário é `resend`; o backend configura esses valores automaticamente.

Mantenha `RESEND_API_KEY` somente no `.env` do servidor, nunca em variáveis `NEXT_PUBLIC_*` nem no frontend, e reinicie a API depois de configurá-la. `LEAD_NOTIFICATION_EMAIL` define quem recebe os pedidos (o padrão é `bravitetech@gmail.com`). O endereço do lead é usado como `Reply-To`, permitindo responder diretamente. SMTP genérico continua disponível como fallback por `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM`. Sem um provedor configurado, os e-mails permanecem pendentes; há até cinco tentativas por notificação.

Para imagens, configure `MEDIA_STORAGE=r2`, `CLOUDFLARE_ACCOUNT_ID`, `R2_BUCKET=bravite-images`, `R2_PUBLIC_URL=https://media.bravite.com.br` e as credenciais privadas `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`, limitadas ao bucket. O domínio personalizado e o cache de mídia estão configurados na Cloudflare. A API decodifica e normaliza os uploads para WebP sem EXIF/GPS, grava no R2 e registra a URL pública; o Next otimiza para cada tela. `npm run test:media-storage` valida o fluxo com dependências simuladas.

As imagens enviadas já são públicas, mesmo em artigos em rascunho. Biblioteca com armazenamento privado e ciclo de publicação permanece uma etapa futura. A configuração operacional e as evidências ficam no guia local `docs/cloudflare-r2.md`; o planejamento está em `plans/2026-10-05-cloudflare-r2-imagens.md`. Esses diretórios são ignorados pelo Git. O [plano anterior](docs/implementation/PLANO-IMAGENS-CLOUDFLARE.md) e a [especificação editorial](docs/implementation/CLOUDFLARE-IMPLEMENTACOES.md) registram a evolução prevista.

`MEDIA_STORAGE=cloudflare-images` preserva o provedor antigo com `CLOUDFLARE_IMAGES_TOKEN`. Em desenvolvimento, `MEDIA_STORAGE=local` usa `.local/uploads`; produção recusa esse modo. Configure os Secrets no host e reinicie a API depois de mudar o provedor. Esta entrega não publicou uma nova versão do site.

Use `.env.example` como catálogo. Em produção, mantenha `DATABASE_MIGRATION_URL` e `ADMIN_PASSWORD` fora da Vercel; `DATABASE_URL` da API deve usar o papel Neon `bravite_runtime` e URL pooled. `APP_ORIGIN` aceita origens exatas separadas por vírgula. O Next usa `API_URL` para reescrever `/api/*`. A preparação Vercel + Neon, os passos para conectar depois o domínio e o estado do ensaio da migration estão em [docs/deploy-vercel-neon.md](docs/deploy-vercel-neon.md) e no [plano Vercel + Neon](plans/2026-10-07-producao-vercel-neon-login.md). Nenhum deploy foi feito.

## Validar e executar em produção

```bash
npm run typecheck
npm run build
# Com npm run dev rodando, banco local e integrações externas desativadas:
npm run test:integration
# Pare o dev antes de iniciar produção nas mesmas portas:
NODE_ENV=production npm start
```

O build usa Webpack porque o Turbopack encontrou uma restrição de portas auxiliares neste ambiente. A saída do Next é standalone; o script de produção copia `public` e `.next/static` para o diretório correto do monorepo antes de iniciar o servidor. `PORT` controla a porta pública; `API_PORT` controla o NestJS.

Os testes de integração verificam consentimento, conversão de interesse em lead, sessões, controle de acesso e origem, rascunhos, publicação, slug duplicado, upload e schemas OpenAPI. Usam registros temporários removidos ao terminar e exigem um servidor local com entrega Resend/SMTP e Cloudflare desativadas.

## AURA adquirido na 21st

O login do CLI expirou aguardando autorização; o download da edição comprada continua pendente. A implementação usa o upstream público MIT identificado pelo próprio catálogo, preservado com atribuição. Veja [a origem e a adaptação](docs/implementation/TEMPLATE-AURA.md).

Para baixar a edição adquirida após autorizar sua conta:

```bash
npx @21st-dev/cli@latest login
npx @21st-dev/cli@latest template add aura-svelte-gsap template-reference/aura-purchased
```

Essa edição é Svelte; a aplicação em `apps/web` já foi adaptada para Next.js. O download deve ficar na pasta de referência.
