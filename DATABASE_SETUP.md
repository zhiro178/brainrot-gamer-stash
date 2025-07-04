# Database Setup for Gaming Marketplace

This application requires database tables to be set up in your Supabase project. The application is currently configured to connect to a Supabase database.

## Required Tables

Execute the following SQL in your Supabase SQL Editor to create the required tables:

```sql
-- Create user_balances table
CREATE TABLE IF NOT EXISTS user_balances (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create ticket_messages table
CREATE TABLE IF NOT EXISTS ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create gift_card_submissions table
CREATE TABLE IF NOT EXISTS gift_card_submissions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  gift_card_code TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

## Database Configuration

The application currently uses hardcoded Supabase credentials in the code. For production use, you should:

1. Replace the hardcoded credentials with environment variables
2. Set up proper Row Level Security (RLS) policies
3. Configure authentication policies

## Current Supabase Configuration

The application is currently configured to use:
- Supabase URL: `https://uahxenisnppufpswupnz.supabase.co`
- Supabase Anon Key: (visible in source code)

## Error Handling

The application includes error handling for missing database tables and will continue to function even if the database tables don't exist, though some features may not work properly.