CREATE TABLE IF NOT EXISTS admin_login_rate_limits (
  scope varchar(8) NOT NULL CHECK (scope IN ('ip', 'email')),
  key_hash varchar(64) NOT NULL CHECK (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, key_hash)
);

CREATE INDEX IF NOT EXISTS admin_login_rate_limits_updated_idx
  ON admin_login_rate_limits (updated_at);

INSERT INTO schema_migrations(version) VALUES (3) ON CONFLICT DO NOTHING;
