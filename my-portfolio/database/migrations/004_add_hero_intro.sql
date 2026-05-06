-- Add editable hero intro copy for the landing hero section.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hero_intro TEXT;
