-- Create enum for school level
CREATE TYPE school_level AS ENUM ('elementary', 'high_school');

-- Create parents table
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  barcode TEXT UNIQUE NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  school_level school_level NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_students_barcode ON students(barcode);
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_parents_email ON parents(email);

-- Enable Row Level Security
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can restrict later)
CREATE POLICY "Allow all operations on parents" ON parents FOR ALL USING (true);
CREATE POLICY "Allow all operations on students" ON students FOR ALL USING (true);

-- Insert some test data
INSERT INTO parents (id, name, email, phone) VALUES
  ('11111111-1111-1111-1111-111111111111', 'John Smith', 'john.smith@email.com', '555-0101'),
  ('22222222-2222-2222-2222-222222222222', 'Sarah Johnson', 'sarah.j@email.com', '555-0102'),
  ('33333333-3333-3333-3333-333333333333', 'Mike Williams', 'mike.w@email.com', '555-0103');

INSERT INTO students (parent_id, name, barcode, balance, school_level) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Emma Smith', '1001', 25.00, 'elementary'),
  ('11111111-1111-1111-1111-111111111111', 'Liam Smith', '1002', 12.50, 'high_school'),
  ('22222222-2222-2222-2222-222222222222', 'Olivia Johnson', '1003', 8.00, 'elementary'),
  ('22222222-2222-2222-2222-222222222222', 'Noah Johnson', '1004', 30.00, 'high_school'),
  ('33333333-3333-3333-3333-333333333333', 'Ava Williams', '1005', 5.50, 'elementary');
