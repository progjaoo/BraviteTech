# AURA → Bravite / Next.js

Referência: AURA Creative Agency Template, catálogo 21st, autor de catálogo @larsen66.
Página: https://21st.dev/@larsen66/templates/aura-svelte-gsap

O CLI oficial @21st-dev/cli 1.17.1 foi instalado e os comandos login e template add foram executados. O login expirou aguardando autorização no navegador; o download da edição adquirida não foi concluído. Não se afirma que a conta ou a compra foram autenticadas.

O próprio catálogo identifica o fonte upstream público, com licença MIT: https://github.com/YusufCeng1z/svelte-gsap-template, commit a6648f678e3c8a592f108543771298d42ded7f66. Esse commit foi obtido e preservado em template-reference/aura-upstream/. O README original contém a declaração de licença e a atribuição a YusufCeng1z. Nenhum recurso privado de compra foi acessado.

A adaptação usa essa base pública: navegação flutuante, hero com tipografia mascarada e timeline GSAP, fundo espacial, seções de serviços, transições de FAQ e linguagem editorial. Svelte/onMount foram convertidos para componentes React com gsap.context, cleanup e matchMedia. Motion controla diálogo, menu, FAQ e processo; GSAP controla entrada, timelines e scroll. As duas bibliotecas não disputam os mesmos elementos.

A Bravite usa fontes locais Space Grotesk e os vetores da opção 03, com a paleta 2.0. Mídia remota sem licença documentada, clientes, métricas, depoimentos e projetos de demonstração do upstream não foram incorporados. As imagens de artigo e de possibilidades são ilustrações vetoriais próprias. O cursor nativo e o scroll do navegador foram preservados.

O fonte comprado poderá ser obtido após autenticação com o comando: npx @21st-dev/cli@latest template add aura-svelte-gsap template-reference/aura-purchased. Não instalar sobre apps/web/: a edição original é Svelte, a aplicação final é Next.js.
