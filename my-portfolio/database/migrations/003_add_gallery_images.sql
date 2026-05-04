-- ============================================
-- Migration 003: Add gallery_images columns
-- Run this in Supabase SQL Editor
-- ============================================

-- Add gallery_images to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- Add gallery_images to awards  
ALTER TABLE awards ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- Add gallery_images to certifications
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- Ensure profile columns exist (safe to re-run)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;
