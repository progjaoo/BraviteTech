import { services } from '@/lib/brand';
import { absoluteSiteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export function GET(): Response {
  const serviceLinks = services.map(service => `- [${service.title}](${absoluteSiteUrl(`/servicos/${service.slug}`)}): ${service.description}`);
  const content = [
    '# Bravite',
    '',
    '> Coragem para criar. Engenharia para evoluir.',
    '',
    'A Bravite é uma software house que conecta visão de negócio, design e engenharia para construir soluções digitais.',
    '',
    '## Páginas principais',
    `- [Início](${absoluteSiteUrl('/')})`,
    `- [Sobre a Bravite](${absoluteSiteUrl('/sobre')})`,
    `- [Cases](${absoluteSiteUrl('/cases')})`,
    `- [Insights](${absoluteSiteUrl('/blog')})`,
    `- [Contato](${absoluteSiteUrl('/contato')})`,
    '',
    '## Serviços',
    ...serviceLinks,
    '',
    '## Conteúdo público',
    `O [sitemap](${absoluteSiteUrl('/sitemap.xml')}) relaciona as páginas públicas, os insights e os cases publicados.`,
    '',
    'Este arquivo é um índice informativo experimental. Consulte as páginas HTML para o conteúdo completo e atualizado.',
    '',
  ].join('\n');

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
