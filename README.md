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

GSAP controla o hero, as timelines, o carrossel de tecnologias e as entradas por scroll com ScrollTrigger/SplitText. Motion for React (antes Framer Motion) usa o pacote `motion` e imports de `motion/react` para as transições de menu, formulário, FAQ e etapas do processo. Cada propriedade de um elemento deve ter um único controlador de animação. As animações respeitam a preferência de movimento reduzido e removem seus efeitos ao desmontar os componentes. O header usa `position: fixed` em CSS. Veja o [plano de animações e header](docs/implementation/PLANO-ANIMACOES-HEADER.md).

A hero tem uma galáxia Three.js com três planetas, anéis, estrelas e resposta suave ao mouse. O código 3D é carregado após idle, com limites de resolução e partículas; pausa fora da tela, em aba oculta e pelo controle na hero. Sem WebGL, permanece um fundo SVG. Lenis suaviza o scroll no desktop, integrado ao ticker GSAP; touch, admin e movimento reduzido mantêm scroll nativo. O manifesto revela palavras conforme a rolagem e os demais títulos entram por linhas.

A faixa de tecnologias faz um loop contínuo com pausa manual, no hover e no foco. Com movimento reduzido, mostra a lista estática completa. A mesma lista é usada na página Sobre. Veja a [auditoria completa do AURA e a implementação](docs/implementation/AUDITORIA-AURA-MOVIMENTO.md).

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

## E-mail e Cloudflare

Os pedidos são persistidos e as notificações para `bravitetech@gmail.com` entram numa fila transacional. Para entrega real, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM` conforme seu provedor. Reinicie a API. Sem SMTP, o painel informa a pendência; o site não afirma que um e-mail foi entregue. Há até cinco tentativas por notificação.

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

Os testes de integração verificam consentimento, conversão de interesse em lead, sessões, controle de acesso e origem, rascunhos, publicação, slug duplicado, upload e schemas OpenAPI. Usam registros temporários removidos ao terminar e exigem um servidor local com entrega SMTP e Cloudflare desativadas.

## AURA adquirido na 21st

O login do CLI expirou aguardando autorização; o download da edição comprada continua pendente. A implementação usa o upstream público MIT identificado pelo próprio catálogo, preservado com atribuição. Veja [a origem e a adaptação](docs/implementation/TEMPLATE-AURA.md).

Para baixar a edição adquirida após autorizar sua conta:

```bash
npx @21st-dev/cli@latest login
npx @21st-dev/cli@latest template add aura-svelte-gsap template-reference/aura-purchased
```

Essa edição é Svelte; a aplicação em `apps/web` já foi adaptada para Next.js. O download deve ficar na pasta de referência.
