import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { simpleSupabase as workingSupabase } from "@/lib/simple-supabase";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SimpleTicketChat } from "@/components/SimpleTicketChat";
import { ArrowLeft, MessageCircle, Clock, CheckCircle, AlertCircle, Bitcoin, CreditCard, DollarSign, ShoppingBag } from "lucide-react";
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
  
  // Also check if user is admin by email as backup
  const isAdminByEmail = user?.email === 'zhirocomputer@gmail.com' || user?.email === 'ajay123phone@gmail.com';

  useEffect(() => {
    console.log('Tickets component mounted, checking authentication...');
    
    // Add auth state change listener
    const { data: { subscription } } = workingSupabase.auth.onAuthStateChange((event: any, session: any) => {
      console.log('Auth state changed:', { event, session });
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('User signed in or token refreshed, fetching tickets...');
        fetchUserAndTickets();
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setUser(null);
        setTickets([]);
      }
    });
    
    // Add ticket update listener for purchases and other actions
    const handleTicketsUpdate = (event: CustomEvent) => {
      console.log('Tickets update event received:', event.detail);
      fetchUserAndTickets();
    };
    
    window.addEventListener('tickets-updated', handleTicketsUpdate as EventListener);
    
    // Initial fetch
    fetchUserAndTickets();
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('tickets-updated', handleTicketsUpdate as EventListener);
    };
  }, []);

  const fetchUserAndTickets = async (retryCount = 0) => {
    try {
      console.log(`Fetching user and tickets... (attempt ${retryCount + 1})`);
      
      // Try multiple ways to get the user
      const { data: { user: currentUser }, error: userError } = await workingSupabase.auth.getUser();
      console.log('Working client getUser result:', { currentUser, userError });
      
      // Also try getSession as backup
      const { data: { session }, error: sessionError } = await workingSupabase.auth.getSession();
      console.log('Working client getSession result:', { session, sessionError });
      
      // Use user from session if getUser fails
      const user = currentUser || session?.user;
      console.log('Final user object:', user);
      
      setUser(user);
      
      if (user) {
        console.log('User found, fetching tickets for user:', user.id);
        
        // Fetch tickets using working client - admins see all tickets, users see only their own
        console.log('Using working Supabase client...');
        
        let query = workingSupabase
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });
        
        // Apply user filtering only for non-admins
        if (!(isAdmin || isAdminByEmail)) {
          console.log('Filtering tickets for non-admin user:', user.id);
          query = query.eq('user_id', user.id);
        } else {
          console.log('Admin user detected, showing all tickets');
        }
        
        console.log('Executing tickets query with working client...');
        
        try {
          const result = await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Query timeout after 10 seconds'));
            }, 10000);
            
            query.then((result) => {
              clearTimeout(timeout);
              resolve(result);
            }).catch((error) => {
              clearTimeout(timeout);
              reject(error);
            });
          });
          
          const { data, error } = result as any;
          console.log('Working client query result:', { data, error });
        
          if (error) {
            console.error('Error fetching tickets:', error);
            console.error('Query details:', { 
              user_id: user.id, 
              isAdmin: isAdmin || isAdminByEmail,
              url: 'https://uahxenisnppufpswupnz.supabase.co/rest/v1/support_tickets'
            });
            toast({
              title: "Error",
              description: `Failed to fetch tickets: ${error.message}`,
              variant: "destructive",
            });
            setTickets([]);
          } else {
            console.log('Successfully fetched tickets:', { count: data?.length || 0, tickets: data });
            setTickets(data || []);
          }
        } catch (queryError) {
          console.error('Query execution failed:', queryError);
          
          // Retry mechanism for query failures
          if (retryCount < 2) {
            console.log(`Retrying ticket fetch in ${(retryCount + 1) * 1000}ms...`);
            setTimeout(() => {
              fetchUserAndTickets(retryCount + 1);
            }, (retryCount + 1) * 1000);
            return;
          }
          
          toast({
            title: "Error",
            description: `Failed to fetch tickets after ${retryCount + 1} attempts: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`,
            variant: "destructive",
          });
          setTickets([]);
        }
      } else {
        console.log('No user found');
        setTickets([]);
      }
    } catch (error) {
      console.error('Error in fetchUserAndTickets:', error);
      
      // Retry mechanism for general failures
      if (retryCount < 2) {
        console.log(`Retrying user and tickets fetch in ${(retryCount + 1) * 1000}ms...`);
        setTimeout(() => {
          fetchUserAndTickets(retryCount + 1);
        }, (retryCount + 1) * 1000);
        return;
      }
      
      setTickets([]);
    } finally {
      if (retryCount === 0 || retryCount >= 2) {
        setLoading(false);
      }
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
    if (category === 'purchase') {
      const amount = subject.match(/\$(\d+(?:\.\d{2})?)/)?.[1] || 
                    subject.match(/Price: \$(\d+(?:\.\d{2})?)/)?.[1] || '0.00';
      return {
        icon: ShoppingBag,
        title: 'Purchase Order',
        amount: amount,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10'
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
            <h1 className="text-2xl font-bold text-destructive mb-4">Authentication Issue</h1>
            <p className="text-muted-foreground mb-4">
              Unable to verify your login status. Check browser console for details.
            </p>
            <div className="space-y-2 mb-4">
              <Button onClick={() => {
                console.log('Attempting to refresh authentication...');
                window.location.reload();
              }} variant="outline">
                🔄 Refresh Page
              </Button>
              <Button onClick={() => setLocation("/")} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Debug: Check browser console (F12) for authentication details
            </p>
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
              {isAdmin || isAdminByEmail ? 'All Support Tickets' : 'My Tickets'}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin || isAdminByEmail ? 'Manage all customer support requests' : 'View and manage your support requests'}
            </p>
            
            {/* Debug info */}
            <div className="mt-4 p-2 bg-muted rounded text-xs">
              <p>Debug Info:</p>
              <p>User ID: {user?.id}</p>
              <p>Email: {user?.email}</p>
              <p>IsAdmin (hook): {String(isAdmin)}</p>
              <p>IsAdmin (email): {String(isAdminByEmail)}</p>
              <p>Tickets count: {tickets.length}</p>
              
              <Button 
                onClick={async () => {
                  console.log('=== SUPABASE DIAGNOSTIC TEST ===');
                  
                  // Test 1: Authentication (Working Client)
                  const { data: { user: authUser }, error: authError } = await workingSupabase.auth.getUser();
                  console.log('1. Working Auth User:', { authUser, authError });
                  
                  // Test 2: Basic query (Working Client)
                  const { data: testData, error: testError } = await workingSupabase
                    .from('support_tickets')
                    .select('*')
                    .limit(1);
                  console.log('2. Working Basic Query:', { testData, testError });
                  
                                      // Test 3: Insert test (if logged in) - Working Client
                    if (authUser) {
                      const { data: insertData, error: insertError } = await workingSupabase
                        .from('support_tickets')
                        .insert({
                          user_id: authUser.id,
                          subject: 'TEST DIAGNOSTIC',
                          message: 'This is a test',
                          status: 'open',
                          category: 'general'
                        });
                      console.log('3. Working Insert Test:', { insertData, insertError });
                      
                      // Clean up (skip for now since delete not implemented in working client)
                      console.log('4. Cleanup skipped (delete not implemented in working client)');
                    }
                  
                                      // Test 4: RLS Status (Direct API)
                    try {
                      const response = await fetch(`https://uahxenisnppufpswupnz.supabase.co/rest/v1/support_tickets?select=id&limit=1`, {
                        headers: {
                          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q',
                          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q'
                        }
                      });
                      console.log('4. Direct API Test:', { status: response.status, ok: response.ok });
                    } catch (e) {
                      console.log('4. Direct API Test Failed:', e);
                    }
                  
                  console.log('=== END DIAGNOSTIC ===');
                  alert('Diagnostic complete! Check console (F12) for detailed results.');
                }}
                size="sm"
                variant="outline"
                className="mt-2"
              >
                🔍 Run Diagnostic
              </Button>
            </div>
          </div>

                                {tickets.length === 0 ? (
            <Card className="bg-gradient-card border-primary/20">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                <p className="text-muted-foreground">
                  {(isAdmin || isAdminByEmail) ? 'No support tickets have been created yet.' : 'You haven\'t created any support tickets yet.'}
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
                           ticket.category === 'purchase' ? 'Purchase' :
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
                                ticket.category === 'purchase' ?
                                'Track your purchase order and communicate with our delivery team. You\'ll receive updates on your item delivery here.' :
                                `Communicate with ${isAdmin || isAdminByEmail ? 'the user' : 'our support team'} about your ticket`
                              }
                            </DialogDescription>
                          </DialogHeader>
                          {selectedTicket && user && (
                            <SimpleTicketChat 
                              ticketId={selectedTicket.id}
                              ticketSubject={selectedTicket.subject}
                              currentUser={user}
                              isAdmin={isAdmin || isAdminByEmail}
                              ticketStatus={selectedTicket.status}
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