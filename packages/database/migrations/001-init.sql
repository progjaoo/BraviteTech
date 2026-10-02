CREATE TABLE IF NOT EXISTS schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS leads (
 id uuid PRIMARY KEY, intent_token_hash text, name varchar(120), email varchar(254), phone varchar(30), company varchar(160), service varchar(100), message text,
 status varchar(16) NOT NULL DEFAULT 'intent' CHECK (status IN ('intent','new','contacted','qualified','closed')),
 consent_at timestamptz, consent_version varchar(16), source varchar(80), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads(created_at DESC);
CREATE TABLE IF NOT EXISTS admin_users (id uuid PRIMARY KEY, email varchar(254) UNIQUE NOT NULL, password_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS admin_sessions (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS posts (
 id uuid PRIMARY KEY, slug varchar(160) UNIQUE NOT NULL, title varchar(200) NOT NULL, excerpt varchar(400) NOT NULL, content text NOT NULL,
 category varchar(80) NOT NULL DEFAULT 'Estratégia', cover_url text, cover_alt varchar(200) NOT NULL DEFAULT '',
 status varchar(16) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz
);
CREATE INDEX IF NOT EXISTS posts_public_idx ON posts(status,published_at DESC);
CREATE TABLE IF NOT EXISTS cases (
 id uuid PRIMARY KEY, slug varchar(160) UNIQUE NOT NULL, title varchar(200) NOT NULL, client varchar(160) NOT NULL, summary varchar(500) NOT NULL,
 content text NOT NULL, category varchar(80) NOT NULL, cover_url text, cover_alt varchar(200) NOT NULL DEFAULT '', website_url text,
 status varchar(16) NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS media (id uuid PRIMARY KEY, url text NOT NULL, alt varchar(200) NOT NULL DEFAULT '', provider varchar(20) NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS notification_outbox (id uuid PRIMARY KEY, lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE, status varchar(16) NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0, error text, created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz);
INSERT INTO schema_migrations(version) VALUES (1) ON CONFLICT DO NOTHING;
