-- Add is_active column to parents table
ALTER TABLE parents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Add is_active column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_parents_is_active ON parents(is_active);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);

-- Set all existing records to active by default (already handled by DEFAULT true, but explicit for clarity)
UPDATE parents SET is_active = true WHERE is_active IS NULL;
UPDATE students SET is_active = true WHERE is_active IS NULL;
