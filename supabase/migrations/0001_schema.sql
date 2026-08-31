-- ============================================================
-- BIRTHDAY EXPERIENCE GENERATOR — SCHEMA v1
-- Spec Section 7.1 — run in the Supabase SQL Editor as-is.
-- ============================================================

-- Table 1: Birthday Projects
CREATE TABLE birthday_projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug            TEXT UNIQUE,
  recipient       TEXT NOT NULL,
  theme           TEXT DEFAULT 'default',
  message         TEXT DEFAULT '',
  final_message   TEXT DEFAULT '',
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  font_family     TEXT DEFAULT 'sans',
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Table 2: Project Media
CREATE TABLE project_media (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES birthday_projects(id) ON DELETE CASCADE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('photo', 'video', 'music')),
  storage_path    TEXT NOT NULL,
  public_url      TEXT NOT NULL,
  caption         TEXT DEFAULT '',
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Table 3: View Analytics (optional but cheap to add now)
CREATE TABLE experience_views (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID REFERENCES birthday_projects(id) ON DELETE CASCADE,
  viewed_at       TIMESTAMPTZ DEFAULT now(),
  user_agent      TEXT,
  country_code    TEXT
);

-- Indexes
CREATE INDEX idx_birthday_projects_creator ON birthday_projects(creator_id);
CREATE INDEX idx_birthday_projects_slug    ON birthday_projects(slug);
CREATE INDEX idx_project_media_project     ON project_media(project_id);
CREATE INDEX idx_project_media_sort        ON project_media(project_id, sort_order);

-- updated_at trigger
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_on_projects
  BEFORE UPDATE ON birthday_projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE birthday_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_media     ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_views  ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own projects
CREATE POLICY "Creators manage own projects"
  ON birthday_projects FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Anyone can read published projects
CREATE POLICY "Public reads published projects"
  ON birthday_projects FOR SELECT
  USING (status = 'published');

-- Creators can manage their own media
CREATE POLICY "Creators manage own media"
  ON project_media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM birthday_projects
      WHERE id = project_media.project_id
        AND creator_id = auth.uid()
    )
  );

-- Public can read media of published projects
CREATE POLICY "Public reads published media"
  ON project_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM birthday_projects
      WHERE id = project_media.project_id
        AND status = 'published'
    )
  );

-- Anyone can insert a view (for analytics)
CREATE POLICY "Anyone records views"
  ON experience_views FOR INSERT
  WITH CHECK (true);

-- Creators see their own analytics
CREATE POLICY "Creators read own analytics"
  ON experience_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM birthday_projects
      WHERE id = experience_views.project_id
        AND creator_id = auth.uid()
    )
  );
