-- ============================================================
-- Custom theme builder — adds a JSONB column holding the
-- creator's fully-custom page config (colors, bg image + opacity,
-- text styling, and placed stickers). Only used when
-- birthday_projects.theme = 'custom'; null otherwise.
-- ============================================================

ALTER TABLE birthday_projects
  ADD COLUMN custom_theme JSONB;
