import { useState, useEffect } from "react";
import { simpleSupabase as workingSupabase } from "@/lib/simple-supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ModernTicketChat } from "@/components/ModernTicketChat";
import { Bitcoin, Calendar, User, MessageCircle, DollarSign, CheckCircle, Trash2, AlertCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  // Function to refresh user balance after approval
  const refreshUserBalance = async (userId: string) => {
    try {
      // Trigger a balance refresh event that other components can listen to
      window.dispatchEvent(new CustomEvent('balance-updated', { 
        detail: { userId } 
      }));
      
      console.log('Balance refresh event dispatched for user:', userId);
    } catch (error) {
      console.error('Error dispatching balance refresh:', error);
    }
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await workingSupabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchCryptoTickets = async () => {
    try {
      console.log('Fetching crypto/topup tickets with working client...');
      
      const { data, error } = await workingSupabase
        .from('support_tickets')
        .select('*')
        .eq('category', 'crypto_topup')
        .order('created_at', { ascending: false });

      console.log('Crypto tickets query result:', { data, error });

      if (error) throw error;
      setTickets(data || []);

      // Also fetch gift card topups
      const { data: giftCardData, error: giftCardError } = await workingSupabase
        .from('support_tickets')
        .select('*')
        .eq('category', 'giftcard_topup')
        .order('created_at', { ascending: false });

      console.log('Gift card tickets query result:', { giftCardData, giftCardError });

      if (!giftCardError && giftCardData) {
        setTickets((prev: TopUpTicket[]) => [...prev, ...giftCardData].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      }
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
      
      console.log("Starting approval for:", { ticketId, amount, userId, amountNum });
      
      // Update ticket status to resolved
      const { error: ticketError } = await workingSupabase
        .from('support_tickets')
        .update({ status: 'resolved' })
        .eq('id', ticketId);
        
      if (ticketError) {
        console.error('Error updating ticket:', ticketError);
        throw new Error(`Failed to update ticket: ${ticketError.message}`);
      }
      
      console.log("Ticket updated to resolved");

      // Get or create user balance
      console.log("Fetching existing balance for user:", userId);
      let { data: existingBalance, error: balanceError } = await workingSupabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', userId);

      console.log("Existing balance query result:", { existingBalance, balanceError });

      if (balanceError) {
        console.error('Error fetching balance:', balanceError);
        throw new Error(`Failed to fetch user balance: ${balanceError.message}`);
      }

      const currentBalance = parseFloat(existingBalance?.[0]?.balance || '0');
      const newBalance = currentBalance + amountNum;
      
      console.log("Balance calculation:", { currentBalance, amountNum, newBalance });
      
      let balanceResult, balanceUpdateError;
      
      // If balance record exists, update it
      if (existingBalance && existingBalance.length > 0) {
        console.log("Updating existing balance record");
        const updateResult = await workingSupabase
          .from('user_balances')
          .update({
            balance: newBalance.toFixed(2)
          })
          .eq('user_id', userId);
        
        balanceResult = updateResult.data;
        balanceUpdateError = updateResult.error;
        console.log("Balance update result:", { balanceResult, balanceUpdateError });
      } else {
        // If no balance record exists, create one
        console.log("Creating new balance record");
        const insertResult = await workingSupabase
          .from('user_balances')
          .insert({
            user_id: userId,
            balance: newBalance.toFixed(2)
          });
        
        balanceResult = insertResult.data;
        balanceUpdateError = insertResult.error;
        console.log("Balance insert result:", { balanceResult, balanceUpdateError });
      }
      
      if (balanceUpdateError) {
        console.error('Error updating balance:', balanceUpdateError);
        throw new Error(`Failed to update balance: ${balanceUpdateError.message}`);
      }

      // Add admin confirmation message
      console.log("Adding admin confirmation message");
      const { data: messageResult, error: messageError } = await workingSupabase
        .from('ticket_messages')
        .insert({
          ticket_id: parseInt(ticketId),
          user_id: currentUser.id,
          message: `✅ Payment approved! $${amountNum.toFixed(2)} added to your account. New balance: $${newBalance.toFixed(2)}`,
          is_admin: true
        });
        
      console.log("Admin message result:", { messageResult, messageError });
      
      if (messageError) {
        console.error('Error creating admin message:', messageError);
        // Don't throw error here, balance update is more important
      }

      toast({
        title: "Top-up Approved",
        description: `Successfully added $${amountNum.toFixed(2)} to user balance. New balance: $${newBalance.toFixed(2)}`,
      });

      // Refresh tickets to show updated status
      console.log("Refreshing tickets list");
      fetchCryptoTickets();
      
      // Force balance refresh for the affected user with multiple methods
      console.log("Triggering balance refresh events");
      refreshUserBalance(userId);
      
      // Also dispatch a more general balance update event
      window.dispatchEvent(new CustomEvent('user-balance-updated', { 
        detail: { 
          userId, 
          newBalance: newBalance.toFixed(2),
          addedAmount: amountNum.toFixed(2)
        } 
      }));
      
      // Additional event for navbar refresh
      window.dispatchEvent(new CustomEvent('refresh-navbar-balance', { 
        detail: { userId } 
      }));
      
      console.log("All balance refresh events dispatched");
      
    } catch (error) {
      console.error('Error verifying ticket:', error);
      toast({
        title: "Error",
        description: `Failed to approve top-up request: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      // Delete associated messages first (Note: working client doesn't have delete yet)
      // We'll skip message deletion for now
      console.log("Deleting ticket:", ticketId);

      // For now, just set status to closed instead of deleting
      await workingSupabase
        .from('support_tickets')
        .update({ status: 'closed' })
        .eq('id', ticketId);

      toast({
        title: "Top-up Request Closed",
        description: "The top-up request has been closed.",
      });

      // Refresh tickets
      fetchCryptoTickets();
    } catch (error) {
      console.error('Error closing ticket:', error);
      toast({
        title: "Error",
        description: "Failed to close top-up request",
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
                      <ModernTicketChat 
                        ticketId={selectedTicket.id}
                        ticketSubject={selectedTicket.subject}
                        currentUser={currentUser}
                        isAdmin={true}
                        ticketStatus={selectedTicket.status}
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
                      Close
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