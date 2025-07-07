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
    <Card className="w-full max-w-4xl mx-auto flex flex-col bg-gradient-card border-primary/20" style={{ height: '500px' }}>
      <CardHeader className="pb-3 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-gaming-accent/5">
        <CardTitle className="text-lg font-medium flex items-center gap-2 text-primary">
          <span>💬</span>
          <span className="truncate">{ticketSubject}</span>
          <Badge variant="outline" className="ml-auto shrink-0 border-primary/30 text-primary">
            #{String(ticketId).slice(-6)}
          </Badge>
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          {isAdmin ? '👨‍💼 Admin View' : '👤 Customer View'} • {messages.length} messages
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-background/50">
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-lg font-medium mb-2 text-primary">Start the conversation!</p>
                <p className="text-sm">Your messages will appear here</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.user_id === currentUser.id;
                const isAdminMessage = message.is_admin;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-lg ${
                        isAdminMessage
                          ? 'bg-gradient-to-br from-gaming-accent to-gaming-accent/80 text-black rounded-tl-md border border-gaming-accent/30'
                          : isCurrentUser
                            ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-md border border-primary/30'
                            : 'bg-gradient-to-br from-background to-muted text-foreground rounded-bl-md border border-primary/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {isAdminMessage ? (
                          <UserCog className="h-4 w-4 text-gaming-accent-foreground" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span className={`text-xs font-medium ${
                          isAdminMessage 
                            ? 'text-gaming-accent-foreground' 
                            : isCurrentUser 
                              ? 'text-white/90' 
                              : 'text-muted-foreground'
                        }`}>
                          {isAdminMessage ? '🛡️ Support Team' : 
                           isCurrentUser ? '👤 You' : '👤 Customer'}
                        </span>
                        <span className={`text-xs ml-auto ${
                          isAdminMessage 
                            ? 'text-gaming-accent-foreground/70' 
                            : isCurrentUser 
                              ? 'text-white/70' 
                              : 'text-muted-foreground/70'
                        }`}>
                          {new Date(message.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        isAdminMessage 
                          ? 'text-gaming-accent-foreground' 
                          : isCurrentUser 
                            ? 'text-white' 
                            : 'text-foreground'
                      }`}>
                        {message.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-primary/20 bg-gradient-to-r from-background/95 to-muted/50 p-4">
          <div className="flex gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isAdmin ? "Reply to customer..." : "Type your message..."}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={sending || !currentUser}
              className="flex-1 bg-background border-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-2 text-sm"
              style={{ 
                color: 'var(--foreground)',
                backgroundColor: 'var(--background)'
              }}
            />
            <Button 
              onClick={sendMessage} 
              disabled={sending || !newMessage.trim() || !currentUser}
              className="bg-gradient-primary hover:shadow-glow text-primary-foreground rounded-xl px-6 transition-all duration-200"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-2">
            {isAdmin ? (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gaming-accent rounded-full"></span>
                  💼 Replying as Support Team
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                  🔄 Messages sync automatically
                </span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};