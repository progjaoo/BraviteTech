// Keep uploads below Vercel Functions' 4.5 MB request body limit.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const PUBLIC_MEDIA_ORIGIN = 'https://media.bravite.com.br';
export const IMAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
export type ImageType = 'png' | 'jpg' | 'webp' | 'avif';

export function detectImageType(bytes: Buffer): ImageType | undefined {
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
  if (bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg';
  if (bytes.length > 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (bytes.length > 12 && bytes.toString('ascii', 4, 8) === 'ftyp' && ['avif','avis'].includes(bytes.toString('ascii', 8, 12))) return 'avif';
  return undefined;
}

const uuid = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}';
const localImage = new RegExp(`^/api/v1/media/files/${uuid}\\.(png|jpg|webp|avif)$`);
const editorialImage = new RegExp(`^/editorial/${uuid}\\.(png|jpg|webp|avif)$`);

/** Accept only URLs produced by the supported storage providers. */
export function isAllowedMediaURL(value: string): boolean {
  if (localImage.test(value) || /^https:\/\/imagedelivery\.net\/[A-Za-z0-9/_-]+$/.test(value)) return true;
  try {
    const url = new URL(value);
    return value === url.href && url.origin === PUBLIC_MEDIA_ORIGIN && !url.username && !url.password &&
      !url.search && !url.hash && editorialImage.test(url.pathname);
  } catch { return false; }
}

export function imageContentType(type: ImageType): string {
  return type === 'jpg' ? 'image/jpeg' : `image/${type}`;
}
