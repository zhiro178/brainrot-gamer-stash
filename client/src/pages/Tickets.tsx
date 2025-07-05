import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StreamTicketChat } from "@/components/StreamTicketChat";
import { ArrowLeft, MessageCircle, Clock, CheckCircle, AlertCircle, Bitcoin, CreditCard, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  created_at: string;
  user_id: string;
}

export default function Tickets() {
  const [, setLocation] = useLocation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const { toast } = useToast();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    fetchUserAndTickets();
  }, []);

  const fetchUserAndTickets = async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch tickets - admins see all tickets, users see only their own
        let query = supabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!isAdmin) {
          query = query.eq('user_id', currentUser.id);
        }
        
        const { data, error } = await query;
        
        // Handle expected errors gracefully (table doesn't exist)
        if (error && !['42703', '42P01'].includes(error.code)) {
          console.error('Error fetching tickets:', error);
        }
        setTickets(data || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
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

  const getTicketTypeInfo = (category: string, subject: string) => {
    if (category === 'crypto_topup') {
      const amount = subject.match(/\$(\d+(?:\.\d{2})?)/)?.[1] || '0.00';
      return {
        icon: Bitcoin,
        title: 'Crypto Top-up Request',
        amount: amount,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10'
      };
    }
    if (category === 'giftcard_topup') {
      const amount = subject.match(/\$(\d+(?:\.\d{2})?)/)?.[1] || '0.00';
      return {
        icon: CreditCard,
        title: 'Gift Card Top-up',
        amount: amount,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10'
      };
    }
    return {
      icon: MessageCircle,
      title: 'Support Ticket',
      amount: null,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">Please log in to view your tickets.</p>
            <Button onClick={() => setLocation("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-hero">
        <div className="container mx-auto px-4 py-12">
          <Button 
            onClick={() => setLocation("/")} 
            variant="outline" 
            className="mb-6 border-primary/20 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              {isAdmin ? 'All Support Tickets' : 'My Tickets'}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'Manage all customer support requests' : 'View and manage your support requests'}
            </p>
          </div>

          {tickets.length === 0 ? (
            <Card className="bg-gradient-card border-primary/20">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                <p className="text-muted-foreground">
                  {isAdmin ? 'No support tickets have been created yet.' : 'You haven\'t created any support tickets yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {tickets.map((ticket) => {
                const typeInfo = getTicketTypeInfo(ticket.category, ticket.subject);
                const IconComponent = typeInfo.icon;
                
                return (
                <Card key={ticket.id} className={`bg-gradient-card border-primary/20 hover:shadow-gaming transition-all duration-300 ${typeInfo.bgColor}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className={`flex items-center gap-3 ${typeInfo.color}`}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5" />
                          {typeInfo.title}
                        </div>
                        {typeInfo.amount && (
                          <div className="flex items-center gap-1 text-gaming-success font-bold">
                            <DollarSign className="h-4 w-4" />
                            {parseFloat(typeInfo.amount).toFixed(2)}
                          </div>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(ticket.status)} text-white`}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {ticket.category === 'crypto_topup' ? 'Crypto' : 
                           ticket.category === 'giftcard_topup' ? 'Gift Card' : 
                           ticket.category || 'General'}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="text-muted-foreground">
                      Created: {new Date(ticket.created_at).toLocaleDateString()} at {new Date(ticket.created_at).toLocaleTimeString()}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm mb-4 line-clamp-2">{ticket.message}</p>
                    
                    <div className="flex gap-2">
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
                              {typeInfo.title} Chat
                              {typeInfo.amount && (
                                <span className="text-gaming-success font-bold">
                                  - ${parseFloat(typeInfo.amount).toFixed(2)}
                                </span>
                              )}
                            </DialogTitle>
                            <DialogDescription>
                              {ticket.category === 'crypto_topup' ? 
                                'Chat with our team about your crypto top-up request. You\'ll receive payment instructions and updates here.' :
                                ticket.category === 'giftcard_topup' ? 
                                'Chat with our team about your gift card top-up. We\'ll verify your card and update you on the process.' :
                                `Communicate with ${isAdmin ? 'the user' : 'our support team'} about your ticket`
                              }
                            </DialogDescription>
                          </DialogHeader>
                          {selectedTicket && user && (
                            <StreamTicketChat 
                              ticketId={selectedTicket.id}
                              ticketSubject={selectedTicket.subject}
                              currentUser={user}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}