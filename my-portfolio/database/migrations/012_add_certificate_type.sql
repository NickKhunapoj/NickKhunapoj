-- ============================================
-- Certification Subcategories
-- ============================================

ALTER TABLE certifications
ADD COLUMN IF NOT EXISTS certificate_type TEXT;

UPDATE certifications
SET certificate_type = 'exam'
WHERE certificate_type IS NULL
  AND (
    name ILIKE '%certified%'
    OR name ILIKE '%fundamentals%'
    OR issuer ILIKE '%microsoft%'
  );

UPDATE certifications
SET certificate_type = 'completion'
WHERE certificate_type IS NULL;

ALTER TABLE certifications
ALTER COLUMN certificate_type SET DEFAULT 'completion';

ALTER TABLE certifications
ALTER COLUMN certificate_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'certifications_certificate_type_check'
      AND conrelid = 'certifications'::regclass
  ) THEN
    ALTER TABLE certifications
    ADD CONSTRAINT certifications_certificate_type_check
    CHECK (certificate_type IN ('exam', 'completion'));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
