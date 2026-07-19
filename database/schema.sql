-- ADCMS Database Schema for Supabase
-- This schema defines all tables needed for the Aircraft Defect Control & Maintenance System

-- Aircraft Table
CREATE TABLE IF NOT EXISTS aircraft (
  id BIGSERIAL PRIMARY KEY,
  registration VARCHAR(20) UNIQUE NOT NULL,
  model VARCHAR(100) NOT NULL,
  msn VARCHAR(50),
  engines INT,
  manufacturing_date DATE,
  location VARCHAR(50),
  status VARCHAR(50) DEFAULT 'SERVICEABLE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Defects Table
CREATE TABLE IF NOT EXISTS defects (
  id BIGSERIAL PRIMARY KEY,
  aircraft_id BIGINT REFERENCES aircraft(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  source VARCHAR(50),
  date_reported TIMESTAMP,
  is_mel BOOLEAN DEFAULT FALSE,
  mel_category VARCHAR(10),
  mel_expiry TIMESTAMP,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'viewer',
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Spares/Inventory Table
CREATE TABLE IF NOT EXISTS spares (
  id BIGSERIAL PRIMARY KEY,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  quantity INT DEFAULT 0,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_aircraft_registration ON aircraft(registration);
CREATE INDEX IF NOT EXISTS idx_defects_aircraft_id ON defects(aircraft_id);
CREATE INDEX IF NOT EXISTS idx_defects_is_mel ON defects(is_mel);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_spares_part_number ON spares(part_number);

-- Enable Row Level Security (RLS) for security
ALTER TABLE aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE spares ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for public access (can be restricted later)
CREATE POLICY "Enable read access for all users" ON aircraft FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON aircraft FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON aircraft FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON aircraft FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON defects FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON defects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON defects FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON defects FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON users FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON spares FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON spares FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON spares FOR UPDATE USING (true);

-- Insert default users
INSERT INTO users (email, name, role, approved) VALUES
  ('hany@adcms.com', 'Hany Omar', 'admin', true),
  ('mcc@adcms.com', 'MCC Team', 'mcc', true),
  ('eng@adcms.com', 'Engineer', 'engineer', true)
ON CONFLICT (email) DO NOTHING;
