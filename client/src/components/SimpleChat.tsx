import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const supabaseUrl = "https://uahxenisnppufpswupnz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";
const supabase = createClient(supabaseUrl, supabaseKey);

interface Message {
  id: string;
  message: string;
  user_id: string;
  is_admin: boolean;
  created_at: string;
}

interface SimpleChatProps {
  ticketId: string;
  currentUser: any;
  userEmail: string;
}

export const SimpleChat = ({ ticketId, currentUser, userEmail }: SimpleChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const isAdmin = currentUser?.email === 'zhirocomputer@gmail.com';

  useEffect(() => {
    fetchMessages();
    // Refresh messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [ticketId]);

  const fetchMessages = async () => {
    try {
      console.log("Fetching messages for ticket:", ticketId);
      
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      console.log("Messages fetch result:", { data, error, ticketId });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }
      
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      console.log("Sending message:", {
        ticket_id: ticketId,
        user_id: currentUser.id,
        message: newMessage.trim(),
        is_admin: isAdmin,
        currentUser: currentUser
      });

      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          user_id: String(currentUser.id),
          message: newMessage.trim(),
          is_admin: isAdmin
        })
        .select();

      console.log("Message insert result:", data, error);

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned from insert');
      }
      
      setNewMessage("");
      
      // Refresh messages immediately
      setTimeout(() => {
        fetchMessages();
      }, 500);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading chat...</div>;
  }

  return (
    <div className="h-96 flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b bg-muted/20">
        <User className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">
          Customer ID: {userEmail.slice(0, 8)}... | Ticket: {ticketId} | Messages: {messages.length}
        </span>
        <Badge variant="secondary" className="ml-auto">
          {isAdmin ? 'Admin' : 'Customer'}
        </Badge>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.is_admin ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg ${
                  message.is_admin
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {message.is_admin ? (
                    <Shield className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  <span className="text-xs opacity-70">
                    {message.is_admin ? 'Admin' : 'Customer'}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                <div className="text-xs opacity-50 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-3 border-t bg-muted/20">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};