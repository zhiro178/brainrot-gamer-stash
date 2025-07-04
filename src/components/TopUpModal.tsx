import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, CreditCard, Gift, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TopUpModalProps {
  user?: any;
}

export const TopUpModal = ({ user }: TopUpModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardAmount, setGiftCardAmount] = useState("");
  const { toast } = useToast();

  const handleCryptoTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting crypto top-up process...');
    const amount = parseFloat(cryptoAmount);
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }
    
    // Create a support ticket for crypto top-up
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = "https://uahxenisnppufpswupnz.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Auth error:', userError);
        throw new Error('Authentication failed');
      }
      
      if (!user) {
        throw new Error('Please log in to create a top-up request');
      }
      
      console.log('Creating crypto ticket for user:', user.id);
      
      // Create support ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: `Crypto Top-up Request - $${amount}`,
          message: `Crypto top-up request for $${amount} USD (LTC/SOL). Please provide payment instructions.`,
          status: 'open',
          category: 'crypto_topup'
        })
        .select('id')
        .single();
      
      console.log('Crypto ticket result:', { data: ticketData, error: ticketError });
      
      if (ticketError) {
        console.error('Ticket creation error:', ticketError);
        throw new Error(`Database error: ${ticketError.message}`);
      }
      
      if (ticketData) {
        // Add initial user message
        const { error: messageError } = await supabase
          .from('ticket_messages')
          .insert({
            ticket_id: ticketData.id,
            user_id: user.id,
            message: `I would like to top up my account with $${amount} USD using cryptocurrency (LTC/SOL). Please provide payment instructions.`,
            is_admin: false
          });
        
        if (messageError) {
          console.error('Message creation error:', messageError);
        }
        
        setCryptoAmount("");
        setIsOpen(false);
        
        toast({
          title: "Top-up Request Submitted",
          description: "A support ticket has been created. You'll receive payment instructions shortly.",
        });
      } else {
        throw new Error('Failed to create ticket - no data returned');
      }
    } catch (error) {
      console.error('Top-up error:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGiftCardTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCardCode.trim() || !giftCardAmount.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both gift card code and amount",
        variant: "destructive",
      });
      return;
    }
    
    const amount = parseFloat(giftCardAmount);
    if (amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Minimum gift card amount is $1.00",
        variant: "destructive",
      });
      return;
    }
    
    // Create a support ticket for gift card top-up
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = "https://uahxenisnppufpswupnz.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Auth error:', userError);
        throw new Error('Authentication failed');
      }
      
      if (!user) {
        throw new Error('Please log in to create a top-up request');
      }
      
      console.log('Creating gift card ticket for user:', user.id);
      
      // Create support ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          subject: `Gift Card Top-up - $${amount}`,
          message: `Gift card top-up request: $${amount} USD Amazon gift card with code: ${giftCardCode}`,
          status: 'open',
          category: 'giftcard_topup'
        })
        .select('id')
        .single();
      
      console.log('Gift card ticket result:', { data: ticketData, error: ticketError });
      
      if (ticketError) {
        console.error('Ticket creation error:', ticketError);
        throw new Error(`Database error: ${ticketError.message}`);
      }
      
      if (ticketData) {
        // Add initial user message
        const { error: messageError } = await supabase
          .from('ticket_messages')
          .insert({
            ticket_id: ticketData.id,
            user_id: user.id,
            message: `I would like to top up my account using an Amazon gift card. Amount: $${amount} USD, Code: ${giftCardCode}`,
            is_admin: false
          });
        
        if (messageError) {
          console.error('Message creation error:', messageError);
        }
        
        setGiftCardCode("");
        setGiftCardAmount("");
        setIsOpen(false);
        
        toast({
          title: "Gift Card Submitted",
          description: "A support ticket has been created. Your gift card will be verified within 24 hours.",
        });
      } else {
        throw new Error('Failed to create ticket - no data returned');
      }
    } catch (error) {
      console.error('Gift card error:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Button disabled variant="outline">
        <Wallet className="h-4 w-4 mr-2" />
        Login to Top Up
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-gaming hover:shadow-glow">
          <Wallet className="h-4 w-4 mr-2" />
          Top Up Balance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-gradient-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-primary">Add Funds to Your Account</DialogTitle>
          <DialogDescription>
            Choose your preferred payment method to add funds
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="crypto" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-background">
            <TabsTrigger value="crypto" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Crypto
              <CreditCard className="h-4 w-4 ml-2" />
            </TabsTrigger>
            <TabsTrigger value="giftcard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Gift Card
              <Gift className="h-4 w-4 ml-2" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crypto" className="space-y-4">
            <div className="bg-gaming-warning/10 border border-gaming-warning/20 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gaming-warning">Payment Notice</span>
                <AlertTriangle className="h-4 w-4 text-gaming-warning" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Only LTC (Litecoin) and SOL (Solana) payments accepted. No minimum amount required.
              </p>
            </div>
            
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm">Crypto Payment</CardTitle>
                <CardDescription>
                  Instant processing • LTC & SOL only • No minimum
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCryptoTopUp} className="space-y-4">
                  <div>
                    <Label htmlFor="crypto-amount">Amount (USD)</Label>
                    <Input
                      id="crypto-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="25.00"
                      value={cryptoAmount}
                      onChange={(e) => setCryptoAmount(e.target.value)}
                      required
                      className="bg-muted border-primary/20"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary hover:shadow-glow">
                    Create Top-up Ticket
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="giftcard" className="space-y-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-destructive">Important Notice</span>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Only US Amazon gift cards are accepted. Other gift cards will be rejected.
              </p>
            </div>
            
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm">US Amazon Gift Card</CardTitle>
                <CardDescription>
                  Manual verification • 24h processing time • US cards only
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGiftCardTopUp} className="space-y-4">
                  <div>
                    <Label htmlFor="gift-amount">Gift Card Amount (USD)</Label>
                    <Input
                      id="gift-amount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="25.00"
                      value={giftCardAmount}
                      onChange={(e) => setGiftCardAmount(e.target.value)}
                      required
                      className="bg-muted border-primary/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gift-code">Gift Card Code</Label>
                    <Input
                      id="gift-code"
                      type="text"
                      placeholder="Enter your US Amazon gift card code"
                      value={giftCardCode}
                      onChange={(e) => setGiftCardCode(e.target.value)}
                      required
                      className="bg-muted border-primary/20"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gaming-warning text-black hover:shadow-glow">
                    Create Gift Card Ticket
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};