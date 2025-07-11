import { useState, useEffect } from "react";
import { simpleSupabase as workingSupabase } from "@/lib/simple-supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SimpleTicketChat } from "@/components/SimpleTicketChat";
import { Bitcoin, Calendar, User, MessageCircle, DollarSign, CheckCircle, Trash2, AlertCircle, CreditCard, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { approveAndAddFunds } from "@/lib/balanceUtils";

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
  const [clearingAllTickets, setClearingAllTickets] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCryptoTickets();
    getCurrentUser();
  }, []);

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
      
      const result = await approveAndAddFunds({
        ticketId: ticketId,
        userId: userId,
        amount: amountNum,
        currentUser: currentUser,
        reason: 'Payment approved'
      });

      if (result.success) {
        toast({
          title: "Top-up Approved",
          description: result.message,
        });

        // Refresh tickets to show updated status
        console.log("Refreshing tickets list");
        fetchCryptoTickets();
      } else {
        throw new Error(result.error || 'Failed to approve top-up');
      }
      
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

  const handleClearAllTickets = async () => {
    if (clearingAllTickets) return;
    
    setClearingAllTickets(true);
    try {
      console.log("Clearing all top-up tickets...");
      
      // Get all open crypto and gift card topup tickets
      const openTickets = tickets.filter((ticket: TopUpTicket) => 
        ticket.status !== 'closed' && ticket.status !== 'resolved'
      );
      
      if (openTickets.length === 0) {
        toast({
          title: "No Tickets to Clear",
          description: "All tickets are already closed or resolved.",
        });
        return;
      }

      // Close all open tickets
      let successCount = 0;
      let errorCount = 0;

      for (const ticket of openTickets) {
        try {
          const result = await new Promise((resolve) => {
            workingSupabase
              .from('support_tickets')
              .update({ status: 'closed' })
              .eq('id', ticket.id)
              .then(resolve);
          });
          
          const error = (result as any).error;
          if (error) {
            throw new Error(error.message || 'Failed to close ticket');
          }
          
          successCount++;
        } catch (error) {
          console.error(`Error closing ticket ${ticket.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Tickets Cleared Successfully",
          description: `${successCount} tickets have been closed. ${errorCount > 0 ? `${errorCount} failed to close.` : ''}`,
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Error Clearing Tickets",
          description: "Failed to close any tickets. Please try again.",
          variant: "destructive",
        });
      }

      // Refresh tickets
      fetchCryptoTickets();
    } catch (error) {
      console.error('Error clearing all tickets:', error);
      toast({
        title: "Error",
        description: "Failed to clear tickets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setClearingAllTickets(false);
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

  // Count open tickets for the clear all button
  const openTicketsCount = tickets.filter((ticket: TopUpTicket) => 
    ticket.status !== 'closed' && ticket.status !== 'resolved'
  ).length;

  return (
    <div className="space-y-4">
      {/* Clear All Tickets Button */}
      {tickets.length > 0 && (
        <div className="flex items-center justify-between bg-muted/50 border border-primary/20 rounded-lg p-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-primary">Top-up Requests Management</h3>
            <p className="text-sm text-muted-foreground">
              {tickets.length} total tickets • {openTicketsCount} open tickets
            </p>
          </div>
          
          {openTicketsCount > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive"
                  size="sm"
                  disabled={clearingAllTickets}
                  className="bg-destructive hover:bg-destructive/80"
                >
                  {clearingAllTickets ? (
                    <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4 mr-2" />
                  )}
                  Clear All Tickets ({openTicketsCount})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Top-up Tickets?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will close all {openTicketsCount} open top-up tickets. This action cannot be undone.
                    Users will no longer be able to interact with these tickets.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearAllTickets}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Clear All Tickets
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      {/* Tickets List */}
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
                      <SimpleTicketChat 
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