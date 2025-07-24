-- 🚀 COMPLETE DATABASE MIGRATION FOR PRODUCTION DEPLOYMENT
-- Run this entire SQL script in your Supabase SQL Editor to set up all tables

-- ============================================================================
-- 1. CREATE ALL REQUIRED TABLES
-- ============================================================================

-- Create user_balances table
CREATE TABLE IF NOT EXISTS public.user_balances (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create ticket_messages table
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create gift_card_submissions table
CREATE TABLE IF NOT EXISTS public.gift_card_submissions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  gift_card_code TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON public.user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_user_id ON public.ticket_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_submissions_user_id ON public.gift_card_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

-- ============================================================================
-- 3. CREATE UPDATE TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. ADD UPDATE TRIGGERS
-- ============================================================================

-- Add trigger for user_balances
DROP TRIGGER IF EXISTS update_user_balances_updated_at ON public.user_balances;
CREATE TRIGGER update_user_balances_updated_at
    BEFORE UPDATE ON public.user_balances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for support_tickets
DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for gift_card_submissions
DROP TRIGGER IF EXISTS update_gift_card_submissions_updated_at ON public.gift_card_submissions;
CREATE TRIGGER update_gift_card_submissions_updated_at
    BEFORE UPDATE ON public.gift_card_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES
-- ============================================================================

-- User Balances Policies
DROP POLICY IF EXISTS "Users can view own balance" ON public.user_balances;
DROP POLICY IF EXISTS "Users can update own balance" ON public.user_balances;
DROP POLICY IF EXISTS "Admins can manage all balances" ON public.user_balances;

CREATE POLICY "Users can view own balance" ON public.user_balances
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own balance" ON public.user_balances
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage all balances" ON public.user_balances
    FOR ALL USING (
        (auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- Support Tickets Policies
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.support_tickets;

CREATE POLICY "Users can view own tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
    FOR ALL USING (
        (auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- Ticket Messages Policies
DROP POLICY IF EXISTS "Users can view messages in own tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can create messages in own tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.ticket_messages;

CREATE POLICY "Users can view messages in own tickets" ON public.ticket_messages
    FOR SELECT USING (
        auth.uid()::text = user_id OR
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE id = ticket_id AND user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can create messages in own tickets" ON public.ticket_messages
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id OR
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE id = ticket_id AND user_id = auth.uid()::text
        )
    );

CREATE POLICY "Admins can manage all messages" ON public.ticket_messages
    FOR ALL USING (
        (auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- Gift Card Submissions Policies
DROP POLICY IF EXISTS "Users can view own submissions" ON public.gift_card_submissions;
DROP POLICY IF EXISTS "Users can create own submissions" ON public.gift_card_submissions;
DROP POLICY IF EXISTS "Admins can manage all submissions" ON public.gift_card_submissions;

CREATE POLICY "Users can view own submissions" ON public.gift_card_submissions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own submissions" ON public.gift_card_submissions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage all submissions" ON public.gift_card_submissions
    FOR ALL USING (
        (auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- User Profiles Policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;

CREATE POLICY "Users can view all profiles" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can create own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
    FOR ALL USING (
        (auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- ============================================================================
-- 7. CREATE AUTO-PROFILE CREATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    LOWER(split_part(NEW.email, '@', 1)) || '_' || LEFT(NEW.id, 4)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 8. CREATE PROFILES FOR EXISTING USERS
-- ============================================================================

INSERT INTO public.user_profiles (user_id, display_name, username)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
    LOWER(split_part(email, '@', 1)) || '_' || LEFT(id, 4)
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_profiles)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 9. COMPLETION MESSAGE
-- ============================================================================

SELECT 
    '🚀 COMPLETE DATABASE MIGRATION SUCCESSFUL!' as status,
    'All tables, indexes, triggers, and policies have been created.' as message,
    'Your deployed site should now work correctly for all users.' as note;