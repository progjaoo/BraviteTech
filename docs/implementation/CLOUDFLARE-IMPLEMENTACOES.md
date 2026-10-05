# Cloudflare na Bravite — especificação de implementação

Data: 5 de outubro de 2026. Código de referência: `5119da7`. Este documento especifica mudanças futuras; a integração R2 ainda não foi implementada. O [plano de conexão](PLANO-IMAGENS-CLOUDFLARE.md) registra os dados informados pelo proprietário, a análise DNS e a pendência de acesso autenticado.

## 1. Objetivo e arquitetura escolhida

Armazenar imagens do blog e dos cases em R2, entregá-las por `media.bravite.com.br`, proteger rascunhos e dar ao editor controle de upload, publicação, substituição e exclusão. O bucket público existente é **bravite-images**. O bucket privado proposto é **bravite-images-private**. Nomes de homologação serão separados.

Next.js 16.3.8 e React 19 exibem o conteúdo; NestJS 11 controla mídia e publicação; PostgreSQL armazena os metadados. A aplicação continuará usando npm e a arquitetura em camadas do monorepo. O R2 não substitui o PostgreSQL, a API, o Resend ou o servidor Next.js.

## 2. Auditoria do código atual

| Área | Comportamento encontrado | Implementação necessária |
| --- | --- | --- |
| Upload | `POST /api/v1/media/upload` exige `AdminGuard`, aceita um arquivo até 8 MiB e verifica assinaturas de PNG/JPEG/WebP/AVIF | Adaptador R2; decodificação real, metadados, limites de processamento e upload privado |
| Provedor | Com account ID/token, envia ao endpoint `/images/v1`; senão grava em `.local/uploads` | Configuração explícita de provedor; R2 em produção; armazenamento local apenas em desenvolvimento |
| Credenciais | `CLOUDFLARE_IMAGES_TOKEN` pertence à integração Cloudflare Images | Novas credenciais S3/R2; o token Images não configura um bucket |
| Delivery hash | `CLOUDFLARE_IMAGES_DELIVERY_HASH` aparece no exemplo de ambiente, mas não é lido pelo código atual | Não presumir que preencher esse campo ativa R2 ou restringe a origem de imagens |
| URL de capa | `ContentService.mediaURL()` só aceita caminho local ou `imagedelivery.net` | Referência à mídia cadastrada e validação de domínio/caminho próprio |
| Banco | `media` contém `id,url,alt,provider,created_at`; posts/cases guardam `cover_url` e `cover_alt` | Chave R2, localização, estado, dimensões, tamanho, MIME, referências e metadados editoriais |
| Migrações | Inicialização lê diretamente `001-init.sql`; o seed reserva a versão 2 | Runner de migrações incrementais para aplicar a versão 3 e seguintes em bancos existentes |
| Next.js | `remotePatterns` permite HTTPS de `imagedelivery.net` | Permitir somente o host/caminho público R2 próprio; manter compatibilidade das imagens antigas usadas |
| Capas | Cards, artigos e cases usam `next/image`; capas de artigo declaram 1200×630 fixos | Guardar dimensões reais; adequar `sizes`, proporção e comportamento de carregamento |
| Corpo do artigo | `ReactMarkdown` sem renderer próprio de imagem; Markdown pode referenciar imagens externas | Upload inline, vínculo por ID, renderer compartilhado e política de origens |
| Painel | Um upload de capa, texto alternativo e botão “Remover capa” | Biblioteca, progresso/erro, reutilização, seleção e exclusão de mídia |
| Exclusão | Remover capa só limpa a referência no formulário; excluir conteúdo não remove mídia do provedor | Controle de referências e limpeza recuperável de arquivos órfãos |
| Cloudflare Images antigo | Salva a URL de uma variante; o identificador remoto retornado pelo provedor não é registrado | Recuperar metadados no inventário antes de operações de exclusão/migração; manter leitura durante a transição |
| Cache editorial | Blog/cases são dinâmicos e o cliente de conteúdo usa `cache: 'no-store'` | Preservar atualização de conteúdo; só introduzir ISR/cache de páginas com invalidação definida |
| Proxy e rate limit | API escuta em loopback e confia em proxies de loopback | Confirmar cadeia real Cloudflare → host → Next → Nest e sobrescrita de cabeçalhos de IP |
| Sessões e formulário | Cookie administrativo HttpOnly/SameSite Strict; mutações exigem origem autorizada; respostas administrativas e mutáveis recebem `no-store` | Preservar controles ao adicionar domínio/CDN e bloquear cache das prévias privadas |
| SEO social | Artigos/cases definem título/descrição; Open Graph herda imagem institucional | Compartilhamento com capa pública, dimensões e texto alternativo por conteúdo |

Principais fontes: `apps/api/src/presentation/controllers.ts`, `application/content.ts`, `infrastructure/database.ts`, `presentation/http-security.ts`, `packages/database/migrations/001-init.sql`, `apps/web/next.config.ts`, painel, cards e páginas de blog/cases.

## 3. Configuração da Cloudflare

### 3.1 Bucket público e domínio

- Confirmar conta, zona e conteúdo antes de expor `bravite-images`.
- Adicionar **media.bravite.com.br** em **R2 → bravite-images → Settings → Custom Domains**, aguardando estado Active e HTTPS.
- Conservar o destino de `www.bravite.com.br`; não vincular o hostname do site ao bucket.
- Desligar acesso `r2.dev`; ele não é o endereço de produção e pode contornar controles aplicados ao domínio personalizado.
- Usar a classe Standard para imagens frequentemente acessadas. Verificar localização/jurisdição: o endpoint S3 deve corresponder ao bucket.
- Nenhum original privado, rascunho, dado de lead, backup ou segredo deve entrar nesse bucket público.

### 3.2 Bucket privado e credenciais

`bravite-images-private`: sem domínio personalizado e sem acesso público `r2.dev`. Tokens da aplicação com **Object Read & Write**, limitados a `bravite-images` e ao bucket privado; credenciais distintas para homologação. Permissões de DNS, criação de buckets e administração da conta ficam fora das credenciais do runtime.

O plugin pode apoiar a configuração da conta quando suas ferramentas estiverem disponíveis. A execução do site usa suas próprias credenciais de servidor e não depende de alguém manter o dashboard aberto.

### 3.3 Variáveis propostas

Estes nomes são a especificação futura; não foram adicionados ao ambiente nem ao `.env.example` nesta entrega.

```dotenv
MEDIA_PROVIDER=cloudflare-r2
CLOUDFLARE_ACCOUNT_ID=<account_id>
CLOUDFLARE_R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
CLOUDFLARE_R2_REGION=auto
CLOUDFLARE_R2_BUCKET=bravite-images
CLOUDFLARE_R2_PRIVATE_BUCKET=bravite-images-private
CLOUDFLARE_R2_ACCESS_KEY_ID=<secret_do_servidor>
CLOUDFLARE_R2_SECRET_ACCESS_KEY=<secret_do_servidor>
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://media.bravite.com.br
APP_ORIGIN=https://www.bravite.com.br
NEXT_PUBLIC_SITE_URL=https://www.bravite.com.br
```

Jurisdicionalidade, quando configurada, muda o endpoint, por exemplo `.eu.r2.cloudflarestorage.com`; confirmar antes de usar o valor acima. Nenhuma credencial deve ter prefixo `NEXT_PUBLIC_`. O host público é informação não secreta e precisa estar disponível também ao build/configuração do Next.js. `API_URL` continua apontando para a API interna, conforme o host existente.

### 3.4 CORS

Na primeira fase o navegador envia ao endpoint da própria aplicação; o backend envia ao R2. Isso dispensa habilitar upload cross-origin no bucket.

Para leituras que realmente usem fetch/canvas/texturas/fontes entre origens, configurar no bucket público uma política semelhante a esta no formato do dashboard:

```json
[
  {
    "AllowedOrigins": ["https://www.bravite.com.br", "https://bravite.com.br"],
    "AllowedMethods": ["GET", "HEAD"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Adicionar somente origens reais de homologação. CORS não autentica visitantes nem impede leitura de imagens públicas por clientes HTTP. Exibir uma imagem pública comum com `<img>` e buscar a imagem no servidor Next não exige CORS permissivo. Mudanças CORS em objetos já cacheados exigem purga para atualizar os cabeçalhos.

## 4. Implementação em camadas

Instalar `@aws-sdk/client-s3` e `sharp` no workspace `@bravite/api` com npm. O decoder deve ser dependência explícita do backend; não depender do `sharp` transitivo do Next.js. Verificar binários nativos no host de produção. `@aws-sdk/s3-request-presigner` só será necessário se uma fase posterior adotar upload direto.

| Camada / arquivo proposto | Responsabilidade |
| --- | --- |
| `apps/api/src/domain/media.ts` | Entidades, estados, metadados e porta `MediaStorage` sem dependência de HTTP |
| `apps/api/src/application/media.ts` | Validar, cadastrar, publicar, vincular e excluir; aplicar políticas de uso |
| `apps/api/src/infrastructure/media/r2-storage.ts` | Cliente S3, leitura/escrita/remoção e publicação para buckets configurados |
| `apps/api/src/infrastructure/media/local-storage.ts` | Desenvolvimento local, com a mesma porta |
| `apps/api/src/infrastructure/media/image-processor.ts` | Decodificar, orientar, redimensionar quando necessário e remover EXIF |
| `apps/api/src/presentation/media.controller.ts` | Extrair rotas atuais do controller geral, aplicar guards, DTOs e limites |
| `apps/api/src/presentation/media.dto.ts` | Contratos documentados com class-validator e `@nestjs/swagger` |
| `apps/api/src/main.ts` | Registrar serviços/adaptadores e validar configuração do provedor no startup |
| `apps/api/src/application/content.ts` | Resolver mídia pertencente à biblioteca e coordenar a publicação |
| `packages/shared/index.ts` | Tipos serializáveis `MediaAsset`, referências e dimensões para web/API |
| `packages/database/migrations/003-media-storage.sql` | Evolução aditiva do modelo; aplicar com runner versionado |

Usar region `auto` e endpoint configurado no S3Client. Não transportar flags de AWS S3 como `ACL: public-read` ou assumir bucket versioning/replicação: validar a compatibilidade R2. Chaves devem ser geradas no servidor, por exemplo `editorial/<media-id>/<sha256>.webp`; nenhuma parte da chave deve depender diretamente do nome do arquivo enviado.

## 5. Upload, dados e ciclo de publicação

### 5.1 Validação e processamento

- Manter 8 MiB, um arquivo por requisição e formatos raster permitidos. Rejeitar SVG/HTML/PDF/arquivos executáveis pelo painel.
- Confirmar assinatura e decodificar a imagem; não confiar em extensão, MIME ou somente nos primeiros bytes. Rejeitar arquivo truncado/corrompido.
- Aplicar limites ao decoder, por exemplo 24 megapixels, dimensões máximas e timeout, além de limite de concorrência. Os valores devem ser ajustados ao runtime após medição.
- Definir política de animação: não aceitar multiframe na primeira fase; mensagens de erro claras para o editor.
- Corrigir orientação e retirar EXIF/GPS das cópias entregues. Armazenar dimensões, MIME confirmado, tamanho e checksum SHA-256; ETag não deve ser tratado como checksum universal.
- O original, quando necessário para reprocessamento, permanece privado. O objeto publicado é a imagem normalizada, com `Content-Type` confirmado e chave nova a cada substituição.
- Timeouts, retries limitados e operações idempotentes no SDK; respostas de falha não expõem credenciais nem detalhes internos do provedor.
- Validar configuração completa no startup: não cair silenciosamente em armazenamento local em produção.

### 5.2 Evolução do banco

Adicionar à mídia: `object_key`, `bucket_role`/localização, `original_key` quando mantido, `mime_type`, `size_bytes`, `width`, `height`, `checksum_sha256`, `state`, `created_by`, `updated_at` e `deleted_at`. Estados propostos: uploading, ready, publishing, published, deleting, deleted, failed. Validar transições no serviço.

Adicionar `cover_media_id` com FK a posts/cases, mantendo `cover_url` durante a compatibilidade. Referências de imagens inline devem ser registradas em relação própria, por exemplo `post_media` e `case_media`, com uso de capa/inline e ordem. Alt/caption pertencem ao uso editorial: a mesma imagem pode ter descrições diferentes em dois artigos.

A tabela atual `media.alt` não recebe o `cover_alt` digitado no formulário; corrigir essa diferença em vez de presumir que os metadados existentes estão completos. Dimensões antigas devem ser opcionais até o backfill.

O runner de migração deve usar controle por versão, transação/lock e preservar as versões 1 e 2 já utilizadas. Criar apenas o arquivo `003` não funciona com a inicialização atual que lê somente `001`.

### 5.3 Consistência e recuperação

R2 e PostgreSQL não compartilham transação. Reservar um registro uploading e um ID; enviar/processar; concluir ready; compensar ou registrar limpeza pendente se houver falha. Não retornar sucesso antes de confirmar arquivo e metadados.

Na publicação, preparar as cópias públicas antes de confirmar o conteúdo published. Registrar publicação/limpeza pendente em outbox própria, ou mecanismo equivalente com retry e reconciliação, sem reutilizar os registros de notificações de e-mail. O processo deve distinguir arquivos ainda em uso daqueles órfãos.

Reutilização exige referências: remover uma capa ou excluir um artigo não apaga imediatamente uma imagem usada por outro conteúdo. “Excluir mídia” deve informar onde ela é usada; remover arquivos sem referência após um período de recuperação, proposto de 7 dias. Rascunhos duradouros não são órfãos e não devem ser apagados por uma regra genérica de lifecycle.

Ao despublicar, recalcular referências públicas e retirar cópias que não tenham outros usos publicados, com purga das camadas aplicáveis. Arquivos já entregues ao navegador podem continuar no cache do cliente; dados que precisam permanecer privados nunca devem ser publicados.

### 5.4 Contratos HTTP propostos

Preservar `/api/v1`, o envelope padrão e a documentação automática em `/api/docs`. Rotas administrativas continuam usando sessão, verificação de origem nas mutações e limites.

| Rota | Finalidade |
| --- | --- |
| `POST /api/v1/media/upload` | Upload autenticado para o fluxo privado; resposta com ID, estado, dimensões e URL de prévia |
| `GET /api/v1/media` | Biblioteca paginada; filtros por uso/estado, somente no painel |
| `GET /api/v1/media/:id/preview` | Bytes da imagem privada após autenticação; `private, no-store` |
| `PATCH /api/v1/media/:id` | Metadados e ações permitidas, sem aceitar chave/bucket arbitrários |
| `DELETE /api/v1/media/:id` | Exclusão validando referências e registrando limpeza |

Exemplo da resposta futura de upload, com valores de estrutura e não dados já criados:

```json
{
  "success": true,
  "data": {
    "id": "<uuid>",
    "provider": "cloudflare-r2",
    "state": "ready",
    "previewUrl": "/api/v1/media/<uuid>/preview",
    "publicUrl": null,
    "width": 1600,
    "height": 900,
    "mimeType": "image/webp",
    "sizeBytes": 240000
  },
  "meta": {"requestId": "<uuid>"}
}
```

O servidor resolve IDs da biblioteca para URLs próprias; não permitir publicar conteúdo referenciando uma URL livre apenas porque o hostname coincide. Verificar existência/estado e referência antes de confirmar publicação. Prévias autenticadas devem usar `<Image unoptimized>` ou `<img>` na mesma origem: o otimizador padrão Next não encaminha o cookie administrativo ao buscar a origem.

## 6. Frontend e entrega ao visitante

### 6.1 Painel e Markdown

Adicionar `MediaPicker`/biblioteca e `ManagedImage` reutilizável. O painel deve mostrar o provedor real, progresso/estado, erro recuperável, alt, dimensões e botão para inserir imagem no corpo. Manter a edição de texto ao falhar um upload.

No Markdown, adotar uma referência controlada por ID, como um caminho reservado `/media/<uuid>` dentro da sintaxe de imagem, que o renderer resolve usando metadados autorizados. Usar o mesmo renderer na prévia, artigo e case. Bloquear fontes arbitrárias, URLs data/javascript, tracking externo e HTML ativo. Manter a sanitização do Markdown; carregar imagem não deve autorizar execução de HTML.

A capa utiliza metadados reais. Cards preservam seu recorte visual; o corpo preserva a proporção da imagem. `sizes` deve acompanhar o container, sem baixar uma versão de tela inteira em cards de um terço da largura. Precarregar apenas uma imagem quando ela for efetivamente o LCP; as demais permanecem lazy. Tratar fallback e alt sem deslocamento de layout.

### 6.2 Otimizador inicial

Na primeira entrega, usar **R2 + CDN para a origem pública + next/image para redimensionar**. Não processar a mesma requisição com otimizadores Next e Cloudflare em sequência. Configuração futura exemplificativa:

```ts
images: {
  remotePatterns: [{
    protocol: 'https',
    hostname: 'media.bravite.com.br',
    port: '',
    pathname: '/editorial/**',
    search: '',
  }],
  qualities: [75],
  formats: ['image/webp'],
  maximumRedirects: 0,
}
```

A implementação real deve conservar patterns de imagens antigas ainda referenciadas, preferencialmente restritos ao namespace da conta em `imagedelivery.net`. Não habilitar hosts/IPs locais, SVG remoto ou redirecionamentos arbitrários. Novos caminhos adicionados precisam aparecer tanto na política do backend quanto na do Next.

O cache de imagens otimizadas do Next fica no host e pode ficar frio após redeploy; isso não perde os originais R2. Cloudflare não elimina o custo de processamento do Next nessa arquitetura. Se esse custo se tornar relevante, avaliar Images Transformations como etapa posterior.

### 6.3 SEO e compartilhamento

Adicionar Open Graph/Twitter com capa publicada, URL HTTPS absoluta, dimensões e alt por artigo/case. Imagens destinadas a previews sociais não podem depender de sessão, URL assinada expirada, desafio interativo ou bloqueio por falta de Referer. Atualizar sitemap/invalidação editorial quando mudar publicação.

## 7. Cache, DNS e segurança de entrega

Definir regras por **hostname, caminho e método**, respeitando os cabeçalhos da aplicação. Não aplicar Cache Everything ao site inteiro.

| Recurso | Estratégia inicial |
| --- | --- |
| `media.bravite.com.br/editorial/*` publicado | GET/HEAD públicos; TTL inicial de 1 dia nos objetos; chave nova a cada substituição; ajustar TTL após validar o fluxo de exclusão |
| `/_next/static/*` | Preservar cache longo/immutable dos arquivos com hash de build |
| `/brand/*`, `/icons/*`, `/fonts/*`, `/textures/planets/*` | CDN no hostname do site; cache moderado enquanto os nomes forem fixos; cache longo só com nomes versionados |
| `/_next/image` | Na fase inicial, bypass na Cloudflare e cache do otimizador Next; a resposta negocia formato pelo Accept |
| `/admin`, `/admin/*` | Bypass de cache e nenhuma transformação automática de scripts |
| `/api/v1/admin/*`, `/api/v1/media/*`, `/api/v1/leads*`, `/api/docs*` | Bypass; prévias/biblioteca privadas com no-store; uploads e mutações nunca cacheados |
| Blog, cases e HTML/RSC | Preservar comportamento atual do Next; não cachear respostas por regra genérica |
| Respostas private/no-store, com Set-Cookie ou Authorization | Não sobrescrever para cache público |

`/api/v1/media/files/*` permanece funcional para leitura legada local durante a migração; uma exceção de cache só será considerada após o inventário. Não cachear 401/403/5xx; evitar cache longo de 404 enquanto o fluxo de publicação estiver sendo introduzido.

Se futuramente cachear `/_next/image`, preservar toda a query `url/w/q` e separar corretamente formatos negociados por Accept. Uma regra simplificada pode servir a variante/formato incorreto. Se adotar transformações Cloudflare, usar loader próprio com presets finitos de largura/qualidade e fontes permitidas, evitando transformar URLs arbitrárias ou gerar variantes ilimitadas.

Para o site: confirmar HTTPS do origin, modo **Full (strict)** quando aplicável ao host, URL canônica e redirecionamentos sem loop. HSTS só depois de validar HTTPS dos hostnames abrangidos. Nas leituras de mídia pública, evitar desafios interativos que bloqueiem o otimizador Next e os previews sociais. WAF/limitação de abuso devem ser aplicados às rotas adequadas e conforme os recursos do plano.

A cadeia de proxies precisa entregar o IP correto ao NestJS, removendo cabeçalhos fornecidos pelo cliente. Não trocar `trust proxy: loopback` por `true` nem aceitar `CF-Connecting-IP` de qualquer origem. Documentar o encaminhamento feito pelo host/Next; validar dois clientes distintos e uma tentativa de falsificação antes de afirmar que os limites por IP estão corretos.

## 8. Outros usos da Cloudflare identificados

| Uso | Prioridade / recomendação para o site atual |
| --- | --- |
| CDN de capas e imagens inline | P0: principal objetivo deste projeto |
| CDN dos estáticos do site | P1: usar o proxy existente para JS/CSS, logos, ícones, fontes e texturas; não exige mover tudo para R2 |
| WAF e controles de abuso | P1: apoiar login, upload e formulário, preservando validação/origem/rate limit no NestJS; recursos dependem do plano |
| Turnstile no formulário | P2: acrescentar se houver abuso; sitekey no cliente, secret no servidor, validação obrigatória Siteverify antes de persistir lead e enfileirar e-mail; conferir hostname/action, token único e validade de 5 minutos |
| Cloudflare Access no painel | P2: camada adicional para `/admin` e rotas de API administrativas/upload, após definir identidades e UX de sessão; conservar a autenticação atual |
| Images Transformations | P2: reduzir CPU de otimização no host; verificar habilitação/custo, restringir fontes/presets e substituir o loader Next |
| Web Analytics/RUM | P2: analisar necessidade e dados coletados; documentar privacidade e eventual integração com o consentimento, sem ativar automaticamente |
| Backups | P1 operacional: política de backup do PostgreSQL e mídia em bucket privado/separado com credencial própria; R2 público não recebe backups |
| Workers/Queues | Somente se processamento assíncrono demandar; o NestJS pode executar o fluxo inicial e seus retries |
| Workers/OpenNext para hospedagem | Projeto separado, com avaliação de compatibilidade do Next 16.3.8, NestJS e PostgreSQL; não é requisito para usar R2 |
| D1/Hyperdrive | Sem necessidade demonstrada na conexão de imagens; PostgreSQL e `pg` permanecem adequados ao fluxo atual |
| Stream | Só se o blog passar a publicar vídeo; não é necessário para imagens |

Os planetas já usam mapas locais WebP/PNG. Cache desses arquivos no hostname do site é suficiente no momento. Caso sejam movidos para R2 futuramente, o TextureLoader precisará de CORS e os mapas não devem passar por recortes/redimensionamentos que alterem suas coordenadas. A Cloudflare acelera download; não corrige custo de animação na GPU.

O blog lista atualmente `SELECT *`, incluindo Markdown completo, e refaz consultas com no-store. Antes de adicionar cache HTML na borda, considerar resposta resumida/paginada para listagens e invalidação editorial no Next. Cache da Cloudflare não atende automaticamente o fetch interno para `127.0.0.1`.

Não ativar Rocket Loader ou transformações automáticas de JavaScript sem conferir hidratação, Motion, GSAP, Lenis e Three.js. Fazer essa análise apenas se houver necessidade de otimização demonstrada.

Atualizar a Política de Privacidade com o provedor de armazenamento/entrega quando a integração entrar em operação. Revisar o inventário de cookies com base nos recursos efetivamente habilitados: segurança/Turnstile podem ter comportamento diferente conforme a configuração. Registrar apenas cookies observados, sem anunciar trackers como ativos antes da instalação. Integrações opcionais de análise/publicidade devem seguir as preferências e a versão de consentimento já implementadas.

## 9. Migração e implantação

1. Inventariar registros `media`, capas e imagens inline de posts/cases, objetos locais e variantes Cloudflare Images usadas. Fazer backup dos registros e arquivos antes de mover.
2. Aplicar o runner/migração aditiva, mantendo leitura das URLs antigas. Configurar buckets/credenciais em homologação e frontend/backend.
3. Ativar novo upload privado; publicar um artigo autorizado com capa e imagem inline; validar entrega e prévia protegida.
4. Migrar arquivos de forma idempotente com mapeamento `URL antiga → media ID → object key → URL nova`, checksum e relatório de falhas. Downloads de migração só usam origens/caminhos confiáveis inventariados, com limites, evitando fetch de URL arbitrária.
5. Atualizar referências transacionalmente apenas depois de verificar os novos objetos. Manter origens antigas até não haver referências pendentes. Não tornar imagens de rascunho públicas só por migrá-las.
6. Publicar o frontend com remotePatterns/renderer atualizados e a API com R2; validar URL pública/privada, sessão, cache e origin.
7. Executar limpeza após o período de recuperação e o inventário final. Retirar permissões/provedor antigo somente quando a transição estiver concluída.

Rollback deve conservar objetos e mapeamento: reverter a aplicação exige uma versão compatível com as novas referências, ou restaurar as referências antigas do relatório. Não apagar novos arquivos nem a origem antiga como parte automática do rollback.

## 10. Operação e custos

Medir armazenamento por bucket, operações Class A/B, erros/timeouts R2, uploads sem conclusão, órfãos, latência de entrega, cache hit/miss, peso das imagens e CLS/LCP das páginas reais. Registrar requestId/mediaId/estado e logs sem segredos, cookies, URLs assinadas ou dados de leads.

R2 Standard inclui franquias; acima delas cobra armazenamento e operações. Não há cobrança de egress R2 segundo a documentação consultada, mas upload, leitura, cópia, listagem e produtos adicionais podem gerar custo. Images Transformations é uma cobrança distinta. Estimar uso mensal com número/tamanho de imagens, cópias privada/pública, visualizações e miss rate, em vez de tratar toda a operação como gratuita.

Usar alertas de utilização/faturamento disponíveis na conta, limite de upload/concorrência e inventário periódico. Uma regra de lifecycle pode limpar staging abandonado; não aplicar expiração geral a mídias que continuam vinculadas. Para recuperação, manter cópia de backup separada; a compatibilidade S3 consultada não implementa bucket versioning como no S3.

## 11. Critérios de aceite da futura implementação

- `www.bravite.com.br` continua servindo o site; `media.bravite.com.br` entrega somente arquivos públicos; `r2.dev` permanece desligado.
- Upload não autenticado, origem indevida, formato inválido, arquivo corrompido, excesso de tamanho/pixels e referência arbitrária são rejeitados no servidor.
- Nenhuma credencial aparece no bundle, HTML, resposta, log ou Git.
- Imagens de rascunho não são recuperáveis no domínio público; prévias exigem sessão e não ficam em cache compartilhado.
- Capas e imagens inline de blog/cases aparecem em desktop/mobile com alt, dimensões, tamanho adequado e preview social funcional.
- Falhas R2/banco não deixam conteúdo publicado apontando para arquivos ausentes; reenvio/retry não duplica mídia nem perde a edição.
- Substituição cria nova URL; exclusão respeita referências e possui limpeza/reconciliação; migração mantém URLs existentes válidas.
- Cache nunca entrega sessão, resposta administrativa, lead ou prévia privada a outro usuário; formatos de imagem não são confundidos entre clientes.
- Upload local segue funcionando somente no ambiente de desenvolvimento escolhido; produção configurada em R2 falha claramente se faltar credencial/provedor.
- OpenAPI, tipos compartilhados, migrações, exemplos de ambiente e README refletem o fluxo implementado.

Esses são critérios a executar na etapa de implementação, não resultados de testes já realizados. Nesta entrega foram revisados o código e a documentação oficial e feitas consultas públicas DNS; não houve upload autenticado, configuração da conta ou teste de integração R2.

## 12. Referências consultadas

- [R2: buckets públicos e domínios personalizados](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [R2: tokens e credenciais S3](https://developers.cloudflare.com/r2/api/tokens/)
- [R2: compatibilidade S3](https://developers.cloudflare.com/r2/api/s3/api/)
- [R2: CORS](https://developers.cloudflare.com/r2/buckets/cors/)
- [R2: preços e operações](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare: cache padrão](https://developers.cloudflare.com/cache/concepts/default-cache-behavior/)
- [Cloudflare Images: parâmetros de otimização](https://developers.cloudflare.com/images/optimization/features/)
- [Turnstile: validação no servidor](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- Next.js instalado: `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`, consultado para autenticação de imagens, remotePatterns, negociação de formatos e cache.
