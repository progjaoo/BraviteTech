import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { prepareImage } from '../infrastructure/image-processor';
import { Database, type DatabaseContext } from '../infrastructure/database';
import { MediaStorage } from '../infrastructure/media-storage';

@Injectable()
export class MediaService {
  constructor(@Inject(Database) private db: Database, @Inject(MediaStorage) private storage: MediaStorage) {}

  async upload(bytes: Buffer, context: DatabaseContext) {
    const prepared = await prepareImage(bytes);
    const id = randomUUID(), image = await this.storage.put(id, 'webp', prepared);
    try {
      await this.db.queryWithContext(context, 'INSERT INTO media(id,url,provider) VALUES($1,$2,$3)', [id, image.url, image.provider]);
    } catch (error) {
      try { await this.storage.remove(image); } catch { console.error('Unable to clean up unregistered media.'); }
      throw error;
    }
    return { id, url: image.url, provider: image.provider };
  }
}
