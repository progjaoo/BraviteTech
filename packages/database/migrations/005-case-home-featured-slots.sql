ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS home_featured_position smallint;

DO $constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cases_home_featured_position_check'
      AND conrelid = 'public.cases'::regclass
  ) THEN
    ALTER TABLE cases
      ADD CONSTRAINT cases_home_featured_position_check
      CHECK (home_featured_position IS NULL OR home_featured_position IN (1, 2));
  END IF;
END
$constraint$;

CREATE UNIQUE INDEX IF NOT EXISTS cases_home_featured_position_unique
  ON cases (home_featured_position)
  WHERE home_featured_position IS NOT NULL;

WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY created_at DESC, id) AS position
  FROM cases
  WHERE status = 'published'
  ORDER BY created_at DESC, id
  LIMIT 2
)
UPDATE cases AS project
SET home_featured_position = ranked.position::smallint
FROM ranked
WHERE project.id = ranked.id
  AND project.home_featured_position IS NULL;

INSERT INTO schema_migrations(version) VALUES (5) ON CONFLICT DO NOTHING;
