import type { Metadata } from 'next';
import Link from 'next/link';
import { CookiePreferencesButton } from '@/components/cookie-consent';
import { brand } from '@/lib/brand';

export const metadata: Metadata = { title: 'Política de Cookies', description: 'Conheça os cookies da Bravite e controle suas preferências de privacidade.' };

export default function CookiePolicy() {
  return <>
    <section className="page-hero container legal-hero">
      <p className="eyebrow">VOCÊ NO CONTROLE</p>
      <h1>Política de Cookies</h1>
      <p>Atualizada em 5 de outubro de 2026.</p>
    </section>
    <article className="light-section">
      <div className="prose container article-content">
        <h2>O que são cookies</h2>
        <p>Cookies são pequenos registros guardados pelo navegador. Podem permitir funções necessárias do site ou, quando autorizados, apoiar ferramentas de análise e publicidade. Esta política descreve os cookies configurados pela Bravite.</p>
        <h2>Cookies essenciais</h2>
        <p>São utilizados para lembrar suas preferências e proteger o acesso ao painel. Não são utilizados para publicidade e não dependem da autorização para categorias opcionais.</p>
        <h3>Preferências de privacidade — bravite_cookie_consent</h3>
        <p>Cookie da própria Bravite, criado quando você salva, aceita ou rejeita as categorias opcionais. Guarda as escolhas de análise e marketing, a versão da política e a data da escolha, por até 180 dias. Não armazena seu nome, e-mail ou WhatsApp.</p>
        <p>É restrito ao domínio em que você navega, usa o caminho <code>/</code> e o atributo SameSite=Lax. Em HTTPS, usa também Secure. O código da interface precisa lê-lo para aplicar suas escolhas; ele não é uma credencial de autenticação.</p>
        <h3>Sessão administrativa — bravite_admin</h3>
        <p>Cookie da própria Bravite, criado somente após um login bem-sucedido no painel administrativo. Permite autenticar a sessão por até 8 horas e é removido ao sair do painel. Uma visita comum às páginas públicas não cria esse cookie.</p>
        <p>Usa o caminho <code>/api</code>, HttpOnly e SameSite=Strict, além de Secure em produção com HTTPS. O JavaScript do navegador não pode ler seu conteúdo.</p>
        <h2>Análise, desempenho e publicidade</h2>
        <p>Atualmente, o site não ativa ferramentas de análise ou publicidade nem cria cookies dessas categorias. As fontes e os ícones são servidos localmente. Autorizar uma categoria não instala nenhuma ferramenta por si só.</p>
        <p>Se adicionarmos ferramentas opcionais, esta política será atualizada com seus nomes, finalidades e durações. Solicitaremos uma nova escolha antes de ativá-las. Esses recursos deverão permanecer bloqueados até uma autorização específica e válida para a categoria correspondente.</p>
        <h2>Como controlar sua escolha</h2>
        <p>No aviso, você pode aceitar todos os cookies opcionais, rejeitar todos ou abrir as definições para escolher por categoria. As categorias opcionais começam desativadas. Rejeitar não impede a navegação nem o envio de um pedido de análise.</p>
        <p>Fechar o aviso pelo botão de fechar não significa aceitar: os opcionais continuam bloqueados. Sem uma escolha salva, o aviso pode aparecer novamente na próxima visita.</p>
        <p>Você pode revisar ou retirar a autorização a qualquer momento no botão abaixo ou em “Preferências de cookies”, no rodapé. A mudança vale para as próximas atividades; não desfaz tratamentos já realizados. Ao retirar uma autorização, o site interrompe os recursos opcionais integrados e pode recarregar a página para encerrar seus scripts.</p>
        <p><CookiePreferencesButton className="button button-blue">Gerenciar preferências de cookies</CookiePreferencesButton></p>
        <p>A escolha expira após 180 dias, ou antes se a versão da política mudar. Se o navegador bloquear o armazenamento, sua escolha vale apenas durante a visita atual. Você também pode apagar ou bloquear cookies nas configurações do navegador; bloquear os essenciais pode impedir o login no painel.</p>
        <h2>Serviços externos e registros da aplicação</h2>
        <p>Links para WhatsApp, Instagram e outros sites só abrem esses serviços quando você os acessa. As políticas e os cookies deles passam a valer no respectivo destino.</p>
        <p>O registro de um pedido de análise e a autorização de contato do formulário são separados das preferências de cookies. Informações sobre esses dados e seus direitos estão na <Link href="/politica-de-privacidade">Política de Privacidade</Link>. As condições de uso estão nos <Link href="/termos-de-uso">Termos de Uso</Link>.</p>
        <h2>Dúvidas e atualizações</h2>
        <p>Para questões de privacidade, escreva para <a href={`mailto:${brand.email}`}>{brand.email}</a>. Manteremos esta política e o inventário atualizados quando os recursos do site mudarem.</p>
      </div>
    </article>
  </>;
}
