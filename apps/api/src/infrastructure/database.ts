import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { attachDatabasePool } from '@vercel/functions';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

export interface DatabaseContext {
  sessionTokenHash?: string;
  loginEmail?: string;
  loginUserId?: string;
  intentTokenHash?: string;
  worker?: boolean;
}

type TransactionWork<T> = (client: PoolClient) => Promise<T>;

@Injectable()
export class Database implements OnModuleInit, OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.VERCEL ? 3 : 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 5000,
  });

  constructor() {
    if (process.env.VERCEL) attachDatabasePool(this.pool);
  }

  async query<T extends QueryResultRow = QueryResultRow>(sql: string, values: unknown[] = []) {
    return this.pool.query<T>(sql, values);
  }

  async queryWithContext<T extends QueryResultRow = QueryResultRow>(
    context: DatabaseContext,
    sql: string,
    values: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.transactionWithContext(context, async client => client.query<T>(sql, values));
  }

  async transactionWithContext<T>(context: DatabaseContext, work: TransactionWork<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `SELECT
          set_config('bravite.session_token_hash', $1, true),
          set_config('bravite.login_email', $2, true),
          set_config('bravite.login_user_id', $3, true),
          set_config('bravite.intent_token_hash', $4, true),
          set_config('bravite.worker', $5, true)`,
        [
          context.sessionTokenHash ?? '',
          context.loginEmail ?? '',
          context.loginUserId ?? '',
          context.intentTokenHash ?? '',
          context.worker ? 'true' : 'false',
        ],
      );
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be configured.');
    if (Buffer.byteLength(process.env.LOGIN_RATE_LIMIT_SECRET || '') < 32) {
      throw new Error('LOGIN_RATE_LIMIT_SECRET must contain at least 32 bytes.');
    }

    const { rows } = await this.query<{ version: number }>(
      'SELECT version FROM schema_migrations WHERE version = 4',
    );
    if (!rows.length) throw new Error('Database migrations must be applied before starting the API.');

    if (process.env.VERCEL) {
      const role = await this.query<{ rolsuper: boolean; rolbypassrls: boolean }>(
        'SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user',
      );
      if (!role.rows[0] || role.rows[0].rolsuper || role.rows[0].rolbypassrls) {
        throw new Error('DATABASE_URL must use the restricted bravite_runtime role on Vercel.');
      }
    }

    await this.query('SELECT 1');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
