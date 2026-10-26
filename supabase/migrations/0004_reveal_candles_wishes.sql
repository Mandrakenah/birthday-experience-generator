-- ============================================================
-- Scheduled reveal, candle count, and friends' wishes.
--
-- The app degrades gracefully without this migration (the new
-- editor controls simply stay hidden), so it is safe to deploy
-- the code first and run this afterwards.
-- ============================================================

ALTER TABLE birthday_projects
  -- Before this moment /b/[slug] shows a countdown instead of the experience.
  ADD COLUMN reveal_at TIMESTAMPTZ,
  ADD COLUMN candle_count SMALLINT NOT NULL DEFAULT 5
    CHECK (candle_count BETWEEN 1 AND 10),
  -- Whether /wish/[id] accepts new wishes from friends.
  ADD COLUMN wishes_enabled BOOLEAN NOT NULL DEFAULT false;

-- Short messages friends leave for the birthday person. Inserts go through
-- /api/wishes (service role), which checks wishes_enabled and the limits —
-- there is deliberately no anonymous INSERT policy.
CREATE TABLE project_wishes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES birthday_projects(id) ON DELETE CASCADE NOT NULL,
  author_name     TEXT NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 60),
  message         TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 280),
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_project_wishes_project ON project_wishes(project_id, created_at);

ALTER TABLE project_wishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own wishes"
  ON project_wishes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM birthday_projects
      WHERE id = project_wishes.project_id
        AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Public reads published wishes"
  ON project_wishes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM birthday_projects
      WHERE id = project_wishes.project_id
        AND status = 'published'
    )
  );

-- Views were insertable for ANY project id, including drafts. Only count
-- views of pages that are actually published.
DROP POLICY "Anyone records views" ON experience_views;

CREATE POLICY "Anyone records views of published projects"
  ON experience_views FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM birthday_projects
      WHERE id = experience_views.project_id
        AND status = 'published'
    )
  );
