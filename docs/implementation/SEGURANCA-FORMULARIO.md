# Proteções do formulário de análise

O formulário envia dados para o NestJS em `/api/v1/leads`. A máscara facilita o preenchimento; os controles de segurança são aplicados na API, inclusive quando o navegador é ignorado.

## Telefone e validação de entrada

- WhatsApp brasileiro com DDD: `(24) 99911-9722` ou `(24) 3333-4444`. Colagem e autofill com `+55` são aceitos. A API confirma o DDD e o formato, e armazena o telefone em E.164: `+5524999119722`.
- Campos são normalizados em Unicode NFC e têm espaços externos removidos antes da validação. Nome, e-mail e empresa não aceitam caracteres de controle; a descrição aceita quebras de linha e tabulação, com CRLF normalizado para LF.
- Tipos e limites são verificados no servidor. O serviço deve pertencer às opções reais do formulário. Consentimento deve ser o booleano `true`; o honeypot deve estar vazio.
- A API rejeita campos extras, estruturas aninhadas nos campos de texto, arrays/primitivas na raiz e chaves de alteração de protótipo. Erros não devolvem valores enviados nem objetos de validação internos.

## Injection e saída segura

As consultas de leads e notificações continuam parametrizadas com `$1`, `$2` etc. Uma sequência SQL escrita pelo visitante permanece um valor, sem ser concatenada ao comando. Não há uma lista de palavras SQL proibidas: isso preserva nomes como `D'Ávila` e descrições legítimas.

Os leads são renderizados pelo React como texto; não são inseridos por `innerHTML` nem `dangerouslySetInnerHTML`. Endereços de leads nos links `mailto:` do painel são codificados com `encodeURIComponent`, evitando que caracteres do endereço sejam interpretados como parâmetros do link. Notificações usam corpo de e-mail em texto simples. Destinatário, remetente e assunto são definidos pelo servidor; o `Reply-To` passa pela validação estrita de e-mail e de caracteres de controle. Acrescentar HTML a essas saídas no futuro exige codificação adequada ao contexto ou sanitização com biblioteca mantida.

## Requisições e abuso

- POSTs públicos de leads/intenção exigem `application/json`, uma origem exatamente incluída em `APP_ORIGIN` e não aceitam `Sec-Fetch-Site: cross-site`. A API não habilita CORS permissivo. Isso bloqueia envios de formulários de outras origens no navegador; não autentica bots que usam clientes HTTP próprios.
- O parser limita os POSTs de leads e intenção a **16 KiB**, inclusive em requisições chunked. JSON inválido recebe 400; corpo excessivo recebe 413; formato/compactação não suportado recebe 415. Os diagnósticos do parser não são refletidos na resposta.
- O parser dos demais endpoints JSON tem limite de 512 KiB, para preservar a edição de artigos. Uploads multipart mantêm seus controles específicos.
- O limite existente é de 5 pedidos e 15 intenções por endereço por minuto. Um segundo limite permite no máximo 30 pedidos e 60 intenções por minuto por instância, mesmo quando alguém varia os cabeçalhos de endereço encaminhado. Excesso recebe 429 e prazo para nova tentativa.
- A API escuta somente em loopback e confia em proxies de loopback. Na implantação, o proxy público deve substituir os cabeçalhos de IP fornecidos pelo cliente. A limitação por endereço depende dessa configuração; o limite agregado permanece ativo. Várias réplicas exigem armazenamento de rate limit compartilhado.
- Se houver um token de intenção, ID e token devem estar presentes juntos. O token aleatório é armazenado como hash e só pode converter uma intenção pendente com até 30 minutos. Tentativas expiradas ou reutilizadas são revertidas, sem criar outro lead ou e-mail. Cada abertura do formulário obtém uma nova intenção.
- O frontend monta um payload explícito e impede envios simultâneos. Dados de contato não são registrados em logs; respostas mutáveis e administrativas recebem `Cache-Control: no-store`.

O honeypot e os limites reduzem abuso automatizado; não são CAPTCHA nem comprovação de identidade. As proteções descritas não equivalem a certificação OWASP ou garantia contra qualquer ataque.

## Validação

`npm run test:form-security` compila a API e executa testes locais contra uma instância NestJS com serviços simulados. A suíte verifica a máscara, tipos, normalização, SQL parametrizado, injection em cabeçalhos, chaves de protótipo, consentimento, honeypot, origem, limites de corpo e taxa, e rollback de token reutilizado. Não usa PostgreSQL nem envia e-mails pelo Resend/SMTP.

O fluxo foi também validado no Chromium em desktop e mobile: digitação, colagem com código do país, telefone fixo, validação nativa, edição do cursor, envio único e normalização do telefone recebida pela API.

## Referências OWASP

- [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
