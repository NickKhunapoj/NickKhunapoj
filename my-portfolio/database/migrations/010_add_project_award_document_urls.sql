-- ============================================
-- Project and Award PDF Documents
-- ============================================

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS document_url TEXT;

ALTER TABLE awards
ADD COLUMN IF NOT EXISTS document_url TEXT;

NOTIFY pgrst, 'reload schema';
