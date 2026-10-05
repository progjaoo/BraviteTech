# Acabamento dos planetas da hero

As superfícies Three.js usam mapas astronômicos locais no lugar da textura procedural de 256 × 128 px. Netuno recebe nuvens azuis; Saturno, faixas suaves com tonalidade fria; a Lua, crateras e regiões de contraste. Os planetas gasosos têm superfície lisa e uma borda atmosférica discreta, orientada pela luz. A Lua usa um bump artístico de intensidade baixa, derivado do albedo, sem deformar a silhueta. Os materiais das superfícies têm `metalness: 0` e `roughness: 1`.

O anel tem uma faixa radial com transparência e bandas de poeira. Seus UVs seguem o raio da geometria. O material translúcido mantém as faixas visíveis na escala pequena da hero, com oclusão pelo planeta.

Os arquivos em `apps/web/public/textures/planets/` somam aproximadamente 220 KiB: mapas de Netuno e Saturno em 2048 × 1024 px; mapa lunar em 1024 × 512 px, adequado ao diâmetro de 20–30 px no desktop; anel em 2048 × 125 px. As superfícies usam WebP, sRGB, mipmaps e anisotropia limitada a 4. O bump usa espaço de cor linear. As imagens carregam de forma assíncrona; uma falha mantém o material de base iluminado e a animação continua. Imagens e materiais são liberados ao desmontar a cena.

Posições, diâmetros, rotação, parallax, galáxia, RAF e comportamento de scroll seguem a composição anterior. O Canvas2D continua como alternativa animada quando o WebGL está indisponível.

Fonte: [Solar System Scope](https://www.solarsystemscope.com/textures/), licença [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Os créditos e as adaptações acompanham os arquivos em [CREDITS.txt](../../apps/web/public/textures/planets/CREDITS.txt), também disponível em `/textures/planets/CREDITS.txt` no site.

Validação: `npm run typecheck --workspace=@bravite/web` passou. A revisão no Chromium confirmou WebGL ativo, quatro mapas com HTTP 200, frames em movimento e ausência de erros JavaScript em desktop (1440 × 1000) e mobile (390 × 844). Voltar da página Sobre para a home recriou a cena e retomou a animação. A revisão visual usou uma API temporária de leitura com listas vazias, sem depender do PostgreSQL.
