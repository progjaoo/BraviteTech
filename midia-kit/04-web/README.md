# Aplicação web Bravite

`exemplo.html` abre localmente e demonstra a marca em fundo claro e escuro. `bravite.css` fornece tokens, fontes locais e componentes com nomes escopados. `snippets.html` contém trechos para incorporar manualmente no site. Nenhum arquivo do site foi alterado.

## Arquivos

- `icones/favicon.svg`: favicon vetorial com fundo preto, cantos arredondados e símbolo reverso.
- `icones/favicon.ico`: 16,32 e 48px no mesmo arquivo.
- `icones/favicon-{16,32,48}.png`: versões raster pequenas.
- `icones/favicon-{192,512}.png`: ícones quadrados para plataformas e manifesto; propósito `any`, sem alegação de compatibilidade `maskable`.
- `icones/apple-touch-icon-180.png`: ícone180px, com fundo opaco e sem cantos pré-arredondados.
- `icones/bravite-app-icon.svg`: matriz vetorial quadrada para ícones de aplicativo.
- `icones/bravite-avatar-1080.{svg,png,pdf}`: avatar1080px, fundo preto, com ajuste óptico horizontal de 10px e símbolo dentro da área segura de recorte circular.
- `site.webmanifest`: nome, cores e ícones de exemplo; não habilita um PWA sozinho.

## Integração

Mantenha a estrutura relativa do kit para o exemplo funcionar. Ao incorporar ao site, copie os arquivos usados e ajuste os caminhos do CSS (`../05-fontes/web/`), imagens, ícones e manifesto conforme a estrutura real. Os caminhos `/marca/...` do snippet são exemplos de destino e precisam ser configurados. Os fontes carregam localmente; nenhuma CDN ou ferramenta de rastreamento foi incluída.

A imagem da logo contém o texto alternativo "Bravite". Links têm nome acessível e os componentes possuem estado de foco visível. Use texto preto em fundo branco e texto branco em fundo preto. Nos botões azuis, use branco sólido (4,51:1). Azul sobre preto (4,39:1) fica restrito a títulos grandes e detalhes gráficos.

Os links usados são apenas os informados pelo usuário: https://www.bravite.com.br e https://www.instagram.com/bravite.br/.

`bravite-og-1200x630.svg` e `.png`: imagem de compartilhamento social 1200×630 com a frase editorial sugerida “Coragem para criar. Engenharia para evoluir.”. O SVG mantém todo o texto em curvas, independente de fontes externas. Ajuste o caminho público da imagem nos metadados Open Graph antes de publicar.
