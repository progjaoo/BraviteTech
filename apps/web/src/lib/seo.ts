import type { Metadata } from 'next';

const configuredSiteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bravite.com.br');
export const SITE_URL = new URL(configuredSiteUrl.origin);

export function absoluteSiteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function socialImageUrl(image?: string | null): string {
  if (image) {
    try {
      const candidate = new URL(image, SITE_URL);
      if (candidate.protocol === 'https:') return candidate.toString();
    } catch {
      // Invalid, relative-without-leading-slash, or non-HTTPS URLs use the site image.
    }
  }
  return absoluteSiteUrl('/brand/og.png');
}

export function validIsoDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export function createPageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = 'website',
  publishedTime,
}: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
}): Metadata {
  const canonical = absoluteSiteUrl(path);
  const imageUrl = socialImageUrl(image);
  const openGraph = {
    title,
    description,
    url: canonical,
    siteName: 'Bravite',
    locale: 'pt_BR',
    type,
    images: [{ url: imageUrl, alt: imageAlt || title }],
    ...(type === 'article' && publishedTime ? { publishedTime } : {}),
  };

  return {
    title,
    description,
    alternates: { canonical },
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
