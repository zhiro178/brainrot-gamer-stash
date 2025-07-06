-- ⚡ CRITICAL FIX: Enable RLS and Create Security Policies
-- Execute this SQL in your Supabase SQL Editor to fix the ticket system

-- 1. Enable RLS on support_tickets table
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on ticket_messages table  
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid()::text = user_id);

-- 4. Policy: Users can create their own tickets
CREATE POLICY "Users can create own tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 5. Policy: Users can update their own tickets
CREATE POLICY "Users can update own tickets" ON public.support_tickets
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 6. Policy: Admins can view all tickets
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
        )
    );

-- 7. Policy: Users can view messages for their tickets
CREATE POLICY "Users can view messages for own tickets" ON public.ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE support_tickets.id = ticket_messages.ticket_id 
            AND support_tickets.user_id = auth.uid()::text
        )
    );

-- 8. Policy: Users can create messages for their tickets
CREATE POLICY "Users can create messages for own tickets" ON public.ticket_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE support_tickets.id = ticket_messages.ticket_id 
            AND support_tickets.user_id = auth.uid()::text
        )
    );

-- 9. Policy: Admins can manage all ticket messages
CREATE POLICY "Admins can manage all ticket messages" ON public.ticket_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
        )
    );

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- 11. Verify RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('support_tickets', 'ticket_messages');

-- 12. List all policies created
SELECT 
    schemaname, 
    tablename, 
    policyname as "Policy Name"
FROM pg_policies 
WHERE tablename IN ('support_tickets', 'ticket_messages');

-- Success message
SELECT 'RLS and security policies have been successfully configured! 🎯' as status;