-- Add editable header colour for skill category chips.
ALTER TABLE skills ADD COLUMN IF NOT EXISTS header_color TEXT;
