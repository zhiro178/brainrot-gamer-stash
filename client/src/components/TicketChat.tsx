import { useState, useEffect, useRef } from "react";
import { simpleSupabase as workingSupabase } from "@/lib/simple-supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, User, Crown, Clock, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";

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
  ticketStatus?: string;
}

export const TicketChat = ({ ticketId, ticketSubject, currentUser, ticketStatus = 'open' }: TicketChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isAdmin } = useAdmin();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchMessages();
    
    // Set up a simple interval to refresh messages
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000); // Refresh every 3 seconds

    return () => {
      clearInterval(interval);
    };
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      console.log("Fetching messages for ticket ID:", ticketId, "Type:", typeof ticketId);
      
      const { data, error } = await workingSupabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', parseInt(ticketId))
        .order('created_at', { ascending: true });

      console.log("Messages fetch result:", data, error);

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }
      
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

  const sendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      console.log("Sending message:", {
        ticket_id: parseInt(ticketId),
        user_id: String(currentUser.id),
        message: newMessage.trim(),
        is_admin: isAdmin
      });

      const { data, error } = await workingSupabase
        .from('ticket_messages')
        .insert({
          ticket_id: parseInt(ticketId),
          user_id: String(currentUser.id),
          message: newMessage.trim(),
          is_admin: isAdmin
        });

      console.log("Message send result:", data, error);

      if (error) {
        throw error;
      }
      
      setNewMessage("");
      
      // Refresh messages immediately
      await fetchMessages();
      
      // Update ticket status to 'in_progress' if it's the first message
      if (messages.length === 0) {
        workingSupabase
          .from('support_tickets')
          .update({ status: 'in_progress' })
          .eq('id', parseInt(ticketId))
          .then(() => console.log('Ticket status updated'));
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-primary flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>{ticketSubject}</span>
          </CardTitle>
          <Badge variant="secondary" className="bg-primary/10">
            Ticket #{String(ticketId).slice(-8)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border border-primary/20 rounded-lg bg-background/50">
          <ScrollArea className="h-96 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Chat is ready! Send a message to start the conversation.</p>
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
                      className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                        message.user_id === currentUser.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border border-primary/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {message.is_admin ? (
                          <Crown className="h-4 w-4 text-gaming-warning" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span className="text-xs font-medium">
                          {message.is_admin ? 'Admin' : 'Customer'}
                        </span>
                        <span className="text-xs opacity-70">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{message.message}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        <form onSubmit={sendMessage} className="flex gap-3 p-3 bg-background/30 rounded-lg border border-primary/20">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Type your message as ${isAdmin ? 'admin' : 'customer'}...`}
            className="flex-1 bg-background border-primary/20 focus:border-primary"
          />
          <Button 
            type="submit" 
            size="sm" 
            className="bg-gradient-primary hover:shadow-glow px-4"
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};