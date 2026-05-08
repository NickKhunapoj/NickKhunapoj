-- ============================================
-- Ensure Skills Header Color Exists
-- ============================================

ALTER TABLE skills
ADD COLUMN IF NOT EXISTS header_color TEXT;

NOTIFY pgrst, 'reload schema';
