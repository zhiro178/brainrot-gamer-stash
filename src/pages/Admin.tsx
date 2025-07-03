import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Settings, Upload, Ticket, DollarSign, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const supabaseUrl = "https://uahxenisnppufpswupnz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Admin() {
  const navigate = useNavigate();
  const [giftCardSubmissions, setGiftCardSubmissions] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [gameSettings, setGameSettings] = useState({
    "adopt-me": { title: "Adopt Me", logo: "", basePrice: 10 },
    "garden": { title: "Grow a Garden", logo: "", basePrice: 15 },
    "mm2": { title: "MM2", logo: "", basePrice: 20 },
    "brainrot": { title: "Steal a Brainrot", logo: "", basePrice: 25 }
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchGiftCardSubmissions();
    fetchTickets();
  }, []);

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

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const approveGiftCard = async (id: string, amount: number, userId: string) => {
    try {
      // Update gift card status
      await supabase
        .from('gift_card_submissions')
        .update({ status: 'approved' })
        .eq('id', id);

      // Add balance to user
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

  const updateGameSettings = async (gameId: string, settings: any) => {
    try {
      await supabase
        .from('game_settings')
        .upsert({
          game_id: gameId,
          ...settings
        });

      toast({
        title: "Settings Updated",
        description: `${settings.title} settings have been saved`,
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/')}
            className="border-primary/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>
        </div>

        <Tabs defaultValue="gift-cards" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-background">
            <TabsTrigger value="gift-cards">Gift Cards</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="games">Game Settings</TabsTrigger>
          </TabsList>

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

          <TabsContent value="tickets" className="space-y-4">
            <Card className="bg-gradient-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Purchase Tickets
                </CardTitle>
                <CardDescription>
                  View all user purchase history and tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket: any) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono text-sm">
                          #{ticket.id?.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {ticket.user_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{ticket.item_name}</TableCell>
                        <TableCell className="font-semibold">
                          ${ticket.amount}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{ticket.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(gameSettings).map(([gameId, settings]) => (
                <Card key={gameId} className="bg-gradient-card border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      {settings.title}
                    </CardTitle>
                    <CardDescription>
                      Update game logo and pricing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor={`${gameId}-title`}>Game Title</Label>
                      <Input
                        id={`${gameId}-title`}
                        value={settings.title}
                        onChange={(e) => setGameSettings(prev => ({
                          ...prev,
                          [gameId]: { ...prev[gameId], title: e.target.value }
                        }))}
                        className="bg-background border-primary/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${gameId}-logo`}>Logo URL</Label>
                      <Input
                        id={`${gameId}-logo`}
                        value={settings.logo}
                        onChange={(e) => setGameSettings(prev => ({
                          ...prev,
                          [gameId]: { ...prev[gameId], logo: e.target.value }
                        }))}
                        placeholder="https://example.com/logo.png"
                        className="bg-background border-primary/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${gameId}-price`}>Base Price ($)</Label>
                      <Input
                        id={`${gameId}-price`}
                        type="number"
                        value={settings.basePrice}
                        onChange={(e) => setGameSettings(prev => ({
                          ...prev,
                          [gameId]: { ...prev[gameId], basePrice: parseFloat(e.target.value) }
                        }))}
                        className="bg-background border-primary/20"
                      />
                    </div>
                    <Button 
                      onClick={() => updateGameSettings(gameId, settings)}
                      className="w-full bg-gradient-primary hover:shadow-glow"
                    >
                      Save Settings
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}