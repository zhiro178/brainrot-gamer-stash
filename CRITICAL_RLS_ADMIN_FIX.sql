-- 🚨 CRITICAL FIX: Admin RLS Policies for Ticket System
-- Execute this SQL in your Supabase SQL Editor

-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can manage all ticket messages" ON public.ticket_messages;

-- Create better admin policies that actually work
CREATE POLICY "Admins can view all tickets v2" ON public.support_tickets
    FOR ALL USING (
        (SELECT auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

CREATE POLICY "Admins can manage all ticket messages v2" ON public.ticket_messages
    FOR ALL USING (
        (SELECT auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- Also create backup policies using different approach
CREATE POLICY "Admin access all tickets by raw metadata" ON public.support_tickets
    FOR ALL USING (
        (SELECT auth.jwt() -> 'user_metadata' ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
        OR 
        (SELECT auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

CREATE POLICY "Admin access all messages by raw metadata" ON public.ticket_messages
    FOR ALL USING (
        (SELECT auth.jwt() -> 'user_metadata' ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
        OR 
        (SELECT auth.jwt() ->> 'email') IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')
    );

-- Create a function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT auth.jwt() ->> 'email' IN ('zhirocomputer@gmail.com', 'ajay123phone@gmail.com')),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin policies using the function
CREATE POLICY "Function-based admin access tickets" ON public.support_tickets
    FOR ALL USING (is_admin());

CREATE POLICY "Function-based admin access messages" ON public.ticket_messages
    FOR ALL USING (is_admin());

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Verify policies are created
SELECT 
    schemaname, 
    tablename, 
    policyname,
    permissive,
    cmd as command
FROM pg_policies 
WHERE tablename IN ('support_tickets', 'ticket_messages')
ORDER BY tablename, policyname;

-- Test admin access (run this when logged in as admin)
SELECT 'Admin test query - if this returns data, admin access works!' as test,
       count(*) as ticket_count
FROM support_tickets;

-- Success message
SELECT '🎯 Admin RLS policies updated! Admins should now see all tickets.' as status;