-- 🚨 URGENT: Complete Admin Access Fix
-- Run this SQL in Supabase to fix ALL admin issues

-- 1. First, ensure RLS is enabled
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets v2" ON public.support_tickets;
DROP POLICY IF EXISTS "Admin access all tickets by raw metadata" ON public.support_tickets;
DROP POLICY IF EXISTS "Function-based admin access tickets" ON public.support_tickets;

DROP POLICY IF EXISTS "Users can view messages for own tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can create messages for own tickets" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admins can manage all ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admins can manage all ticket messages v2" ON public.ticket_messages;
DROP POLICY IF EXISTS "Admin access all messages by raw metadata" ON public.ticket_messages;
DROP POLICY IF EXISTS "Function-based admin access messages" ON public.ticket_messages;

-- 3. Create simple, working admin policies
CREATE POLICY "Admin full access to tickets" ON public.support_tickets
    FOR ALL USING (
        (auth.jwt() ->> 'email') = 'zhirocomputer@gmail.com' 
        OR (auth.jwt() ->> 'email') = 'ajay123phone@gmail.com'
    );

CREATE POLICY "Admin full access to messages" ON public.ticket_messages
    FOR ALL USING (
        (auth.jwt() ->> 'email') = 'zhirocomputer@gmail.com' 
        OR (auth.jwt() ->> 'email') = 'ajay123phone@gmail.com'
    );

CREATE POLICY "Admin full access to balances" ON public.user_balances
    FOR ALL USING (
        (auth.jwt() ->> 'email') = 'zhirocomputer@gmail.com' 
        OR (auth.jwt() ->> 'email') = 'ajay123phone@gmail.com'
    );

-- 4. Create user policies (for non-admins)
CREATE POLICY "Users view own tickets" ON public.support_tickets
    FOR SELECT USING (
        auth.uid()::text = user_id
        AND (auth.jwt() ->> 'email') NOT IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

CREATE POLICY "Users create own tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id
        AND (auth.jwt() ->> 'email') NOT IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

CREATE POLICY "Users view own messages" ON public.ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE support_tickets.id = ticket_messages.ticket_id 
            AND support_tickets.user_id = auth.uid()::text
        )
        AND (auth.jwt() ->> 'email') NOT IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

CREATE POLICY "Users create own messages" ON public.ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE support_tickets.id = ticket_messages.ticket_id 
            AND support_tickets.user_id = auth.uid()::text
        )
        AND (auth.jwt() ->> 'email') NOT IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- 5. Create universal access policies (allow both admin and users)
CREATE POLICY "Universal ticket access" ON public.support_tickets
    FOR ALL USING (
        -- Admin access
        (auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
        OR 
        -- User access to own tickets
        auth.uid()::text = user_id
    );

CREATE POLICY "Universal message access" ON public.ticket_messages
    FOR ALL USING (
        -- Admin access
        (auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
        OR 
        -- User access to own messages
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE support_tickets.id = ticket_messages.ticket_id 
            AND support_tickets.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Universal balance access" ON public.user_balances
    FOR ALL USING (
        -- Admin access
        (auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
        OR 
        -- User access to own balance
        auth.uid()::text = user_id
    );

-- 6. Test queries
SELECT 'Testing admin access...' as status;

-- Test if admin can see tickets
SELECT 'Admin ticket test' as test, count(*) as ticket_count
FROM support_tickets;

-- Test if admin can see messages  
SELECT 'Admin message test' as test, count(*) as message_count
FROM ticket_messages;

-- Test if admin can see balances
SELECT 'Admin balance test' as test, count(*) as balance_count
FROM user_balances;

SELECT '✅ All admin policies created successfully!' as final_status;