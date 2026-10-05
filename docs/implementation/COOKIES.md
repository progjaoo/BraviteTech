# Consentimento de cookies

Implementado em 5 de outubro de 2026. O aviso segue a referência enviada: superfície escura, borda discreta, cantos arredondados e botões em formato de pílula. Usa os tokens de cor e a fonte da Bravite. Aceitar e rejeitar têm a mesma apresentação e exigem um clique; definições abre um diálogo nativo acessível.

## Inventário atual

| Cookie | Categoria | Criação / finalidade | Validade | Atributos |
| --- | --- | --- | --- | --- |
| `bravite_cookie_consent` | Essencial, primeira parte | Ao salvar a escolha: versão, data e autorização de análise/marketing; sem dados de contato | 180 dias | Host-only, Path=/, SameSite=Lax, Secure em HTTPS; legível pela interface |
| `bravite_admin` | Essencial, primeira parte | Login no painel; autenticação administrativa | 8 horas; removido no logout | Host-only, Path=/api, HttpOnly, SameSite=Strict, Secure em produção |

Não há GA4, GTM, Meta Pixel ou outros trackers opcionais configurados nesta versão. Fontes e ícones são locais; links externos não são embeds. O cookie de preferência não autoriza o acesso administrativo e nunca deve ser utilizado como prova de autenticação no backend. O registro de interesse e a autorização de contato do formulário são fluxos independentes.

## Comportamento

- Antes da hidratação e sem escolha válida, as duas categorias opcionais ficam negadas. Nada depende de consentimento presumido por navegação ou fechamento do aviso.
- Definições começa com os opcionais desligados e os essenciais ligados, sem opção de desligá-los nesse painel. O texto informa que as ferramentas opcionais ainda não estão ativas.
- Aceitar, rejeitar ou salvar grava a escolha. Fechar o aviso não grava aceitação ou rejeição; apenas oculta o aviso durante a visita atual.
- “Preferências de cookies”, no rodapé e nas políticas, permite reabrir e alterar a escolha.
- Registro malformado, versão anterior, data inválida ou expiração fazem o site bloquear os opcionais e pedir outra escolha. `CONSENT_VERSION` deve aumentar quando mudar materialmente o inventário, os fornecedores ou as finalidades. Isso invalida as autorizações anteriores.
- Mudanças são sincronizadas entre abas por BroadcastChannel e, como alternativa, ao recuperar foco/visibilidade. A validade também é verificada com temporizador durante visitas longas.
- Revogação chama a limpeza dos recursos daquela categoria e recarrega a página após persistir a mudança, encerrando também o contexto JavaScript anterior. Uma integração deve excluir seus próprios cookies no cleanup, incluindo os caminhos/domínios que criou. Não é possível apagar por JavaScript cookies de outros domínios ou HttpOnly: uma futura integração que os utilize precisa prever a revogação no servidor/provedor.
- Se cookies forem bloqueados, a escolha é respeitada em memória durante a visita e um aviso informa que não foi persistida. Nenhum consentimento anterior é considerado por falta de armazenamento.
- No painel administrativo, não há banner nem execução de integrações opcionais.
- O diálogo mantém o foco dentro dele, fecha com Escape e usa rolagem própria. Lenis não interfere. O banner reposiciona o WhatsApp acima dele; em mobile, os botões ficam empilhados. Motion respeita a preferência de movimento reduzido.

## Integrações futuras

Não coloque scripts de análise/publicidade diretamente no layout, em inicialização global ou como recursos de terceiros carregados antes da escolha. `next/script` com `afterInteractive` sozinho não implementa consentimento.

Use `ConsentGate` para montar componentes somente após autorização válida e `useOptionalCookieEffect` para inicializar recursos e registrar a limpeza. O inicializador deve ser estável (`useCallback`) e retornar a função de cleanup. Exemplo de contrato, sem instalar um provedor:

```tsx
const initialize = useCallback(() => {
  const integration = startApprovedAnalytics();
  return () => {
    integration.stop(); // listeners, timers, conexões e filas
    integration.deleteOwnCookies();
  };
}, []);
useOptionalCookieEffect('analytics', initialize);
```

Um componente que carrega um SDK pode ficar dentro de `<ConsentGate category="analytics">…</ConsentGate>` ou `marketing`. A integração precisa respeitar cancelamento de importações/requisições em andamento; desmontar uma tag script não interrompe scripts já executados. Não envie identificação do formulário a esses recursos automaticamente.

Antes de integrar um fornecedor, atualizar inventário, política e versão; informar finalidade, duração, domínio e controles; testar ausência de requests/cookies antes do opt-in, após rejeição e após revogação. Nenhum fornecedor ou identificador foi inventado nesta entrega.

## Arquivos e validação

- `apps/web/src/lib/cookie-consent.ts`: contrato e validação da preferência.
- `apps/web/src/components/cookie-consent.tsx` e `.module.css`: provider, controles, aviso e definições.
- `/politica-de-cookies`: inventário e gestão da escolha; também consta no sitemap.
- `npm run test:cookies`: validação de escolhas, cookies corrompidos, versões, expiração e revogação, sem banco.

A preferência é uma informação local do navegador; não há histórico de consentimentos no servidor. Referências: [guia de cookies da ANPD](https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf), [MDN — cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) e [Next.js — scripts](https://nextjs.org/docs/app/guides/scripts).

Verificação funcional realizada no Chromium em desktop (1440 px) e mobile (390 px e 320 px): primeira visita, igualdade visual de aceitar/rejeitar, navegação por teclado e Escape, fechar sem autorizar, rejeição persistida, escolha por categoria, aceitar, reabrir, revogar, limpeza de cookies de integração e sincronização entre abas. Também verificados expiração, versão anterior, registro corrompido, armazenamento bloqueado, preferência de movimento reduzido, ausência de overflow, posição do WhatsApp e abertura do formulário após rejeição. Uma integração temporária e local comprovou que os recursos não inicializam antes do opt-in e são limpos na revogação; a rota de teste foi removida antes do build. Esses testes não usam PostgreSQL real nem enviam e-mails. Os 23 testes automatizados do contrato de consentimento passaram.

`npm run typecheck` (API e web) e o build de produção do frontend passaram. Na aplicação compilada, foram confirmados persistência, estilos dos botões e toggles, navegação para a política fechando o diálogo, reabertura das preferências, fechamento pelo backdrop, inclusão no sitemap e remoção da rota temporária.
