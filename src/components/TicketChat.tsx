import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, User, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";

const supabaseUrl = "https://uahxenisnppufpswupnz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  user_email?: string;
}

interface TicketChatProps {
  ticketId: string;
  ticketSubject: string;
  currentUser: any;
}

export const TicketChat = ({ ticketId, ticketSubject, currentUser }: TicketChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const subscription = supabase
      .channel(`ticket_messages_${ticketId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`
        }, 
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [ticketId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          user_email:user_id(email)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          user_id: currentUser.id,
          message: newMessage.trim(),
          is_admin: isAdmin
        });

      if (error) throw error;
      
      setNewMessage("");
      
      // Update ticket status to 'in_progress' if it's the first message
      if (messages.length === 0) {
        await supabase
          .from('support_tickets')
          .update({ status: 'in_progress' })
          .eq('id', ticketId);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading chat...</div>;
  }

  return (
    <Card className="bg-gradient-card border-primary/20">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <span>Chat: {ticketSubject}</span>
          <Badge variant="secondary">Ticket #{ticketId.slice(-8)}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-96 w-full">
          <div className="space-y-3 p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.user_id === currentUser.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.user_id === currentUser.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background border border-primary/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.is_admin ? (
                        <Crown className="h-4 w-4 text-gaming-warning" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      <span className="text-xs font-medium">
                        {message.is_admin ? 'Admin' : 'User'}
                      </span>
                      <span className="text-xs opacity-70">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-background border-primary/20"
          />
          <Button type="submit" size="sm" className="bg-gradient-primary">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};