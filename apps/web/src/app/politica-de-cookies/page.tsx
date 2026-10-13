import type { Metadata } from 'next';
import Link from 'next/link';
import { CookiePreferencesButton } from '@/components/cookie-consent';
import { brand } from '@/lib/brand';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Política de Cookies',
  description: 'Conheça os cookies da Bravite e controle suas preferências de privacidade.',
  path: '/politica-de-cookies',
  imageAlt: 'Política de Cookies da Bravite',
});

export default function CookiePolicy() {
  return <>
    <section className="page-hero container legal-hero">
      <p className="eyebrow">VOCÊ NO CONTROLE</p>
      <h1>Política de Cookies</h1>
      <p>Atualizada em 13 de outubro de 2026.</p>
    </section>
    <article className="light-section">
      <div className="prose container article-content">
        <h2>O que são cookies</h2>
        <p>Cookies são pequenos registros guardados pelo navegador. Podem manter funções necessárias do site ou, quando autorizados, apoiar ferramentas opcionais de análise. Esta política descreve os recursos configurados pela Bravite.</p>

        <h2>Cookies essenciais</h2>
        <p>São utilizados para lembrar suas preferências e proteger o acesso ao painel. Não são usados para publicidade e não dependem da autorização para análise.</p>
        <h3>Preferências de privacidade — bravite_cookie_consent</h3>
        <p>Cookie da própria Bravite, criado quando você salva, aceita ou rejeita as categorias opcionais. Guarda as escolhas de análise e marketing, a versão da política e a data da escolha, por até 180 dias. Não armazena seu nome, e-mail ou WhatsApp.</p>
        <p>É restrito ao domínio em que você navega, usa o caminho <code>/</code> e o atributo SameSite=Lax. Em HTTPS, também usa Secure. A interface o lê para aplicar suas escolhas; ele não é uma credencial de autenticação.</p>
        <h3>Sessão administrativa — bravite_admin</h3>
        <p>Cookie da própria Bravite, criado somente após um login bem-sucedido no painel administrativo. Permite autenticar a sessão por até 8 horas e é removido ao sair do painel. Uma visita comum às páginas públicas não cria esse cookie.</p>
        <p>Usa o caminho <code>/api</code>, HttpOnly e SameSite=Strict, além de Secure em produção com HTTPS. O JavaScript do navegador não pode ler seu conteúdo.</p>

        <h2>Análise e desempenho</h2>
        <p>Google Analytics 4 e Vercel Web Analytics só são carregados depois que você autoriza a categoria “Análise e desempenho”. Sem consentimento atual, rejeitado ou expirado, os scripts e eventos dessas ferramentas ficam bloqueados.</p>
        <p>Medimos páginas públicas e interações gerais: cliques nos botões de análise gratuita, cliques para abrir o WhatsApp e formulários aceitos com sucesso pela API. O código dos eventos não envia nome, e-mail, telefone, empresa, descrição, identificador do pedido ou parâmetros de URL. As URLs enviadas pela integração não incluem query string ou fragmento.</p>
        <p>O Google Analytics pode usar identificadores próprios, como o cookie <code>_ga</code>, após a autorização. O Vercel Web Analytics informa que utiliza estatísticas agregadas sem cookies de terceiros. Consulte também as informações de <a href="https://support.google.com/analytics/answer/11593727?hl=pt-BR" target="_blank" rel="noopener noreferrer">coleta do Google Analytics</a> e de <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noopener noreferrer">privacidade do Vercel Web Analytics</a>.</p>
        <p>Não há ferramenta de publicidade ou remarketing ativa. Autorizar análise não ativa marketing.</p>

        <h2>Como controlar sua escolha</h2>
        <p>Você pode rejeitar todas as categorias opcionais ou escolher análise e marketing separadamente. Rejeitar não impede a navegação nem o envio de um pedido de análise. Fechar o aviso não significa aceitar: sem uma escolha válida, os recursos opcionais permanecem bloqueados.</p>
        <p>Você pode revisar ou retirar a autorização a qualquer momento pelo botão abaixo ou em “Preferências de cookies”, no rodapé. Ao retirar a autorização para análise, a Bravite interrompe os scripts e eventos futuros e remove cookies padrão do Google Analytics acessíveis ao domínio. A mudança não desfaz tratamentos já realizados pelo fornecedor.</p>
        <p><CookiePreferencesButton className="button button-blue">Gerenciar preferências de cookies</CookiePreferencesButton></p>
        <p>A escolha expira após 180 dias, ou antes se a versão desta política mudar. Se o navegador bloquear o armazenamento, a escolha vale apenas durante a visita atual. Você também pode apagar ou bloquear cookies nas configurações do navegador; bloquear os essenciais pode impedir o login no painel.</p>

        <h2>Serviços externos e registros da aplicação</h2>
        <p>Links para WhatsApp, Instagram e outros sites só abrem esses serviços quando você os acessa. As políticas e os cookies deles passam a valer no respectivo destino.</p>
        <p>O registro de um pedido de análise e a autorização de contato do formulário são separados das preferências de cookies. Informações sobre esses dados e seus direitos estão na <Link href="/politica-de-privacidade">Política de Privacidade</Link>. As condições de uso estão nos <Link href="/termos-de-uso">Termos de Uso</Link>.</p>

        <h2>Dúvidas e atualizações</h2>
        <p>Para questões de privacidade, escreva para <a href={`mailto:${brand.email}`}>{brand.email}</a>. Manteremos esta política e o inventário atualizados quando os recursos do site mudarem.</p>
      </div>
    </article>
  </>;
}
