import { Injectable, ServiceUnavailableException, type OnModuleDestroy } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { IMAGE_CACHE_CONTROL, PUBLIC_MEDIA_ORIGIN, imageContentType, type ImageType } from '../domain/media';

type LocalConfiguration = { provider: 'local' };
type ImagesConfiguration = { provider: 'cloudflare'; accountId: string; token: string };
type R2Configuration = { provider: 'r2'; accountId: string; bucket: string; accessKeyId: string; secretAccessKey: string };
export type MediaConfiguration = LocalConfiguration | ImagesConfiguration | R2Configuration;
export type StoredImage = { url: string; provider: MediaConfiguration['provider']; key: string };

export function mediaConfiguration(env: NodeJS.ProcessEnv = process.env): MediaConfiguration {
  const mode = env.MEDIA_STORAGE?.trim() || (env.R2_ACCESS_KEY_ID || env.R2_SECRET_ACCESS_KEY ? 'r2' : env.CLOUDFLARE_IMAGES_TOKEN ? 'cloudflare-images' : 'local');
  if (mode === 'local') {
    if (env.NODE_ENV === 'production') throw new Error('Configure MEDIA_STORAGE=r2 ou cloudflare-images para imagens persistentes em produção.');
    return { provider: 'local' };
  }
  if (mode !== 'r2' && mode !== 'cloudflare-images') throw new Error('MEDIA_STORAGE deve ser local, r2 ou cloudflare-images.');
  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (!accountId || !/^[a-f0-9]{32}$/.test(accountId)) throw new Error('Configure CLOUDFLARE_ACCOUNT_ID para o armazenamento de imagens.');
  if (mode === 'cloudflare-images') {
    if (!env.CLOUDFLARE_IMAGES_TOKEN?.trim()) throw new Error('Configure CLOUDFLARE_IMAGES_TOKEN.');
    return { provider: 'cloudflare', accountId, token: env.CLOUDFLARE_IMAGES_TOKEN.trim() };
  }
  const bucket = env.R2_BUCKET?.trim() || 'bravite-images';
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error('Configure um R2_BUCKET válido.');
  if (env.R2_PUBLIC_URL && env.R2_PUBLIC_URL.replace(/\/$/, '') !== PUBLIC_MEDIA_ORIGIN) throw new Error('R2_PUBLIC_URL deve usar https://media.bravite.com.br.');
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim(), secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId || !secretAccessKey) throw new Error('Configure R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY antes de ativar MEDIA_STORAGE=r2.');
  return { provider: 'r2', accountId, bucket, accessKeyId, secretAccessKey };
}

@Injectable()
export class MediaStorage implements OnModuleDestroy {
  private readonly configuration = mediaConfiguration();
  private readonly s3 = this.configuration.provider === 'r2' ? new S3Client({
    region: 'auto',
    endpoint: `https://${this.configuration.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: this.configuration.accessKeyId, secretAccessKey: this.configuration.secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    maxAttempts: 3,
  }) : undefined;

  get provider() { return this.configuration.provider; }

  async put(id: string, type: ImageType, bytes: Buffer): Promise<StoredImage> {
    const name = `${id}.${type}`, contentType = imageContentType(type);
    if (this.configuration.provider === 'r2') {
      const key = `editorial/${name}`;
      try {
        await this.s3!.send(new PutObjectCommand({
          Bucket: this.configuration.bucket, Key: key, Body: bytes, ContentLength: bytes.length,
          ContentType: contentType, CacheControl: IMAGE_CACHE_CONTROL, ContentDisposition: 'inline',
        }), { abortSignal: AbortSignal.timeout(30000) });
      } catch { throw new ServiceUnavailableException('Não foi possível armazenar a imagem. Tente novamente em instantes.'); }
      return { key, url: `${PUBLIC_MEDIA_ORIGIN}/${key}`, provider: 'r2' };
    }
    if (this.configuration.provider === 'cloudflare') {
      const configuration = this.configuration;
      const data = new FormData();
      data.append('file', new Blob([new Uint8Array(bytes)], { type: contentType }), name);
      try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${configuration.accountId}/images/v1`, {
          method: 'POST', headers: { Authorization: `Bearer ${configuration.token}` }, body: data, signal: AbortSignal.timeout(30000),
        });
        const result = await response.json() as { success: boolean; result?: { id?: string; variants?: string[] } };
        const url = result.result?.variants?.find(value => /^https:\/\/imagedelivery\.net\/[A-Za-z0-9/_-]+$/.test(value));
        if (!response.ok || !result.success || !url || !result.result?.id) throw new Error();
        return { key: result.result.id, url, provider: 'cloudflare' };
      } catch { throw new ServiceUnavailableException('Não foi possível armazenar a imagem. Tente novamente em instantes.'); }
    }
    const directory = resolve(process.cwd(), '../../.local/uploads');
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, name), bytes, { flag: 'wx' });
    return { key: name, url: `/api/v1/media/files/${name}`, provider: 'local' };
  }

  /** Roll back only an object created by the current upload if database recording fails. */
  async remove(image: StoredImage): Promise<void> {
    if (this.configuration.provider === 'r2' && image.provider === 'r2') {
      await this.s3!.send(new DeleteObjectCommand({ Bucket: this.configuration.bucket, Key: image.key }), { abortSignal: AbortSignal.timeout(30000) });
    } else if (this.configuration.provider === 'cloudflare' && image.provider === 'cloudflare') {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.configuration.accountId}/images/v1/${encodeURIComponent(image.key)}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${this.configuration.token}` }, signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error('Media cleanup failed.');
    } else if (image.provider === 'local') {
      await unlink(resolve(process.cwd(), '../../.local/uploads', image.key));
    }
  }

  onModuleDestroy() { this.s3?.destroy(); }
}
