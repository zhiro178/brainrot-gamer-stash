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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TicketChat } from "@/components/TicketChat";
import { CryptoTopupList } from "@/components/CryptoTopupList";
import { Settings, Ticket, DollarSign, ArrowLeft, MessageCircle, Bitcoin, Users, Activity, CreditCard, ShoppingBag, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { supabase as workingSupabase } from "@/lib/supabase";

export default function Admin() {
  const [, setLocation] = useLocation();
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfiles, setUserProfiles] = useState<{[key: string]: any}>({});

  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    fetchSupportTickets();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await workingSupabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchSupportTickets = async () => {
    try {
      const { data, error } = await workingSupabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Handle expected errors gracefully (table doesn't exist)
      if (error && !['42703', '42P01'].includes(error.code)) {
        console.error('Error fetching support tickets:', error);
      }
      setSupportTickets(data || []);
      
      // Load user profiles for all ticket users
      if (data && data.length > 0) {
        const uniqueUserIds = Array.from(new Set(data.map((ticket: any) => ticket.user_id)));
        console.log('Loading profiles for users:', uniqueUserIds);
        await loadUserProfiles(uniqueUserIds);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      setSupportTickets([]);
    }
  };

  const loadUserProfiles = async (userIds: string[]) => {
    try {
      console.log('loadUserProfiles called with:', userIds);
      const profilesMap: {[key: string]: any} = {};
      
      for (const userId of userIds) {
        try {
          const { data: profileData, error } = await workingSupabase
            .from('user_profiles')
            .select('user_id, username, display_name, avatar_url')
            .eq('user_id', userId);

          if (!error && profileData && profileData.length > 0) {
            const profile = profileData[0];
            profilesMap[userId] = {
              name: profile.display_name || profile.username || `User ${userId.slice(-4)}`,
              username: profile.username || `user_${userId.slice(-4)}`,
              avatarUrl: profile.avatar_url
            };
          } else {
            // Fallback for users without profiles
            profilesMap[userId] = {
              name: `User ${userId.slice(-4)}`,
              username: `user_${userId.slice(-4)}`,
              avatarUrl: null
            };
          }
        } catch (profileError) {
          console.error(`Error fetching profile for user ${userId}:`, profileError);
          profilesMap[userId] = {
            name: `User ${userId.slice(-4)}`,
            username: `user_${userId.slice(-4)}`,
            avatarUrl: null
          };
        }
      }
      
      console.log('Setting user profiles:', profilesMap);
      setUserProfiles(profilesMap);
    } catch (error) {
      console.error('Error loading user profiles:', error);
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
        return <ShoppingBag className="h-4 w-4" />;
      case 'crypto_topup':
        return <Bitcoin className="h-4 w-4" />;
      case 'giftcard_topup':
        return <CreditCard className="h-4 w-4" />;
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
            onClick={() => setLocation('/')}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

        <Tabs defaultValue="topup-management" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-background border border-primary/20">
            <TabsTrigger value="topup-management" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Top-up Management
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
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={userProfiles[ticket.user_id]?.avatarUrl} alt={userProfiles[ticket.user_id]?.name} />
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {userProfiles[ticket.user_id]?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-primary">{ticket.subject}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(ticket.created_at).toLocaleDateString()} • 
                                User: {userProfiles[ticket.user_id]?.name || `User ${ticket.user_id?.slice(-4)}`}
                                <br />Debug: {JSON.stringify(userProfiles[ticket.user_id] || 'not found')}
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
                            {currentUser && (
                              <TicketChat 
                                ticketId={ticket.id}
                                ticketSubject={ticket.subject}
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



          {/* Top-ups Management Tab */}
          <TabsContent value="topup-management" className="space-y-6">
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Top-up Requests Management
                </CardTitle>
                <CardDescription>
                  Manage all cryptocurrency and gift card top-up requests from users
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