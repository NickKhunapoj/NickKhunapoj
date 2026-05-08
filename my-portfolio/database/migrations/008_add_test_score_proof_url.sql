-- ============================================
-- Test Score Proof Files
-- ============================================

ALTER TABLE test_scores
ADD COLUMN IF NOT EXISTS proof_url TEXT;

NOTIFY pgrst, 'reload schema';
