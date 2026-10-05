# Bravite

Site institucional em português com Next.js, NestJS e PostgreSQL. A composição adapta o AURA para React e usa a identidade Bravite 2.0: preto `#0A0A0A`, azul `#2D6BFF`, branco `#FFFFFF`, Space Grotesk e os vetores aprovados da opção 03.

## Executar localmente

Requisitos locais: Node.js 22 ou superior, npm e Docker funcionando. No Replit ou em um host gerenciado, use o PostgreSQL persistente da plataforma; Docker não é necessário quando `DATABASE_URL` aponta para um servidor externo.

```bash
npm ci
npm run db:start
npm run dev
```

O banco é preparado antes do início da API. `db:start` cria `.env.local` com senhas aleatórias exclusivas na primeira execução, inicia PostgreSQL 16 e aguarda o banco responder. Reutiliza o volume `bravite-postgres-data` nas próximas execuções. Se `DATABASE_URL` vier do ambiente e apontar para um servidor externo, `db:start` não exige Docker. A API cria as tabelas ao iniciar.

- Site: http://localhost:3000
- Painel: http://localhost:3000/admin
- Swagger: http://localhost:3000/api/docs
- OpenAPI JSON: http://localhost:3000/api/docs-json
- Saúde da API: http://localhost:3000/api/v1/health

Login administrativo: `bravitetech@gmail.com`; a senha local está em `ADMIN_PASSWORD` no arquivo `.env.local`, ignorado pelo Git. O usuário inicial é criado apenas se ainda não existir; alterar a variável depois não troca a senha já armazenada no banco.

## Funcionalidades

Home, sobre, seis páginas específicas de serviços, contato, cases, blog, política de privacidade e termos. Header fixo durante o scroll, com dropdown e menu mobile, hero animado, processo interativo com diagrama de sequência e FAQ. WhatsApp: `+55 24 99911-9722`. Instagram: `@bravite.br`.

O CTA registra um interesse anônimo e abre o formulário. Nome, e-mail, WhatsApp e desafio tornam-se um lead identificável após envio e consentimento. O painel permite acompanhar e excluir pedidos, editar e publicar artigos e cases, visualizar Markdown e enviar capas com descrição. Não há identificação automática de quem apenas visita nem disparo de WhatsApp sem dados de contato.

O blog começa com três textos institucionais originais, editáveis. A carga inicial roda uma vez, sem repor conteúdo excluído. Cases começam vazios; publique os projetos reais autorizados no painel. Depoimentos podem ser acrescentados quando houver material aprovado.

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

Autenticação administrativa usa cookie HttpOnly/SameSite Strict, sessões opacas armazenadas como hash, senha com scrypt, verificação de origem em operações de escrita, limites por rota e queries parametrizadas. Imagens aceitas: PNG, JPEG, WebP e AVIF até 8 MB; SVG enviado pelo painel é rejeitado. Markdown não executa HTML arbitrário.

O formulário possui máscara de WhatsApp, validação no servidor, serviços permitidos, limite de JSON, honeypot e proteção contra repetição e abuso. Os controles e as referências OWASP estão em [Segurança do formulário](docs/implementation/SEGURANCA-FORMULARIO.md). Rode `npm run test:form-security` para verificar esses controles localmente, sem banco ou envio de e-mail.

## E-mail e Cloudflare

Os pedidos são persistidos e as notificações para `bravitetech@gmail.com` entram numa fila transacional. A integração preferencial usa o SMTP do Resend com a chave privada em `RESEND_API_KEY` e o remetente em `RESEND_FROM`. Para este domínio, o exemplo usa `Bravite <site@resend.grupogtf.com.br>`; o domínio `resend.grupogtf.com.br` precisa estar verificado na conta do Resend e a chave precisa ter permissão de envio. No SMTP do Resend, o host é `smtp.resend.com`, a porta é `465` com TLS e o usuário é `resend`; o backend configura esses valores automaticamente.

Mantenha `RESEND_API_KEY` somente no `.env` do servidor, nunca em variáveis `NEXT_PUBLIC_*` nem no frontend, e reinicie a API depois de configurá-la. `LEAD_NOTIFICATION_EMAIL` define quem recebe os pedidos (o padrão é `bravitetech@gmail.com`). O endereço do lead é usado como `Reply-To`, permitindo responder diretamente. SMTP genérico continua disponível como fallback por `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM`. Sem um provedor configurado, os e-mails permanecem pendentes; há até cinco tentativas por notificação.

Para imagens na Cloudflare Images, configure `CLOUDFLARE_ACCOUNT_ID` e `CLOUDFLARE_IMAGES_TOKEN` com permissão de upload. A API armazena a URL `imagedelivery.net` devolvida pelo provedor e o Next otimiza a imagem. Em desenvolvimento, as imagens ficam em `.local/uploads`. Em produção, use Cloudflare ou armazenamento persistente; arquivos locais não sobrevivem a uma instância descartável.

Use `.env.example` como referência para as variáveis. Em Replit ou outro host, configure as credenciais no gerenciador de Secrets, conecte um PostgreSQL persistente por `DATABASE_URL` e ajuste `APP_ORIGIN` e `NEXT_PUBLIC_SITE_URL` para a URL publicada. `APP_ORIGIN` aceita várias origens exatas separadas por vírgula. `API_URL` aponta para o processo NestJS; sua rota de proxy é definida no build. Em produção, use HTTPS e `NODE_ENV=production`, que ativa o cookie Secure. A API e o frontend precisam rodar no mesmo host para o endereço interno padrão funcionar.

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
