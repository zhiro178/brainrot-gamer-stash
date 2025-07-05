import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TicketChat } from "@/components/TicketChat";
import { Bitcoin, Calendar, User, MessageCircle, DollarSign, CheckCircle, Trash2, AlertCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const supabaseUrl = "https://uahxenisnppufpswupnz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";
const supabase = createClient(supabaseUrl, supabaseKey);

interface TopUpTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  user_id: string;
  category: string;
}

export const CryptoTopupList = () => {
  const [tickets, setTickets] = useState<TopUpTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TopUpTicket | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [processingTicket, setProcessingTicket] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCryptoTickets();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchCryptoTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .in('category', ['crypto_topup', 'giftcard_topup'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching topup tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load top-up tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const extractAmountFromSubject = (subject: string) => {
    const match = subject.match(/\$(\d+(?:\.\d{2})?)/);
    return match ? match[1] : "0.00";
  };

  const getRequestType = (category: string, message: string) => {
    if (category === 'giftcard_topup') {
      return { type: 'Gift Card', icon: CreditCard, color: 'bg-blue-500' };
    }
    if (message.toLowerCase().includes('ltc') || message.toLowerCase().includes('litecoin')) {
      return { type: 'LTC', icon: Bitcoin, color: 'bg-orange-500' };
    }
    if (message.toLowerCase().includes('sol') || message.toLowerCase().includes('solana')) {
      return { type: 'SOL', icon: Bitcoin, color: 'bg-purple-500' };
    }
    return { type: 'Crypto', icon: Bitcoin, color: 'bg-primary' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-destructive';
      case 'in_progress':
        return 'bg-gaming-warning';
      case 'resolved':
      case 'closed':
        return 'bg-gaming-success';
      default:
        return 'bg-muted';
    }
  };

  const handleVerifyTicket = async (ticketId: string, amount: string, userId: string) => {
    if (processingTicket) return;
    
    setProcessingTicket(ticketId);
    try {
      const amountNum = parseFloat(amount);
      
      // Update ticket status to resolved
      await supabase
        .from('support_tickets')
        .update({ status: 'resolved' })
        .eq('id', ticketId);

      // Get current user balance
      const { data: existingBalance } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const currentBalance = existingBalance?.balance || 0;
      
      // Add amount to user balance
      await supabase
        .from('user_balances')
        .upsert({
          user_id: userId,
          balance: currentBalance + amountNum
        });

      // Add admin confirmation message
      await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          user_id: currentUser.id,
          message: `✅ Payment verified and approved!\n\n💰 $${amountNum.toFixed(2)} has been added to your account.\n🏦 Your new balance: $${(currentBalance + amountNum).toFixed(2)}\n\nThank you for your top-up! You can now use these funds to purchase items.`,
          is_admin: true
        });

      toast({
        title: "Top-up Approved",
        description: `Added $${amountNum.toFixed(2)} to user balance. New balance: $${(currentBalance + amountNum).toFixed(2)}`,
      });

      // Refresh tickets
      fetchCryptoTickets();
    } catch (error) {
      console.error('Error verifying ticket:', error);
      toast({
        title: "Error",
        description: "Failed to approve top-up request",
        variant: "destructive",
      });
    } finally {
      setProcessingTicket(null);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (processingTicket) return;
    
    setProcessingTicket(ticketId);
    try {
      // Delete associated messages first
      await supabase
        .from('ticket_messages')
        .delete()
        .eq('ticket_id', ticketId);

      // Delete ticket
      await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketId);

      toast({
        title: "Top-up Request Deleted",
        description: "The top-up request has been permanently deleted.",
      });

      // Refresh tickets
      fetchCryptoTickets();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast({
        title: "Error",
        description: "Failed to delete top-up request",
        variant: "destructive",
      });
    } finally {
      setProcessingTicket(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading crypto top-up requests...</div>;
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-8">
        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Top-up Requests</h3>
        <p className="text-muted-foreground">No cryptocurrency or gift card top-up requests have been submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => {
        const amount = extractAmountFromSubject(ticket.subject);
        const requestType = getRequestType(ticket.category, ticket.message);
        const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';
        const IconComponent = requestType.icon;
        
        return (
          <Card key={ticket.id} className="bg-background border-primary/20 hover:shadow-gaming transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${requestType.color} flex items-center justify-center text-white`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-primary text-lg">{requestType.type} Top-up Request</CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        User ID: {ticket.user_id.slice(0, 8)}...
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-gaming-success font-bold text-xl">
                      <DollarSign className="h-5 w-5" />
                      {parseFloat(amount).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">USD</div>
                  </div>
                  <Badge className={`${getStatusColor(ticket.status)} text-white`}>
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {ticket.message}
              </p>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedTicket(ticket)}
                      className="border-primary/20 hover:bg-primary/10"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Open Chat
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl bg-gradient-card border-primary/20">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5" />
                        {requestType.type} Top-up Chat - ${parseFloat(amount).toFixed(2)}
                      </DialogTitle>
                      <DialogDescription>
                        Chat with the customer about their {requestType.type.toLowerCase()} top-up request
                      </DialogDescription>
                    </DialogHeader>
                    {selectedTicket && currentUser && (
                      <TicketChat 
                        ticketId={selectedTicket.id}
                        ticketSubject={selectedTicket.subject}
                        currentUser={currentUser}
                      />
                    )}
                  </DialogContent>
                </Dialog>

                {!isResolved && (
                  <>
                    <Button 
                      size="sm"
                      onClick={() => handleVerifyTicket(ticket.id, amount, ticket.user_id)}
                      disabled={processingTicket === ticket.id}
                      className="bg-gaming-success hover:bg-gaming-success/80 text-black"
                    >
                      {processingTicket === ticket.id ? (
                        <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve & Add ${parseFloat(amount).toFixed(2)}
                    </Button>
                    
                    <Button 
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTicket(ticket.id)}
                      disabled={processingTicket === ticket.id}
                    >
                      {processingTicket === ticket.id ? (
                        <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </Button>
                  </>
                )}
                
                {isResolved && (
                  <Badge className="bg-gaming-success text-black">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved & Funded
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};