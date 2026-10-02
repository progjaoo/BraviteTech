# Validação da implementação

Executada em 02/10/2026 neste workspace, com Node 24.19, PostgreSQL 16 e Chromium. As verificações usam a aplicação local; não representam auditoria de produção, e-mail entregue ou integração Cloudflare autenticada.

| Verificação | Resultado |
| --- | --- |
| Instalação limpa com `npm ci` | Passou |
| `npm run db:start` na primeira execução e repetição | Passou, volume preservado |
| `npm run typecheck` | Passou no backend e frontend |
| `npm run build` com Webpack | Passou; 14 páginas estáticas geradas e rotas dinâmicas disponíveis |
| `NODE_ENV=production npm start` | Next standalone e Nest iniciados; página, blog, painel, API e Swagger responderam 200 |
| `npm run test:integration` | Passou; registros temporários removidos |
| Envio do formulário pelo navegador | Confirmação exibida e pedido visível no painel |
| Alterar e excluir lead no painel | Passou; atualização persistida |
| Login, rascunho, edição, publicação, exclusão e logout | Passou pela interface |
| Conteúdo não publicado e slug inexistente | Retornam 404 |
| API sem sessão, consentimento falso e origem indevida | Rejeitados com envelope consistente |
| Slug duplicado, URL de capa indevida e link `javascript:` | Rejeitados |
| Upload de PNG e entrega local | Passou; SVG enviado pelo painel rejeitado |
| OpenAPI gerado a partir dos DTOs | Schema de lead e campos de consentimento disponíveis |
| Processo interativo por clique e setas do teclado | Etapa e diagrama atualizados |
| Menu e formulário: abrir, fechar e Escape | Passou |
| Mobile 320 e 390 px | Sem rolagem horizontal da página |
| Preferência de movimento reduzido | Conteúdo permanece visível e utilizável |
| Erros de JavaScript nos fluxos verificados | Nenhum |
| Logos e símbolo públicos comparados com o kit | Arquivos SVG idênticos byte a byte |

A verificação inicial abriu home, sobre, serviços, contato, blog, artigo, cases e páginas legais. Imagens e fontes locais carregaram. A versão standalone também foi testada em uma porta separada, incluindo assets e proxy da API.

Capturas:

- [Home desktop](previews/home-desktop.png)
- [Home mobile](previews/home-mobile.png)
- [Hero desktop](previews/hero-desktop.png)
- [Hero mobile](previews/hero-mobile.png)
- [Processo interativo](previews/process-desktop.png)
- [Formulário](previews/analysis-desktop.png)
- [Menu mobile](previews/mobile-menu.png)
- [Painel editorial](previews/admin-desktop.png)

O Turbopack falhou no build ao tentar abrir uma porta auxiliar proibida pelo ambiente. O comando de produção foi configurado para Webpack e passou. O dev com Turbopack continua funcionando.

Pendências externas: autenticação 21st para baixar a edição adquirida, credenciais SMTP para entregar notificações e credenciais Cloudflare Images para hospedar uploads na CDN. A implementação local usa o upstream MIT oficial indicado pelo catálogo AURA; os detalhes estão em [TEMPLATE-AURA.md](TEMPLATE-AURA.md).

Cases estão vazios até a inclusão de projetos autorizados. Os três artigos iniciais são conteúdo institucional original editável. Nenhum cliente, depoimento ou resultado comercial foi inventado. O código foi criado no workspace e não foi enviado ao GitHub.
