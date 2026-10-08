import { readdir, readFile } from 'node:fs/promises';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

const migrationUrl = process.env.DATABASE_MIGRATION_URL;
const runtimePassword = process.env.DATABASE_RUNTIME_PASSWORD;
const throughArgument = process.argv.find(argument => argument.startsWith('--through='));
const throughVersion = throughArgument ? Number(throughArgument.split('=')[1]) : Number.POSITIVE_INFINITY;

if (!migrationUrl) throw new Error('Set DATABASE_MIGRATION_URL to the direct, non-pooled migration connection.');
if (!runtimePassword || Buffer.byteLength(runtimePassword) < 32 || runtimePassword.includes('\0')) {
  throw new Error('DATABASE_RUNTIME_PASSWORD must contain at least 32 bytes and no NUL characters.');
}
if (throughArgument && (!Number.isInteger(throughVersion) || throughVersion < 1)) {
  throw new Error('Use --through=<positive migration number>, for example --through=3.');
}

const url = new URL(migrationUrl);
if (url.hostname.includes('-pooler')) throw new Error('DATABASE_MIGRATION_URL must use the direct Neon hostname, without -pooler.');

function sqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

const client = new Client({ connectionString: migrationUrl, connectionTimeoutMillis: 10000 });
await client.connect();

try {
  const owner = await client.query('SELECT current_user, current_database() AS database');
  const roleCheck = await client.query(
    'SELECT rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = current_user',
  );
  const privileges = roleCheck.rows[0];
  if (!privileges?.rolcreaterole || owner.rows[0].current_user === 'bravite_runtime') {
    throw new Error('DATABASE_MIGRATION_URL must use a database owner or migration role, never bravite_runtime.');
  }

  await client.query(`DO $role$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bravite_runtime') THEN
        CREATE ROLE bravite_runtime;
      END IF;
    END
  $role$`);
  await client.query(
    `ALTER ROLE bravite_runtime WITH LOGIN PASSWORD ${sqlLiteral(runtimePassword)} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`,
  );
  await client.query(`GRANT CONNECT ON DATABASE "${owner.rows[0].database.replaceAll('"', '""')}" TO bravite_runtime`);
  await client.query('GRANT USAGE ON SCHEMA public TO bravite_runtime');

  const folder = resolve(process.cwd(), 'packages/database/migrations');
  const files = (await readdir(folder)).filter(name => /^\d{3}-.*\.sql$/.test(name)).sort();
  for (const file of files) {
    const version = Number(file.slice(0, 3));
    if (version > throughVersion) continue;
    const applied = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [version]).catch(error => {
      if (version === 1 && error.code === '42P01') return { rows: [] };
      throw error;
    });
    if (applied.rowCount) {
      console.log(`Migration ${version} already applied.`);
      continue;
    }
    await client.query('BEGIN');
    try {
      await client.query(await readFile(resolve(folder, file), 'utf8'));
      await client.query('COMMIT');
      console.log(`Applied migration ${version}: ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  const appliedRls = await client.query('SELECT 1 FROM schema_migrations WHERE version = 4');
  if (!appliedRls.rowCount) {
    console.log('Migrations applied through the requested version; RLS migration 004 is still pending.');
  } else {
  const checks = await client.query(
    `SELECT migration.version, relation.relrowsecurity AS rowsecurity, relation.relforcerowsecurity AS force_rowsecurity, relation.relname AS table_name
     FROM schema_migrations AS migration
     CROSS JOIN pg_class AS relation
     JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
     WHERE migration.version = 4 AND namespace.nspname = 'public'
       AND relation.relname IN ('admin_users','admin_sessions','admin_login_rate_limits','leads','posts','cases','media','notification_outbox')
     ORDER BY relation.relname`,
  );
  if (!checks.rows.length || checks.rows.some(row => !row.rowsecurity || !row.force_rowsecurity)) {
    throw new Error('RLS verification failed; migration 004 must enable and force row security on every protected table.');
  }
  const runtimeRole = await client.query(
    "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'bravite_runtime'",
  );
  if (runtimeRole.rows[0]?.rolsuper || runtimeRole.rows[0]?.rolbypassrls || checks.rows.length !== 8) {
    throw new Error('Runtime role or RLS catalog verification failed.');
  }
  const runtimeUrl = new URL(process.env.DATABASE_URL || migrationUrl);
  if (['localhost', '127.0.0.1', '::1'].includes(runtimeUrl.hostname) && existsSync(resolve(process.cwd(), '.env.local'))) {
    runtimeUrl.username = 'bravite_runtime';
    runtimeUrl.password = runtimePassword;
    const envPath = resolve(process.cwd(), '.env.local');
    const env = readFileSync(envPath, 'utf8');
    const nextEnv = /^DATABASE_URL=.*$/m.test(env)
      ? env.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${runtimeUrl.toString()}`)
      : `${env}${env.endsWith('\n') ? '' : '\n'}DATABASE_URL=${runtimeUrl.toString()}\n`;
    writeFileSync(envPath, nextEnv, { mode: 0o600 });
    console.log('Local DATABASE_URL switched to bravite_runtime after migration.');
  }
  console.log(`Migration check passed: ${checks.rows.length} tables force RLS; bravite_runtime has no RLS bypass.`);
  }
} finally {
  await client.end();
}
