-- 🚨 COMPLETE DATABASE SETUP - Fix Balance & Chat Errors
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- 1. Create user_balances table
CREATE TABLE IF NOT EXISTS public.user_balances (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Create support_tickets table
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

-- 3. Create ticket_messages table
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Create gift_card_submissions table
CREATE TABLE IF NOT EXISTS public.gift_card_submissions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  gift_card_code TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON public.user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_user_id ON public.ticket_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_submissions_user_id ON public.gift_card_submissions(user_id);

-- 6. Enable Row Level Security
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_submissions ENABLE ROW LEVEL SECURITY;

-- 7. Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own balance" ON public.user_balances;
DROP POLICY IF EXISTS "Users can update own balance" ON public.user_balances;
DROP POLICY IF EXISTS "Admins can manage all balances" ON public.user_balances;

DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.support_tickets;

DROP POLICY IF EXISTS "Users can view messages for own tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can create messages for own tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.ticket_messages;

DROP POLICY IF EXISTS "Users can view own gift cards" ON public.gift_card_submissions;
DROP POLICY IF EXISTS "Users can create own gift cards" ON public.gift_card_submissions;
DROP POLICY IF EXISTS "Admins can manage all gift cards" ON public.gift_card_submissions;

-- 8. Create comprehensive policies for user_balances
CREATE POLICY "Users can view own balance" ON public.user_balances
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own balance" ON public.user_balances
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own balance" ON public.user_balances
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage all balances" ON public.user_balances
    FOR ALL USING (
        (auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- 9. Create comprehensive policies for support_tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own tickets" ON public.support_tickets
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets
    FOR ALL USING (
        (auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- 10. Create comprehensive policies for ticket_messages
CREATE POLICY "Users can view messages for own tickets" ON public.ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE support_tickets.id = ticket_messages.ticket_id 
            AND support_tickets.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can create messages for own tickets" ON public.ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE support_tickets.id = ticket_messages.ticket_id 
            AND support_tickets.user_id = auth.uid()::text
        )
        AND auth.uid()::text = user_id
    );

CREATE POLICY "Admins can manage all messages" ON public.ticket_messages
    FOR ALL USING (
        (auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- 11. Create comprehensive policies for gift_card_submissions
CREATE POLICY "Users can view own gift cards" ON public.gift_card_submissions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own gift cards" ON public.gift_card_submissions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Admins can manage all gift cards" ON public.gift_card_submissions
    FOR ALL USING (
        (auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- 12. Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 13. Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_user_balances_updated_at ON public.user_balances;
CREATE TRIGGER update_user_balances_updated_at
    BEFORE UPDATE ON public.user_balances
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_gift_card_submissions_updated_at ON public.gift_card_submissions;
CREATE TRIGGER update_gift_card_submissions_updated_at
    BEFORE UPDATE ON public.gift_card_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 14. Insert sample data for testing (optional)
-- Insert admin balance records to avoid errors
INSERT INTO public.user_balances (user_id, balance) 
VALUES 
    ('admin-test-id', 1000.00),
    ('sample-user-id', 0.00)
ON CONFLICT (user_id) DO NOTHING;

-- 15. Test queries to verify everything works
SELECT 'Testing user_balances table...' as test;
SELECT COUNT(*) as balance_count FROM public.user_balances;

SELECT 'Testing support_tickets table...' as test;
SELECT COUNT(*) as ticket_count FROM public.support_tickets;

SELECT 'Testing ticket_messages table...' as test;
SELECT COUNT(*) as message_count FROM public.ticket_messages;

SELECT 'Testing gift_card_submissions table...' as test;
SELECT COUNT(*) as gift_card_count FROM public.gift_card_submissions;

SELECT '✅ Database setup complete!' as status;
SELECT 'You can now approve top-ups and use chat functionality!' as next_step;