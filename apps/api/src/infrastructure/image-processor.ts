import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import sharp from 'sharp';
import { detectImageType, MAX_IMAGE_BYTES } from '../domain/media';

const MAX_PIXELS = 24_000_000;
const MAX_DIMENSION = 10_000;
const DELIVERY_DIMENSION = 2560;
let processing = 0;

/** Decode and re-encode public images, discarding metadata and trailing payloads. */
export async function prepareImage(bytes: Buffer): Promise<Buffer> {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES || !detectImageType(bytes)) {
    throw new BadRequestException('Envie PNG, JPEG, WebP ou AVIF de até 4 MiB.');
  }
  if (processing >= 2) throw new ServiceUnavailableException('Há imagens sendo processadas. Tente novamente em instantes.');
  processing++;
  let image: ReturnType<typeof sharp> | undefined;
  try {
    image = sharp(bytes, { failOn: 'warning', limitInputPixels: MAX_PIXELS, animated: true });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION || (metadata.pages ?? 1) !== 1) {
      throw new Error('Unsupported dimensions or animation.');
    }
    return await image.rotate()
      .resize({ width: DELIVERY_DIMENSION, height: DELIVERY_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 4 })
      .timeout({ seconds: 10 })
      .toBuffer();
  } catch {
    throw new BadRequestException('Imagem inválida. Use uma imagem estática de até 24 megapixels e 10.000 pixels por lado.');
  } finally {
    image?.destroy();
    processing--;
  }
}
