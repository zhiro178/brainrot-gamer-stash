import { useEffect, useState } from 'react';
import { Chat, Channel, ChannelHeader, MessageList, MessageInput, Window } from 'stream-chat-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageCircle } from 'lucide-react';
import { connectUser, getTicketChannel, disconnectUser } from '@/lib/streamChat';
import { useAdmin } from '@/contexts/AdminContext';

// Import Stream Chat CSS
import 'stream-chat-react/dist/css/v2/index.css';

interface StreamTicketChatProps {
  ticketId: string;
  ticketSubject: string;
  currentUser: any;
}

export const StreamTicketChat = ({ ticketId, ticketSubject, currentUser }: StreamTicketChatProps) => {
  const [client, setClient] = useState<any>(null);
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    const initializeChat = async () => {
      try {
        setLoading(true);
        setError(null);

        // Connect user to Stream Chat
        const chatClient = await connectUser(
          {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.email.split('@')[0]
          },
          isAdmin
        );

        setClient(chatClient);

        // Create/get ticket channel with current user and admin
        const members = [currentUser.id];
        
        // Add admin to the channel if current user is not admin
        if (!isAdmin) {
          members.push('admin-system'); // You can replace with actual admin user ID
        }

        const ticketChannel = await getTicketChannel(ticketId, members);
        setChannel(ticketChannel);

      } catch (err) {
        console.error('Failed to initialize chat:', err);
        setError('Failed to load chat. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      initializeChat();
    }

    // Cleanup on unmount
    return () => {
      disconnectUser();
    };
  }, [currentUser, ticketId, isAdmin]);

  if (loading) {
    return (
      <Card className="bg-gradient-card border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-card border-primary/20">
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-destructive mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/80"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!client || !channel) {
    return (
      <Card className="bg-gradient-card border-primary/20">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Chat not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card border-primary/20">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-primary flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span>{ticketSubject}</span>
          </CardTitle>
          <div className="bg-primary/10 px-2 py-1 rounded text-sm">
            Ticket #{ticketId.slice(-8)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-96 border border-primary/20 rounded-lg overflow-hidden">
          <Chat client={client} theme="messaging light">
            <Channel channel={channel}>
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageInput />
              </Window>
            </Channel>
          </Chat>
        </div>
      </CardContent>
    </Card>
  );
};