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
    <Card className="w-full max-w-4xl mx-auto flex flex-col" style={{ height: '500px' }}>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <span>💬</span>
          <span className="truncate">{ticketSubject}</span>
          <Badge variant="outline" className="ml-auto shrink-0">
            #{String(ticketId).slice(-6)}
          </Badge>
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          {isAdmin ? '👨‍💼 Admin View' : '👤 Customer View'} • {messages.length} messages
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 px-4 py-2">
          <div className="space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-lg font-medium mb-2">Start the conversation!</p>
                <p className="text-sm">Your messages will appear here</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.user_id === currentUser.id ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.user_id === currentUser.id
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md border'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {message.is_admin ? (
                        <UserCog className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      <span className="text-xs font-medium opacity-90">
                        {message.is_admin ? 'Support Team' : 
                         message.user_id === currentUser.id ? 'You' : 'Customer'}
                      </span>
                      <span className="text-xs opacity-70 ml-auto">
                        {new Date(message.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t bg-gray-50 p-4">
          <div className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isAdmin ? "Reply to customer..." : "Type your message..."}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={sending || !currentUser}
              className="flex-1 bg-white border-gray-200 focus:border-blue-500 rounded-xl"
            />
            <Button 
              onClick={sendMessage} 
              disabled={sending || !newMessage.trim() || !currentUser}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center mt-2">
            {isAdmin ? '💼 Replying as Support Team' : '🔄 Messages sync automatically'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};