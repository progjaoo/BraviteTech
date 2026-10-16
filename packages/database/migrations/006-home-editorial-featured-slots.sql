ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS home_featured_position smallint;

ALTER TABLE posts
  DROP CONSTRAINT IF EXISTS posts_home_featured_position_check;
ALTER TABLE posts
  ADD CONSTRAINT posts_home_featured_position_check
  CHECK (home_featured_position IS NULL OR home_featured_position IN (1, 2, 3));

ALTER TABLE cases
  DROP CONSTRAINT IF EXISTS cases_home_featured_position_check;
ALTER TABLE cases
  ADD CONSTRAINT cases_home_featured_position_check
  CHECK (home_featured_position IS NULL OR home_featured_position IN (1, 2, 3));

CREATE UNIQUE INDEX IF NOT EXISTS posts_home_featured_position_unique
  ON posts (home_featured_position)
  WHERE home_featured_position IS NOT NULL;

-- Seleciona os três artigos publicados mais recentes na primeira aplicação.
WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC, id) AS position
  FROM posts
  WHERE status = 'published'
  ORDER BY published_at DESC NULLS LAST, created_at DESC, id
  LIMIT 3
)
UPDATE posts AS article
SET home_featured_position = ranked.position::smallint
FROM ranked
WHERE article.id = ranked.id
  AND article.home_featured_position IS NULL;

-- Preserva as escolhas existentes dos projetos e preenche somente a terceira posição.
WITH candidate AS (
  SELECT id
  FROM cases
  WHERE status = 'published'
    AND home_featured_position IS NULL
    AND NOT EXISTS (SELECT 1 FROM cases WHERE home_featured_position = 3)
  ORDER BY created_at DESC, id
  LIMIT 1
)
UPDATE cases AS project
SET home_featured_position = 3
FROM candidate
WHERE project.id = candidate.id;

INSERT INTO schema_migrations(version) VALUES (6) ON CONFLICT DO NOTHING;
