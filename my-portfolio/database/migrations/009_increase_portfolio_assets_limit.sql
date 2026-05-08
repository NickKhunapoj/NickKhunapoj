-- ============================================
-- Align storage upload limit with admin file validation
-- ============================================

UPDATE storage.buckets
SET
  file_size_limit = 10485760,
  allowed_mime_types = '{image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf}'
WHERE id = 'portfolio-assets';
