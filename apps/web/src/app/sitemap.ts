import type { MetadataRoute } from 'next';
import type { Post, CaseStudy } from '@bravite/shared';
import { services } from '@/lib/brand';
import { content } from '@/lib/api';
import { absoluteSiteUrl } from '@/lib/seo';

export const dynamic = 'force-dynamic';

function validLastModified(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, cases] = await Promise.all([
    content<Post[]>('posts'),
    content<CaseStudy[]>('cases'),
  ]);

  const staticPaths = [
    '/', '/sobre', '/contato', '/cases', '/blog', '/politica-de-cookies',
    '/politica-de-privacidade', '/termos-de-uso',
    ...services.map(service => `/servicos/${service.slug}`),
  ];
  const entries: MetadataRoute.Sitemap = staticPaths.map(path => ({ url: absoluteSiteUrl(path) }));

  for (const post of posts) {
    if (post.status !== 'published') continue;
    const lastModified = validLastModified(post.published_at || post.created_at);
    entries.push({ url: absoluteSiteUrl(`/blog/${post.slug}`), ...(lastModified ? { lastModified } : {}) });
  }

  for (const project of cases) {
    if (project.status !== 'published') continue;
    entries.push({ url: absoluteSiteUrl(`/cases/${project.slug}`) });
  }

  return entries;
}
