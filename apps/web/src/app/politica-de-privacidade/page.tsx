import type { Metadata } from 'next';
import Link from 'next/link';
import { CookiePreferencesButton } from '@/components/cookie-consent';
import { brand } from '@/lib/brand';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Política de Privacidade',
  description: 'Saiba como a Bravite trata dados pessoais, solicitações de contato e preferências de privacidade.',
  path: '/politica-de-privacidade',
  imageAlt: 'Política de Privacidade da Bravite',
});

export default function Privacy() {
  return <>
    <section className="page-hero container legal-hero">
      <p className="eyebrow">TRANSPARÊNCIA</p>
      <h1>Política de Privacidade</h1>
      <p>Atualizada em 13 de outubro de 2026.</p>
    </section>
    <article className="light-section">
      <div className="prose container article-content">
        <h2>Responsável e contato</h2>
        <p>A Bravite utiliza as informações fornecidas neste site para atender pedidos de contato e análise de projetos. Para questões de privacidade, fale com <a href={`mailto:${brand.email}`}>{brand.email}</a>.</p>

        <h2>Dados enviados pelo formulário</h2>
        <p>Quando você envia o formulário, recebemos nome, e-mail, WhatsApp, empresa (quando informada), serviço de interesse e descrição do desafio. Registramos também sua autorização de contato e a data da solicitação.</p>
        <p>O clique em um convite de análise pode gerar um registro anônimo de interesse na aplicação. Esse registro não identifica você e só é associado às informações pessoais quando o formulário é enviado com sua autorização. Não usamos esse clique para enviar mensagens a pessoas não identificadas.</p>

        <h2>Análise de uso do site</h2>
        <p>Google Analytics 4 e Vercel Web Analytics só recebem eventos depois de uma autorização atual para a categoria “Análise e desempenho”. Registramos visualizações de páginas públicas, cliques em botões de análise gratuita e WhatsApp e o envio bem-sucedido do formulário.</p>
        <p>Os eventos próprios usam somente o nome da ação, uma localização fixa do componente e o caminho público da página. Eles não incluem os campos preenchidos, dados de contato, texto livre, identificadores de solicitação, parâmetros de URL ou fragmentos. O Google Analytics pode usar identificadores próprios, como o cookie <code>_ga</code>; a documentação da Vercel descreve Web Analytics como estatística agregada sem cookies de terceiros. Detalhes estão na <Link href="/politica-de-cookies">Política de Cookies</Link>, nas informações de <a href="https://support.google.com/analytics/answer/11593727?hl=pt-BR" target="_blank" rel="noopener noreferrer">coleta do Google Analytics</a> e na <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noopener noreferrer">política do Vercel Web Analytics</a>.</p>
        <p>Rejeitar análise bloqueia essas ferramentas sem impedir o uso do site ou o envio do formulário. Não há publicidade, remarketing ou compartilhamento com Google Ads configurados nesta implementação.</p>

        <h2>Finalidade e autorização de contato</h2>
        <p>Os dados do formulário são utilizados para compreender sua solicitação e conversar sobre o projeto, conforme a autorização indicada no próprio formulário. O envio não implica inscrição automática em campanhas de marketing.</p>

        <h2>Armazenamento e acesso</h2>
        <p>Os registros do formulário ficam armazenados no banco de dados da aplicação. O acesso administrativo exige autenticação. Prestadores de infraestrutura e de envio de e-mail, quando configurados, podem processar dados necessários à prestação desses serviços.</p>
        <p>Dados de contato são mantidos pelo tempo necessário ao atendimento e às obrigações aplicáveis. Você pode solicitar informação sobre retenção ou pedir a exclusão pelo canal de contato.</p>

        <h2>Cookies e recursos externos</h2>
        <p>Utilizamos um cookie essencial para lembrar suas preferências de privacidade por até 180 dias. O painel administrativo utiliza um cookie de sessão de até 8 horas, criado somente após o login. As fontes e os ícones do site são servidos localmente.</p>
        <p>Recursos opcionais permanecem bloqueados até uma autorização válida por categoria. Fechar o aviso não autoriza seu uso. Você pode rejeitar ou revisar a escolha em <CookiePreferencesButton/>. Ao retirar o consentimento de análise, os scripts deixam de enviar eventos futuros e os cookies padrão do Google Analytics acessíveis ao domínio são removidos.</p>
        <p>Ao abrir WhatsApp, Instagram ou um projeto externo, passam a valer as políticas do respectivo serviço.</p>

        <h2>Seus direitos</h2>
        <p>Você pode solicitar acesso, correção, informação sobre o tratamento, revogação da autorização de contato e exclusão de dados, observadas as hipóteses legais de conservação. Entre em contato por <a href={`mailto:${brand.email}`}>{brand.email}</a>.</p>

        <h2>Alterações</h2>
        <p>Esta política pode ser atualizada quando houver mudança na operação do site. A data da versão atual aparece no início da página.</p>
      </div>
    </article>
  </>;
}
