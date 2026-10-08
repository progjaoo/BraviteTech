import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { Client } from 'pg';

const connectionString = process.env.DATABASE_MIGRATION_URL;
const email = process.env.ADMIN_EMAIL?.normalize('NFC').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!connectionString) throw new Error('Set DATABASE_MIGRATION_URL to the direct migration connection.');
if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('ADMIN_EMAIL must be a valid e-mail address.');
if (!password || Buffer.byteLength(password) < 16) throw new Error('ADMIN_PASSWORD must contain at least 16 bytes.');

const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
const client = new Client({ connectionString, connectionTimeoutMillis: 10000 });
await client.connect();
try {
  const rls = await client.query('SELECT 1 FROM schema_migrations WHERE version = 4');
  if (rls.rowCount) {
    const access = await client.query('SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user');
    if (!access.rows[0]?.rolbypassrls) {
      throw new Error('Bootstrap the first administrator before migration 004 enables FORCE RLS, or use the dedicated privileged migration role.');
    }
  }
  const result = await client.query(
    'INSERT INTO admin_users(id,email,password_hash) VALUES($1,$2,$3) ON CONFLICT(email) DO NOTHING RETURNING id',
    [randomUUID(), email, `${salt}:${hash}`],
  );
  if (!result.rowCount) throw new Error('An administrator with this e-mail already exists; bootstrap never overwrites accounts.');
  console.log('Initial administrator created. The password was not displayed.');
} finally {
  await client.end();
}
