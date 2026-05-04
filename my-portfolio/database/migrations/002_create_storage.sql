-- ============================================
-- Supabase Storage Setup: portfolio-assets
-- ============================================

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-assets',
  'portfolio-assets',
  true,
  5242880, -- 5MB limit
  '{image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf}'
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  allowed_mime_types = '{image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf}';

-- 2. Storage Policies

-- Public Read Access
CREATE POLICY "Public read access for portfolio-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'portfolio-assets' );

-- Authenticated Upload Access
CREATE POLICY "Admin upload access for portfolio-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'portfolio-assets' );

-- Authenticated Update Access
CREATE POLICY "Admin update access for portfolio-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'portfolio-assets' );

-- Authenticated Delete Access
CREATE POLICY "Admin delete access for portfolio-assets"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'portfolio-assets' );
