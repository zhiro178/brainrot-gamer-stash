import React, { useState, useEffect, useRef } from 'react';
import { workingSupabase } from '@/lib/supabase-backup';
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
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  console.log('SimpleTicketChat mounted with:', { 
    ticketId, 
    ticketSubject, 
    currentUser: currentUser?.id, 
    isAdmin 
  });

  useEffect(() => {
    if (!ticketId || !currentUser) {
      console.error('Missing required props:', { ticketId, currentUser });
      setError('Missing ticket ID or user information');
      setLoading(false);
      return;
    }

    fetchMessages();
    
    // Set up polling for new messages since our working client doesn't support real-time subscriptions
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 3000); // Poll every 3 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [ticketId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for ticket:', ticketId, 'as user:', currentUser?.id);
      
      if (!ticketId) {
        throw new Error('No ticket ID provided');
      }

      const { data, error } = await workingSupabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', parseInt(ticketId))
        .order('created_at', { ascending: true });

      console.log('Messages fetch result:', { data, error, ticketId });

      if (error) {
        console.error('Working client error fetching messages:', error);
        throw error;
      }
      
      console.log('Fetched messages count:', data?.length || 0);
      setMessages(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to load messages');
      if (loading) {
        // Only show toast on initial load error, not polling errors
        toast({
          title: "Chat Error",
          description: `Failed to load chat messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !currentUser) return;

    setSending(true);
    try {
      console.log('Sending message with working client...', {
        ticketId: parseInt(ticketId),
        userId: currentUser.id,
        isAdmin,
        message: newMessage.trim()
      });
      
      const { error } = await workingSupabase
        .from('ticket_messages')
        .insert({
          ticket_id: parseInt(ticketId),
          user_id: currentUser.id,
          message: newMessage.trim(),
          is_admin: isAdmin
        });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      console.log('Message sent successfully');
      setNewMessage('');
      
      // Refresh messages immediately after sending
      setTimeout(() => {
        fetchMessages();
      }, 500);
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

  // Show error state
  if (error && !loading) {
    return (
      <Card className="h-96 flex flex-col">
        <CardContent className="p-8 text-center flex-1 flex flex-col justify-center">
          <div className="text-destructive mb-4">❌ Chat Error</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => {
            setError(null);
            setLoading(true);
            fetchMessages();
          }} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-96 flex flex-col">
        <CardContent className="p-8 text-center flex-1 flex flex-col justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
          <p className="text-xs text-muted-foreground mt-2">Ticket ID: {ticketId}</p>
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
        <div className="text-xs text-muted-foreground">
          Debug: User ID: {currentUser?.id} | Admin: {isAdmin ? 'Yes' : 'No'} | Messages: {messages.length}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-3 gap-3">
        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No messages yet. Start the conversation!</p>
                <p className="text-xs mt-2">Ticket #{ticketId}</p>
              </div>
            ) : (
              messages.map((message) => (
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
                        {message.is_admin ? 'Support Team' : 
                         message.user_id === currentUser.id ? 'You' : 'Customer'}
                      </span>
                      <span className="text-xs opacity-50">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isAdmin ? "Reply to customer..." : "Type your message..."}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            disabled={sending || !currentUser}
          />
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim() || !currentUser}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          {isAdmin ? 'Replying as Support Team' : 'Messages refresh automatically'}
        </div>
      </CardContent>
    </Card>
  );
};