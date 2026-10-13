import type { MetadataRoute } from 'next';
import { absoluteSiteUrl } from '@/lib/seo';

const allowPublic = (userAgent: string) => ({
  userAgent,
  allow: '/',
  disallow: '/api/',
});

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === 'preview') {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/api/' },
      allowPublic('Googlebot'),
      allowPublic('Google-Extended'),
      allowPublic('OAI-SearchBot'),
      { userAgent: 'GPTBot', disallow: '/' },
      allowPublic('ChatGPT-User'),
      allowPublic('PerplexityBot'),
      { userAgent: 'ClaudeBot', disallow: '/' },
      allowPublic('Claude-SearchBot'),
      allowPublic('Claude-User'),
    ],
    sitemap: absoluteSiteUrl('/sitemap.xml'),
  };
}
