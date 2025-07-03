import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TicketChat } from "@/components/TicketChat";
import { CryptoTopupList } from "@/components/CryptoTopupList";
import { Settings, Ticket, DollarSign, ArrowLeft, MessageCircle, Bitcoin, Users, Activity, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const supabaseUrl = "https://uahxenisnppufpswupnz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Admin() {
  const navigate = useNavigate();
  const [giftCardSubmissions, setGiftCardSubmissions] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [cryptoPaymentInfo, setCryptoPaymentInfo] = useState({
    ltcAddress: "",
    solAddress: "",
    exchangeRate: 1.0
  });
  const [currentUser, setCurrentUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    fetchGiftCardSubmissions();
    fetchSupportTickets();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchGiftCardSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_card_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setGiftCardSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching gift cards:', error);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSupportTickets(data || []);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    }
  };

  const approveGiftCard = async (id: string, amount: number, userId: string) => {
    try {
      await supabase
        .from('gift_card_submissions')
        .update({ status: 'approved' })
        .eq('id', id);

      const { data: existingBalance } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const currentBalance = existingBalance?.balance || 0;
      
      await supabase
        .from('user_balances')
        .upsert({
          user_id: userId,
          balance: currentBalance + amount
        });

      toast({
        title: "Gift Card Approved",
        description: `Added $${amount} to user balance`,
      });

      fetchGiftCardSubmissions();
    } catch (error) {
      console.error('Error approving gift card:', error);
      toast({
        title: "Error",
        description: "Failed to approve gift card",
        variant: "destructive",
      });
    }
  };

  const rejectGiftCard = async (id: string) => {
    try {
      await supabase
        .from('gift_card_submissions')
        .update({ status: 'rejected' })
        .eq('id', id);

      toast({
        title: "Gift Card Rejected",
        description: "Gift card submission has been rejected",
      });

      fetchGiftCardSubmissions();
    } catch (error) {
      console.error('Error rejecting gift card:', error);
    }
  };

  const updateCryptoSettings = async () => {
    try {
      // In a real app, you'd save these to a settings table
      toast({
        title: "Crypto Settings Updated",
        description: "Crypto payment addresses and rates have been saved",
      });
    } catch (error) {
      console.error('Error updating crypto settings:', error);
      toast({
        title: "Error",
        description: "Failed to update crypto settings",
        variant: "destructive",
      });
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'purchase':
        return <Ticket className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/')}
            className="border-primary/20 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              592 Stock Admin Panel
            </h1>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Support Tickets</p>
                  <p className="text-3xl font-bold text-primary">{supportTickets.length}</p>
                </div>
                <Ticket className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gift Cards</p>
                  <p className="text-3xl font-bold text-gaming-success">{giftCardSubmissions.length}</p>
                </div>
                <DollarSign className="h-8 w-8 text-gaming-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Chats</p>
                  <p className="text-3xl font-bold text-gaming-warning">
                    {supportTickets.filter(t => t.status === 'in_progress').length}
                  </p>
                </div>
                <MessageCircle className="h-8 w-8 text-gaming-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="gift-cards" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-background border border-primary/20">
            <TabsTrigger value="gift-cards" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Gift Cards
            </TabsTrigger>
            <TabsTrigger value="crypto-settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Crypto Top-ups
            </TabsTrigger>
            <TabsTrigger value="support-tickets" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Support Tickets
            </TabsTrigger>
          </TabsList>

          {/* Support Tickets Tab */}
          <TabsContent value="support-tickets" className="space-y-6">
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MessageCircle className="h-6 w-6" />
                  Support Tickets & Live Chat
                </CardTitle>
                <CardDescription>
                  Manage all customer support requests with integrated chat system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {supportTickets.map((ticket: any) => (
                    <Card key={ticket.id} className="bg-background border-primary/20 hover:shadow-gaming transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getCategoryIcon(ticket.category)}
                            <div>
                              <h3 className="font-semibold text-primary">{ticket.subject}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(ticket.created_at).toLocaleDateString()} • 
                                User: {ticket.user_id?.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(ticket.status)} text-white`}>
                              {ticket.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {ticket.category}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-4 text-muted-foreground line-clamp-2">
                          {ticket.message}
                        </p>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm"
                              onClick={() => setSelectedTicket(ticket)}
                              className="bg-gradient-primary hover:shadow-glow"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Open Chat
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl bg-gradient-card border-primary/20">
                            <DialogHeader>
                              <DialogTitle>Support Chat - {ticket.subject}</DialogTitle>
                              <DialogDescription>
                                Live chat with customer about their ticket
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
                      </CardContent>
                    </Card>
                  ))}
                  
                  {supportTickets.length === 0 && (
                    <div className="text-center py-8">
                      <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Support Tickets</h3>
                      <p className="text-muted-foreground">All caught up! No pending support tickets.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gift Cards Tab */}
          <TabsContent value="gift-cards" className="space-y-4">
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Gift Card Submissions
                </CardTitle>
                <CardDescription>
                  Review and approve gift card top-up requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {giftCardSubmissions.map((submission: any) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-mono text-sm">
                          {submission.user_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-mono">
                          {submission.gift_card_code}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${submission.amount || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            submission.status === 'approved' ? 'default' :
                            submission.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(submission.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {submission.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => approveGiftCard(submission.id, submission.amount, submission.user_id)}
                                className="bg-gaming-success hover:bg-gaming-success/80"
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => rejectGiftCard(submission.id)}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crypto Top-ups Tab */}
          <TabsContent value="crypto-settings" className="space-y-6">
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Crypto Top-up Submissions
                </CardTitle>
                <CardDescription>
                  Manage cryptocurrency top-up requests from users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CryptoTopupList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}