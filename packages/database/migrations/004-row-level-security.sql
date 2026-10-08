-- The runtime role is created by scripts/migrate-database.mjs before this migration.
-- It is deliberately separate from the owner used by the migration command.

CREATE OR REPLACE FUNCTION public.bravite_has_admin_session()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_sessions AS session
    WHERE session.token_hash = NULLIF(current_setting('bravite.session_token_hash', true), '')
      AND session.expires_at > now()
  );
$$;

CREATE OR REPLACE FUNCTION public.bravite_is_worker()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT current_setting('bravite.worker', true) = 'true';
$$;

REVOKE ALL ON FUNCTION public.bravite_has_admin_session() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bravite_is_worker() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bravite_has_admin_session() TO bravite_runtime;
GRANT EXECUTE ON FUNCTION public.bravite_is_worker() TO bravite_runtime;

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users FORCE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE admin_login_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_login_rate_limits FORCE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads FORCE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts FORCE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases FORCE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE media FORCE ROW LEVEL SECURITY;
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_outbox FORCE ROW LEVEL SECURITY;

CREATE POLICY admin_users_runtime_read ON admin_users
  FOR SELECT TO bravite_runtime
  USING (
    email = NULLIF(current_setting('bravite.login_email', true), '')
    OR public.bravite_has_admin_session()
  );

CREATE POLICY admin_sessions_runtime_read ON admin_sessions
  FOR SELECT TO bravite_runtime
  USING (
    token_hash = NULLIF(current_setting('bravite.session_token_hash', true), '')
    AND expires_at > now()
  );
CREATE POLICY admin_sessions_runtime_insert ON admin_sessions
  FOR INSERT TO bravite_runtime
  WITH CHECK (user_id::text = NULLIF(current_setting('bravite.login_user_id', true), ''));
CREATE POLICY admin_sessions_runtime_delete ON admin_sessions
  FOR DELETE TO bravite_runtime
  USING (token_hash = NULLIF(current_setting('bravite.session_token_hash', true), ''));

CREATE POLICY admin_login_rate_limits_runtime ON admin_login_rate_limits
  FOR ALL TO bravite_runtime
  USING (true)
  WITH CHECK (true);

CREATE POLICY leads_public_intent_insert ON leads
  FOR INSERT TO bravite_runtime
  WITH CHECK (
    status = 'intent'
    AND intent_token_hash IS NOT NULL
    AND name IS NULL
    AND email IS NULL
    AND phone IS NULL
  );
CREATE POLICY leads_public_intent_update ON leads
  FOR UPDATE TO bravite_runtime
  USING (
    status = 'intent'
    AND intent_token_hash = NULLIF(current_setting('bravite.intent_token_hash', true), '')
    AND created_at > now() - interval '30 minutes'
  )
  WITH CHECK (status = 'new' AND intent_token_hash IS NULL);
CREATE POLICY leads_runtime_admin_or_worker_read ON leads
  FOR SELECT TO bravite_runtime
  USING (public.bravite_has_admin_session() OR public.bravite_is_worker());
CREATE POLICY leads_runtime_admin_or_worker_insert ON leads
  FOR INSERT TO bravite_runtime
  WITH CHECK (public.bravite_has_admin_session() OR public.bravite_is_worker());
CREATE POLICY leads_runtime_admin_write ON leads
  FOR UPDATE TO bravite_runtime
  USING (public.bravite_has_admin_session())
  WITH CHECK (public.bravite_has_admin_session());
CREATE POLICY leads_runtime_admin_delete ON leads
  FOR DELETE TO bravite_runtime
  USING (public.bravite_has_admin_session());

CREATE POLICY posts_public_or_admin_read ON posts
  FOR SELECT TO bravite_runtime
  USING (status = 'published' OR public.bravite_has_admin_session());
CREATE POLICY posts_admin_insert ON posts
  FOR INSERT TO bravite_runtime
  WITH CHECK (public.bravite_has_admin_session());
CREATE POLICY posts_admin_update ON posts
  FOR UPDATE TO bravite_runtime
  USING (public.bravite_has_admin_session())
  WITH CHECK (public.bravite_has_admin_session());
CREATE POLICY posts_admin_delete ON posts
  FOR DELETE TO bravite_runtime
  USING (public.bravite_has_admin_session());

CREATE POLICY cases_public_or_admin_read ON cases
  FOR SELECT TO bravite_runtime
  USING (status = 'published' OR public.bravite_has_admin_session());
CREATE POLICY cases_admin_insert ON cases
  FOR INSERT TO bravite_runtime
  WITH CHECK (public.bravite_has_admin_session());
CREATE POLICY cases_admin_update ON cases
  FOR UPDATE TO bravite_runtime
  USING (public.bravite_has_admin_session())
  WITH CHECK (public.bravite_has_admin_session());
CREATE POLICY cases_admin_delete ON cases
  FOR DELETE TO bravite_runtime
  USING (public.bravite_has_admin_session());

CREATE POLICY media_admin_read ON media
  FOR SELECT TO bravite_runtime
  USING (public.bravite_has_admin_session());
CREATE POLICY media_admin_insert ON media
  FOR INSERT TO bravite_runtime
  WITH CHECK (public.bravite_has_admin_session());
CREATE POLICY media_admin_update ON media
  FOR UPDATE TO bravite_runtime
  USING (public.bravite_has_admin_session())
  WITH CHECK (public.bravite_has_admin_session());
CREATE POLICY media_admin_delete ON media
  FOR DELETE TO bravite_runtime
  USING (public.bravite_has_admin_session());

CREATE POLICY notification_outbox_runtime_insert ON notification_outbox
  FOR INSERT TO bravite_runtime
  WITH CHECK (public.bravite_is_worker() OR public.bravite_has_admin_session());
CREATE POLICY notification_outbox_runtime_read ON notification_outbox
  FOR SELECT TO bravite_runtime
  USING (public.bravite_is_worker() OR public.bravite_has_admin_session());
CREATE POLICY notification_outbox_runtime_update ON notification_outbox
  FOR UPDATE TO bravite_runtime
  USING (public.bravite_is_worker() OR public.bravite_has_admin_session())
  WITH CHECK (public.bravite_is_worker() OR public.bravite_has_admin_session());

GRANT USAGE ON SCHEMA public TO bravite_runtime;
GRANT SELECT ON schema_migrations TO bravite_runtime;
GRANT SELECT ON admin_users TO bravite_runtime;
GRANT SELECT, INSERT, DELETE ON admin_sessions TO bravite_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_login_rate_limits TO bravite_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads, posts, cases TO bravite_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON media TO bravite_runtime;
GRANT SELECT, INSERT, UPDATE ON notification_outbox TO bravite_runtime;

ALTER TABLE notification_outbox ADD COLUMN IF NOT EXISTS locked_at timestamptz;
CREATE INDEX IF NOT EXISTS notification_outbox_pending_idx
  ON notification_outbox (created_at)
  WHERE status IN ('pending', 'processing');

INSERT INTO schema_migrations(version) VALUES (4) ON CONFLICT DO NOTHING;
