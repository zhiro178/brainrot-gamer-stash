# 🎫 Ticket System Fix - Complete Solution

## 🚨 **CRITICAL ISSUE IDENTIFIED**

Your ticket system is broken due to **Row Level Security (RLS) being disabled** on the `support_tickets` table. This is visible in your Supabase dashboard showing "RLS Disabled in Public".

---

## 🔧 **IMMEDIATE FIXES REQUIRED**

### **Step 1: Enable RLS and Create Security Policies**

**Execute this SQL in your Supabase SQL Editor:**

```sql
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
```

### **Step 2: Verify Tables Exist**

Check if these tables exist in your Supabase dashboard:
- ✅ `public.support_tickets`
- ✅ `public.ticket_messages` 
- ✅ `public.user_balances`

If any are missing, run the table creation SQL from `CREATE_DATABASE_TABLES.sql`.

---

## 🛠️ **CODE FIXES**

### **Fix 1: Replace Stream Chat with Simple Database Chat**

Stream Chat is using a demo key that may be unreliable. Let's replace it with a simple database-based chat:

```typescript
// Create: client/src/components/SimpleTicketChat.tsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, User, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

interface SimpleTicketChatProps {
  ticketId: string;
  ticketSubject: string;
  currentUser: any;
  isAdmin?: boolean;
}

export const SimpleTicketChat = ({ ticketId, ticketSubject, currentUser, isAdmin = false }: SimpleTicketChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const subscription = supabase
      .channel(`ticket_${ticketId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: parseInt(ticketId),
          user_id: currentUser.id,
          message: newMessage.trim(),
          is_admin: isAdmin
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>💬</span>
          {ticketSubject}
          <Badge variant="outline" className="ml-auto">
            #{ticketId.slice(-6)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-3 gap-3">
        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.user_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.user_id === currentUser.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.is_admin ? (
                      <UserCog className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    <span className="text-xs opacity-75">
                      {message.is_admin ? 'Support Team' : 'You'}
                    </span>
                    <span className="text-xs opacity-50">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{message.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={sending}
          />
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

### **Fix 2: Update Tickets Page to Use Simple Chat**

Update the import in `client/src/pages/Tickets.tsx`:

```typescript
// Replace this line:
import { StreamTicketChat } from "@/components/StreamTicketChat";

// With this:
import { SimpleTicketChat } from "@/components/SimpleTicketChat";

// And replace the StreamTicketChat component usage with:
<SimpleTicketChat 
  ticketId={selectedTicket.id}
  ticketSubject={selectedTicket.subject}
  currentUser={user}
  isAdmin={isAdmin}
/>
```

---

## 🧪 **TESTING STEPS**

### **Step 1: Verify Database Setup**
1. Run the RLS SQL in Supabase SQL Editor
2. Check that RLS is now **ENABLED** in Security Advisor
3. Verify no more security warnings

### **Step 2: Test Ticket Creation**
1. Login as a regular user
2. Try to create a top-up ticket through the app
3. Verify it appears in the tickets page

### **Step 3: Test Chat Functionality**
1. Open a ticket from the tickets page
2. Try sending messages in the chat
3. Verify messages appear and persist

### **Step 4: Test Admin Access**
1. Login as admin (zhirocomputer@gmail.com or ajay123phone@gmail.com)
2. Verify you can see all tickets
3. Test responding to user tickets

---

## 🔍 **DEBUGGING COMMANDS**

### **Check RLS Status:**
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('support_tickets', 'ticket_messages');
```

### **Check Policies:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('support_tickets', 'ticket_messages');
```

### **Test User Access:**
```sql
-- Run as authenticated user
SELECT * FROM support_tickets WHERE user_id = auth.uid()::text;
```

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] RLS enabled on support_tickets table
- [ ] RLS enabled on ticket_messages table  
- [ ] Security policies created for user access
- [ ] Security policies created for admin access
- [ ] SimpleTicketChat component created
- [ ] Tickets page updated to use SimpleTicketChat
- [ ] Test ticket creation works
- [ ] Test chat messaging works
- [ ] Test admin can see all tickets
- [ ] No more security warnings in Supabase

---

## 🆘 **TROUBLESHOOTING**

### **If tickets still don't load:**
1. Check browser console for specific errors
2. Verify user is properly authenticated
3. Check Supabase logs for RLS policy violations
4. Ensure user's auth.uid() matches ticket user_id

### **If chat doesn't work:**
1. Verify ticket_messages table exists
2. Check RLS policies are applied correctly
3. Look for real-time subscription errors in console
4. Test with simple message first

### **If admin can't see all tickets:**
1. Verify admin email is exactly: `zhirocomputer@gmail.com` or `ajay123phone@gmail.com`
2. Check the admin policy includes the correct email addresses
3. Ensure admin is properly logged in with verified email

---

## 🚀 **Next Steps**

1. **Execute the SQL above in Supabase first** - This is critical!
2. **Create the SimpleTicketChat component**
3. **Update the Tickets page imports** 
4. **Test the functionality**
5. **Remove Stream Chat dependencies** if not needed elsewhere

This should completely fix your ticket system! 🎯