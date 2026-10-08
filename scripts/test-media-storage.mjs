import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { MediaStorage, mediaConfiguration } = require('../apps/api/dist/infrastructure/media-storage');
const { MediaService } = require('../apps/api/dist/application/media');
const { ContentService } = require('../apps/api/dist/application/content');
const { isAllowedMediaURL, MAX_IMAGE_BYTES, IMAGE_CACHE_CONTROL } = require('../apps/api/dist/domain/media');
const { prepareImage } = require('../apps/api/dist/infrastructure/image-processor');
const sharp = require('sharp');
const png = await readFile(new URL('../apps/web/public/apple-touch-icon-180.png', import.meta.url));
const id = randomUUID();
const imageURL = `https://media.bravite.com.br/editorial/${id}.png`;

// Test credentials are synthetic. No test here contacts PostgreSQL, R2, SMTP or Resend.
async function withR2(run) {
  const values = { MEDIA_STORAGE: 'r2', CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), R2_BUCKET: 'bravite-images', R2_PUBLIC_URL: 'https://media.bravite.com.br', R2_ACCESS_KEY_ID: 'test-access', R2_SECRET_ACCESS_KEY: 'test-secret' };
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  Object.assign(process.env, values);
  try { await run(); } finally {
    for (const [key, value] of Object.entries(previous)) if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}

test('R2 configuration refuses partial credentials and unexpected public origins', () => {
  const env = { MEDIA_STORAGE: 'r2', CLOUDFLARE_ACCOUNT_ID: 'a'.repeat(32), R2_ACCESS_KEY_ID: 'test-access', R2_SECRET_ACCESS_KEY: 'test-secret' };
  assert.equal(mediaConfiguration(env).provider, 'r2');
  assert.throws(() => mediaConfiguration({ ...env, R2_SECRET_ACCESS_KEY: '' }), /R2_SECRET_ACCESS_KEY/);
  assert.throws(() => mediaConfiguration({ ...env, R2_PUBLIC_URL: 'https://attacker.example' }), /R2_PUBLIC_URL/);
  assert.throws(() => mediaConfiguration({ ...env, CLOUDFLARE_ACCOUNT_ID: '../unsafe' }), /CLOUDFLARE_ACCOUNT_ID/);
  assert.equal(mediaConfiguration({ MEDIA_STORAGE: 'local' }).provider, 'local');
  assert.throws(() => mediaConfiguration({ NODE_ENV: 'production' }), /MEDIA_STORAGE/);
});

test('media URLs accept the new editorial domain and preserve existing providers', () => {
  assert.equal(isAllowedMediaURL(imageURL), true);
  assert.equal(isAllowedMediaURL(`/api/v1/media/files/${id}.png`), true);
  assert.equal(isAllowedMediaURL('https://imagedelivery.net/account/image/public'), true);
  for (const url of [
    imageURL.replace('https:', 'http:'), imageURL.replace('media.bravite.com.br', 'media.bravite.com.br.attacker.example'),
    imageURL.replace('https://', 'https://user:password@'), imageURL.replace('.br', '.br:8443'),
    imageURL.replace('/editorial/', '/private/'), imageURL.replace('.png', '.svg'), `${imageURL}?redirect=http://127.0.0.1`, `${imageURL}#fragment`,
    imageURL.replace('/editorial/', '/editorial/../editorial/'), imageURL.replace('/editorial/', '/editorial/%2e%2e/editorial/'),
  ]) assert.equal(isAllowedMediaURL(url), false, url);
});

test('content persistence accepts an R2 cover and rejects foreign hosts before querying', async () => {
  const calls = [];
  const service = new ContentService({ query: async (sql, values) => { calls.push({ sql, values }); return { rows: [{}] }; } });
  const post = { title: 'Artigo de teste', slug: 'artigo-teste', excerpt: 'Resumo de artigo para teste.', content: '# Artigo\n\nTexto editorial para verificação.', category: 'Teste', status: 'published', cover_url: imageURL, cover_alt: 'Capa de teste' };
  await service.save('posts', post);
  assert.ok(calls[0].values.includes(imageURL));
  await assert.rejects(service.save('posts', { ...post, cover_url: 'https://attacker.example/image.png' }), error => error.getStatus() === 400);
  assert.equal(calls.length, 1);
});

test('R2 upload uses the bucket, UUID key, real MIME and immutable cache metadata', async t => {
  const calls = [];
  t.mock.method(S3Client.prototype, 'send', async (command, options) => { calls.push({ command, options }); return {}; });
  await withR2(async () => {
    const storage = new MediaStorage();
    try {
      const image = await storage.put(id, 'png', png);
      assert.equal(image.url, imageURL);
      assert.equal(image.provider, 'r2');
      assert.ok(calls[0].command instanceof PutObjectCommand);
      assert.equal(calls[0].command.input.Bucket, 'bravite-images');
      assert.equal(calls[0].command.input.Key, `editorial/${id}.png`);
      assert.equal(calls[0].command.input.ContentType, 'image/png');
      assert.equal(calls[0].command.input.ContentLength, png.length);
      assert.equal(calls[0].command.input.CacheControl, IMAGE_CACHE_CONTROL);
      assert.deepEqual(calls[0].command.input.Body, png);
      assert.ok(calls[0].options.abortSignal);
      await storage.remove(image);
      assert.ok(calls[1].command instanceof DeleteObjectCommand);
      assert.equal(calls[1].command.input.Key, image.key);
    } finally { storage.onModuleDestroy(); }
  });
});

test('R2 failure reports unavailable storage and never records a local fallback', async t => {
  t.mock.method(S3Client.prototype, 'send', async () => { throw new Error('provider failure including private details'); });
  await withR2(async () => {
    const storage = new MediaStorage();
    let queries = 0;
    try {
      const service = new MediaService({ query: async () => { queries++; } }, storage);
      await assert.rejects(service.upload(png), error => error.getStatus() === 503 && !error.message.includes('private details'));
      assert.equal(queries, 0);
    } finally { storage.onModuleDestroy(); }
  });
});

test('invalid or oversized media never reaches storage', async () => {
  let uploads = 0;
  const service = new MediaService({ query: async () => {} }, { put: async () => { uploads++; } });
  await assert.rejects(service.upload(Buffer.from('<svg><script>alert(1)</script></svg>')), error => error.getStatus() === 400);
  await assert.rejects(service.upload(Buffer.alloc(MAX_IMAGE_BYTES + 1)), error => error.getStatus() === 400);
  await assert.rejects(service.upload(png.subarray(0, 32)), error => error.getStatus() === 400);
  assert.equal(uploads, 0);
});

test('image processing limits pixels, rejects animation and removes metadata and appended content', async () => {
  const jpeg = await sharp(png).jpeg().withExif({ IFD0: { Copyright: 'Private test metadata' } }).toBuffer();
  const converted = await prepareImage(Buffer.concat([jpeg, Buffer.from('<script>private payload</script>')]));
  const metadata = await sharp(converted).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 180);
  assert.equal(metadata.height, 180);
  assert.equal(metadata.exif, undefined);
  assert.equal(converted.includes(Buffer.from('private payload')), false);
  const wide = await sharp({ create: { width: 3000, height: 1000, channels: 3, background: '#fff' } }).png().toBuffer();
  const resized = await sharp(await prepareImage(wide)).metadata();
  assert.equal(resized.width, 2560);
  assert.equal(resized.height, 853);
  const tooLarge = await sharp({ create: { width: 5000, height: 5000, channels: 3, background: '#fff' } }).png().toBuffer();
  await assert.rejects(prepareImage(tooLarge), error => error.getStatus() === 400);
  const frames = await Promise.all(['#f00', '#00f'].map(background => sharp({ create: { width: 2, height: 2, channels: 3, background } }).png().toBuffer()));
  const animated = await sharp(frames, { join: { animated: true } }).webp({ loop: 0, delay: [100, 100] }).toBuffer();
  assert.equal((await sharp(animated).metadata()).pages, 2);
  await assert.rejects(prepareImage(animated), error => error.getStatus() === 400);
});

test('database failure cleans up only the newly uploaded object', async () => {
  const image = { key: `editorial/${id}.png`, url: imageURL, provider: 'r2' };
  const removed = [];
  const databaseError = new Error('database failure');
  const service = new MediaService({ query: async () => { throw databaseError; } }, { put: async () => image, remove: async value => { removed.push(value); } });
  await assert.rejects(service.upload(png), error => error === databaseError);
  assert.deepEqual(removed, [image]);
});

test('HTTP upload requires session and allowed origin, validates bytes and enforces multipart limits', async () => {
  const { Module } = require('@nestjs/common');
  const { NestFactory } = require('@nestjs/core');
  const { MediaController } = require('../apps/api/dist/presentation/controllers');
  const { AuthService, AdminGuard } = require('../apps/api/dist/application/auth');
  const { Database } = require('../apps/api/dist/infrastructure/database');
  const { configureHttp } = require('../apps/api/dist/presentation/http-security');
  const origin = 'http://localhost:3000';
  const previousOrigin = process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = origin;
  const stored = [];
  class TestModule {}
  Module({ controllers: [MediaController], providers: [
    MediaService, AdminGuard,
    { provide: Database, useValue: { query: async () => ({ rows: [] }) } },
    { provide: AuthService, useValue: { session: async token => token === 'valid-test-session' ? { id: randomUUID() } : null } },
    { provide: MediaStorage, useValue: { put: async (id, type, bytes) => { stored.push({ id, type, bytes }); return { key: `editorial/${id}.${type}`, url: `https://media.bravite.com.br/editorial/${id}.${type}`, provider: 'r2' }; } } },
  ] })(TestModule);
  const app = await NestFactory.create(TestModule, { bodyParser: false, logger: false });
  configureHttp(app);
  try {
    await app.listen(0, '127.0.0.1');
    const port = app.getHttpServer().address().port;
    const send = async (bytes, { cookie = 'bravite_admin=valid-test-session', requestOrigin = origin, mime = 'image/png', filename = 'image.png' } = {}) => {
      const data = new FormData();
      data.set('file', new Blob([bytes], { type: mime }), filename);
      const response = await fetch(`http://127.0.0.1:${port}/api/v1/media/upload`, { method: 'POST', headers: { Origin: requestOrigin, Cookie: cookie }, body: data });
      return { response, payload: await response.json() };
    };
    assert.equal((await send(png, { cookie: '' })).response.status, 401);
    assert.equal((await send(png, { requestOrigin: 'https://attacker.example' })).response.status, 403);
    assert.equal((await send(Buffer.from('<svg/>'), { mime: 'image/png' })).response.status, 400);
    assert.equal((await send(Buffer.alloc(MAX_IMAGE_BYTES + 1))).response.status, 413);
    assert.equal(stored.length, 0);
    const { response, payload } = await send(png, { mime: 'image/svg+xml', filename: '../../unsafe.svg' });
    assert.equal(response.status, 201);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(payload.data.provider, 'r2');
    assert.match(payload.data.url, /^https:\/\/media\.bravite\.com\.br\/editorial\/[a-f0-9-]{36}\.webp$/);
    assert.equal(stored.length, 1);
    assert.equal(stored[0].type, 'webp');
    assert.equal((await sharp(stored[0].bytes).metadata()).format, 'webp');
  } finally {
    await app.close();
    if (previousOrigin === undefined) delete process.env.APP_ORIGIN; else process.env.APP_ORIGIN = previousOrigin;
  }
});
