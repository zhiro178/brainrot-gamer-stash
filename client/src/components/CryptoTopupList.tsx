import { useState, useEffect } from "react";
import { supabase as workingSupabase } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { SimpleTicketChat } from "@/components/SimpleTicketChat";
import { Calendar, User, MessageCircle, DollarSign, CheckCircle, Trash2, AlertCircle, CreditCard, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { approveAndAddFunds } from "@/lib/balanceUtils";

// Crypto Icon Components
const BitcoinIcon = ({ className }: { className?: string }) => (
  <img 
    src="https://s3.coinmarketcap.com/static/img/portraits/630c5fcaf8184351dc5c6ee5.png" 
    alt="Bitcoin" 
    className={className}
    onError={(e) => {
      // Fallback to DollarSign icon if image fails to load
      e.currentTarget.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.innerHTML = '<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2v20M9 5h8a3 3 0 0 1 0 6h-8m0 0h8a3 3 0 0 1 0 6H9"/></svg>';
      e.currentTarget.parentNode?.appendChild(fallback);
    }}
  />
);

const SolanaIcon = ({ className }: { className?: string }) => (
  <img 
    src="https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png" 
    alt="Solana" 
    className={className}
    onError={(e) => {
      // Fallback to DollarSign icon if image fails to load
      e.currentTarget.style.display = 'none';
      const fallback = document.createElement('div');
      fallback.innerHTML = '<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2v20M9 5h8a3 3 0 0 1 0 6h-8m0 0h8a3 3 0 0 1 0 6H9"/></svg>';
      e.currentTarget.parentNode?.appendChild(fallback);
    }}
  />
);

// Combined crypto icon component
const CryptoIcon = ({ className }: { className?: string }) => (
  <div className={`flex items-center gap-1 ${className}`}>
    <BitcoinIcon className="h-4 w-4" />
    <SolanaIcon className="h-4 w-4" />
  </div>
);

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
  const [purgingApprovedTickets, setPurgingApprovedTickets] = useState(false);
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
      
      // Filter out purged tickets
      const filteredCryptoTickets = (data || []).filter((ticket: TopUpTicket) => ticket.status !== 'purged');
      setTickets(filteredCryptoTickets);

      // Also fetch gift card topups
      const { data: giftCardData, error: giftCardError } = await workingSupabase
        .from('support_tickets')
        .select('*')
        .eq('category', 'giftcard_topup')
        .order('created_at', { ascending: false });

      console.log('Gift card tickets query result:', { giftCardData, giftCardError });

      if (!giftCardError && giftCardData) {
        // Filter out purged tickets from gift card data too
        const filteredGiftCardTickets = giftCardData.filter((ticket: TopUpTicket) => ticket.status !== 'purged');
        setTickets((prev: TopUpTicket[]) => [...prev, ...filteredGiftCardTickets].sort((a, b) => 
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
      return { type: 'Gift Card', icon: CreditCard, color: 'bg-[#22C55E]' };
    }
    if (message.toLowerCase().includes('ltc') || message.toLowerCase().includes('litecoin')) {
      return { type: 'LTC', icon: ({ className }: { className?: string }) => <BitcoinIcon className={className} />, color: 'bg-[#22C55E]' };
    }
    if (message.toLowerCase().includes('sol') || message.toLowerCase().includes('solana')) {
      return { type: 'SOL', icon: ({ className }: { className?: string }) => <SolanaIcon className={className} />, color: 'bg-[#22C55E]' };
    }
    return { type: 'Crypto', icon: ({ className }: { className?: string }) => <CryptoIcon className={className} />, color: 'bg-[#22C55E]' };
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
      console.log("Deleting ticket:", ticketId);

      // Delete associated messages first using regular supabase client (has delete)
      const { error: messagesError } = await supabase
        .from('ticket_messages')
        .delete()
        .eq('ticket_id', ticketId);

      if (messagesError) {
        console.error('Error deleting ticket messages:', messagesError);
        // Continue anyway, try to delete the ticket
      }

      // Delete the ticket using regular supabase client (has delete)
      const { error: deleteError } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', ticketId);

      if (deleteError) {
        console.error('Delete error details:', deleteError);
        throw new Error(`Failed to delete ticket: ${deleteError.message || deleteError.code || 'Unknown error'}`);
      }

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
        description: `Failed to delete top-up request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setProcessingTicket(null);
    }
  };

  const handleClearAllTickets = async () => {
    if (clearingAllTickets) return;
    
    if (!window.confirm('Are you sure you want to DELETE all top-up tickets? This action cannot be undone.')) {
      return;
    }
    
    setClearingAllTickets(true);
    try {
      console.log("Deleting all top-up tickets...");
      
      if (tickets.length === 0) {
        toast({
          title: "No Tickets to Clear",
          description: "No top-up tickets found to delete.",
        });
        return;
      }

      // Delete all top-up tickets (both crypto and giftcard)
      let successCount = 0;
      let errorCount = 0;

      for (const ticket of tickets) {
        try {
          // First delete related messages using regular supabase client (has delete)
          await supabase
            .from('ticket_messages')
            .delete()
            .eq('ticket_id', ticket.id);
          
          // Then delete the ticket itself using regular supabase client (has delete)
          const { error: deleteError } = await supabase
            .from('support_tickets')
            .delete()
            .eq('id', ticket.id);
          
          if (deleteError) {
            throw new Error(deleteError.message || 'Failed to delete ticket');
          }
          
          successCount++;
        } catch (error) {
          console.error(`Error deleting ticket ${ticket.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Tickets Deleted Successfully",
          description: `${successCount} tickets have been permanently deleted. ${errorCount > 0 ? `${errorCount} failed to delete.` : ''}`,
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Error Deleting Tickets",
          description: "Failed to delete any tickets. Please try again.",
          variant: "destructive",
        });
      }

      // Refresh tickets
      fetchCryptoTickets();
      
      // Trigger refresh event for other components
      window.dispatchEvent(new CustomEvent('tickets-updated'));
      
    } catch (error) {
      console.error('Error clearing all tickets:', error);
      toast({
        title: "Error",
        description: "Failed to delete tickets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setClearingAllTickets(false);
    }
  };

  const handlePurgeApprovedTickets = async () => {
    if (purgingApprovedTickets) return;
    
    setPurgingApprovedTickets(true);
    try {
      console.log("Purging approved top-up tickets...");
      
      // Refresh tickets first to ensure we have latest data
      await fetchCryptoTickets();
      
      // Get all resolved/closed crypto and gift card topup tickets
      const approvedTickets = tickets.filter((ticket: TopUpTicket) => 
        ticket.status === 'closed' || ticket.status === 'resolved'
      );
      
      if (approvedTickets.length === 0) {
        toast({
          title: "No Tickets to Purge",
          description: "No approved/closed tickets found to purge.",
        });
        return;
      }

      // Delete all approved tickets permanently
      let successCount = 0;
      let errorCount = 0;

      for (const ticket of approvedTickets) {
        try {
          // Mark ticket as purged and clear its content using working supabase client
          const { error } = await workingSupabase
            .from('support_tickets')
            .update({ 
              status: 'purged',
              message: '[PURGED] - Ticket history removed by admin',
              subject: '[PURGED] - Ticket history removed'
            })
            .eq('id', ticket.id);
          
          if (error) {
            throw new Error(error.message || 'Failed to purge ticket');
          }
          
          successCount++;
        } catch (error) {
          console.error(`Failed to purge ticket ${ticket.id}:`, error);
          errorCount++;
        }
      }

      // Refresh the tickets list
      await fetchCryptoTickets();

      if (successCount > 0) {
        toast({
          title: "Tickets Purged Successfully",
          description: `${successCount} approved tickets have been purged from history. ${errorCount > 0 ? `${errorCount} failed to purge.` : ''}`,
          variant: "default",
        });
      } else {
        toast({
          title: "No Tickets Purged",
          description: "Failed to purge any tickets. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error purging approved tickets:', error);
      toast({
        title: "Error",
        description: "Failed to purge tickets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurgingApprovedTickets(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading crypto top-up requests...</div>;
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-8">
        <CryptoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Top-up Requests</h3>
        <p className="text-muted-foreground">No cryptocurrency or gift card top-up requests have been submitted yet.</p>
      </div>
    );
  }

  // Count open and approved tickets for buttons
  const openTicketsCount = tickets.filter((ticket: TopUpTicket) => 
    ticket.status !== 'closed' && ticket.status !== 'resolved'
  ).length;
  
  const approvedTicketsCount = tickets.filter((ticket: TopUpTicket) => 
    ticket.status === 'closed' || ticket.status === 'resolved'
  ).length;

  return (
    <div className="space-y-4">
      {/* Clear All Tickets Button */}
      {tickets.length > 0 && (
        <div className="flex items-center justify-between bg-muted/50 border border-primary/20 rounded-lg p-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-primary">Top-up Requests Management</h3>
            <p className="text-sm text-muted-foreground">
              {tickets.length} total tickets • {openTicketsCount} open • {approvedTicketsCount} approved
            </p>
          </div>
          
          <div className="flex items-center gap-2">
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
                    Clear All Open ({openTicketsCount})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear All Open Top-up Tickets?</AlertDialogTitle>
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
                      Yes, Clear All Open Tickets
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {approvedTicketsCount > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    size="sm"
                    disabled={purgingApprovedTickets}
                    className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                  >
                    {purgingApprovedTickets ? (
                      <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Purge Approved ({approvedTicketsCount})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Purge Approved Ticket History?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove {approvedTicketsCount} approved/closed tickets from the system. 
                      <strong className="text-orange-500"> This will NOT affect user balances</strong> - only ticket history will be removed.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handlePurgeApprovedTickets}
                      className="bg-orange-500 text-white hover:bg-orange-600"
                    >
                      Yes, Purge History
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
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
                    <div className="flex items-center gap-1 text-gaming-success font-bold text-xl font-mono tabular-nums">
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