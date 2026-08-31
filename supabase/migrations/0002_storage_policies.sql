-- ============================================================
-- STORAGE POLICIES — bucket "birthday-media"
-- Spec Section 7.2 — run AFTER creating the bucket in the
-- dashboard (Storage → New bucket → "birthday-media", Public ON,
-- file size limit 200 MB).
--
-- File path convention: {auth_user_id}/{project_id}/{type}/{filename}
-- ============================================================

-- Authenticated users can upload to their own folder
CREATE POLICY "Authenticated uploads to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'birthday-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own files
CREATE POLICY "Users delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'birthday-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public can read everything in birthday-media
CREATE POLICY "Public reads media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'birthday-media');
