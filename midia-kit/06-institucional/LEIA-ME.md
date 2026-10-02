# Bravite — institucional e comercial

## Arquivos

- **bravite-apresentacao-editavel.pptx:** seis slides em formato panorâmico 16:9. Textos, caixas, linhas e campos comerciais são editáveis. A logo é uma imagem preservada, com seu SVG original incluído em `recursos/`.
- **bravite-apresentacao.pdf:** os mesmos seis slides para leitura e compartilhamento. Tipografia incorporada e logo vetorial.
- **previa-apresentacao.jpg:** visão geral dos seis slides.
- **textos-e-legendas.md:** assinatura, bios, sobre, abertura do site, tom de voz, seis legendas, roteiro de stories e carrossel, catálogo e processo sugeridos, conteúdo da apresentação.
- **gerar-apresentacao.py:** fonte de geração para manutenção técnica do PPTX e do PDF. Requer Python com python-pptx, reportlab, PyMuPDF e Pillow, além de Inkscape. Usa as fontes em `../05-fontes/desktop/`.
- **recursos/:** cópia da logo original e versões utilizadas nos slides. Os desenhos e as proporções da marca foram preservados; a versão clara usa branco com faixa central azul.

## Como editar

1. Instale os três pesos da Space Grotesk incluídos em `05-fontes/desktop/` antes de abrir o PPTX.
2. Edite em PowerPoint, Keynote ou LibreOffice Impress. A aparência pode variar entre aplicativos; confira quebras de linha após editar.
3. Valide as áreas de atuação propostas no slide 3 e o processo sugerido no slide 4. Essas informações foram criadas como modelos, porque o catálogo e o processo oficial da empresa não foram fornecidos.
4. Preencha todos os campos do slide 5. Ajuste os campos ao projeto e complemente com proposta ou contrato detalhado quando necessário.
5. Confira os links de contato e exporte um novo PDF após as alterações. O PDF fornecido representa a versão inicial do modelo.

Os slides contêm notas do apresentador que indicam os pontos a validar. A apresentação é um material institucional e um modelo comercial; não contém clientes, portfólio, métricas, preços ou prazos inventados.

## Direção editorial

**Coragem para criar. Engenharia para evoluir.** é a assinatura sugerida para a marca. A origem do nome mantém a explicação fornecida: BRAVE (coragem), IT (Information Technology), E (Engineer). Os únicos contatos usados são www.bravite.com.br e Instagram @bravite.br.

## Conferência realizada

Foram conferidos os seis slides do PDF em prévia visual, a ausência de texto fora dos limites calculados, a abertura da estrutura do PPTX e a presença de textos editáveis. O arquivo foi gerado com `python-pptx`; não foi aberto em uma instalação de Microsoft PowerPoint nesta sessão. A tipografia é incorporada no PDF e fornecida separadamente para a edição do PPTX.
