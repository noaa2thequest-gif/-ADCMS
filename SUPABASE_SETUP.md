# Supabase Cloud Setup Guide for ADCMS

## Overview
This guide explains how to set up the Supabase cloud database for the Aircraft Defect Control & Maintenance System (ADCMS).

## Prerequisites
- Supabase Account (https://supabase.com)
- Project URL and API Key (already configured in the code)

## Setup Steps

### 1. Create Supabase Project
1. Go to https://supabase.com and sign up/login
2. Create a new project
3. Copy the **Project URL** and **Anon Key**
4. These are already configured in:
   - `modules/data.js` (Line 12-13)
   - `modules/auth.js` (Line 12-13)

### 2. Create Database Tables
1. Go to **SQL Editor** in Supabase Dashboard
2. Create a new query
3. Copy and paste the SQL from `database/schema.sql`
4. Execute the query

### 3. Enable Row Level Security (RLS)
The schema.sql already includes RLS policies. Verify in Supabase:
1. Go to **Authentication** → **Policies**
2. Ensure all tables have policies enabled
3. Current policies allow public read/write (can be restricted later)

### 4. Test the Connection
1. Open the ADCMS application
2. Check browser console (F12)
3. Look for: `✅ Supabase Cloud initialized successfully`
4. Try adding an aircraft - it should appear in Supabase

### 5. Verify Data Sync
1. Add data through the ADCMS UI
2. Go to Supabase Dashboard → **Table Editor**
3. Check the `aircraft`, `defects`, `users`, and `spares` tables
4. Data should appear in real-time

## Database Schema

### aircraft
- `id`: Primary key
- `registration`: Aircraft registration (unique)
- `model`: Aircraft model
- `msn`: Manufacturer serial number
- `engines`: Number of engines
- `manufacturing_date`: Date of manufacture
- `location`: Current location
- `status`: Serviceable/AOG/Maintenance
- `created_at`, `updated_at`: Timestamps

### defects
- `id`: Primary key
- `aircraft_id`: Foreign key to aircraft
- `title`: Defect title/issue
- `description`: Detailed description
- `source`: AOG/High/Medium/Low
- `date_reported`: When reported
- `is_mel`: Is this a MEL item?
- `mel_category`: A/B/C/D
- `mel_expiry`: MEL expiry date
- `status`: open/closed/deferred
- `created_at`, `updated_at`: Timestamps

### users
- `id`: Primary key
- `email`: User email (unique)
- `name`: User name
- `role`: admin/mcc/engineer/cabin/auditor/viewer
- `approved`: Account approval status
- `created_at`, `updated_at`: Timestamps

### spares
- `id`: Primary key
- `part_number`: Part number (unique)
- `description`: Part description
- `quantity`: Available quantity
- `location`: Storage location
- `created_at`, `updated_at`: Timestamps

## Troubleshooting

### Connection Issues
- Check browser console for errors
- Verify Supabase URL and API Key in code
- Ensure Supabase project is active

### Data Not Syncing
- Check network tab in browser DevTools
- Verify RLS policies are correct
- Check Supabase logs in Dashboard

### Authentication Issues
- Ensure users table has default users inserted
- Check email and password in login form
- Verify `approved` field is true for user

## Fallback Mode
If Supabase is unavailable, the system automatically falls back to localStorage:
- Data is stored locally in browser
- Multi-user sync won't work
- Data persists across page refreshes

## Next Steps
1. Test all CRUD operations (Create, Read, Update, Delete)
2. Test MEL expiry calculations
3. Test chronic defect detection (3 repeats in 10 days)
4. Test role-based access control
5. Test PDF report generation

## Support
For issues with Supabase, visit: https://supabase.com/docs
For ADCMS support, check the project README.
