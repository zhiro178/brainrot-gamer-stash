import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Wallet, AlertTriangle, Bitcoin, CreditCard } from "lucide-react";
import { simpleSupabase as workingSupabase } from "@/lib/simple-supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Your admin email
const ADMIN_EMAIL = "zhirocomputer@gmail.com";

// Cryptocurrency options
const CRYPTO_OPTIONS = [
  {
    value: 'LTC',
    label: 'Litecoin (LTC)',
    image: 'https://s3.coinmarketcap.com/static/img/portraits/630c5fcaf8184351dc5c6ee5.png',
    symbol: 'LTC'
  },
  {
    value: 'SOL',
    label: 'Solana (SOL)',
    image: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png',
    symbol: 'SOL'
  }
];

export function TopUpModal({ user }: { user?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [giftCardAmount, setGiftCardAmount] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Helper: ensure current user
  const ensureUser = async () => {
    let currentUser = user;
    if (!currentUser) {
      const { data: { user: authUser }, error: userError } = await workingSupabase.auth.getUser();
      if (userError || !authUser) return null;
      currentUser = authUser;
    }
    return currentUser;
  };

  // Crypto top-up
  const handleCryptoTopUp = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const amount = parseFloat(cryptoAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount",
          variant: "destructive",
        });
        return;
      }

      if (!selectedCrypto) {
        toast({
          title: "Cryptocurrency Required",
          description: "Please select a cryptocurrency (LTC or SOL)",
          variant: "destructive",
        });
        return;
      }

      const currentUser = await ensureUser();
      if (!currentUser) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create a top-up ticket.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Creating crypto topup ticket with working client...');
      
      const selectedCryptoInfo = CRYPTO_OPTIONS.find(crypto => crypto.value === selectedCrypto);
      
      // Create ticket
      const ticketData = {
        user_id: currentUser.id,
        subject: `${selectedCrypto} Top-up Request - $${amount}`,
        message: `Crypto top-up request for $${amount} USD using ${selectedCryptoInfo?.label || selectedCrypto}.`,
        status: "open",
        category: "crypto_topup",
      };
      
      const { data: insertResult, error: ticketError } = await workingSupabase
        .from("support_tickets")
        .insert(ticketData);
      
      console.log('Ticket creation result:', { insertResult, ticketError });
        
      if (ticketError) {
        throw new Error(ticketError?.message || "Failed to create ticket.");
      }
      
      // Get ticket ID from insert result (most databases return the created record)
      let ticketId = insertResult?.[0]?.id || insertResult?.id;
      
      // If no ID returned, get the most recent ticket for this user
      if (!ticketId) {
        console.log('No ID returned from insert, querying for recent ticket...');
        const { data: recentTickets } = await workingSupabase
          .from("support_tickets")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("subject", ticketData.subject)
          .order("created_at", { ascending: false })
          .limit(1);
          
        ticketId = recentTickets?.[0]?.id;
        console.log('Found ticket ID from query:', ticketId);
      }
      
      // Add initial messages if we have a ticket ID
      if (ticketId) {
        // Add initial user message
        await workingSupabase
          .from("ticket_messages")
          .insert({
            ticket_id: ticketId,
            user_id: currentUser.id,
            message: `I would like to top up my account with $${amount} USD using ${selectedCryptoInfo?.label || selectedCrypto}. Please provide payment instructions.`,
            is_admin: false,
          });

        // Add automatic admin response to start the conversation
        await workingSupabase
          .from("ticket_messages")
          .insert({
            ticket_id: ticketId,
            user_id: "system",
            message: `Hello! Thank you for your ${selectedCryptoInfo?.label || selectedCrypto} top-up request of $${amount} USD. An admin will review your request and provide payment instructions shortly. Please check back here for updates or wait for our response.`,
            is_admin: true,
          });
      } else {
        console.log('Warning: Could not get ticket ID, messages not created');
      }
      setCryptoAmount("");
      setSelectedCrypto("");
      setIsOpen(false);
      toast({
        title: "Top-up Request Submitted",
        description:
          "A support ticket has been created. Check the 'My Tickets' section to chat with our team and receive payment instructions.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      toast({
        title: "Ticket Creation Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Ticket creation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gift card top-up
  const handleGiftCardTopUp = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!giftCardCode.trim() || !giftCardAmount.trim()) {
        toast({
          title: "Missing Information",
          description: "Please enter both gift card code and amount",
          variant: "destructive",
        });
        return;
      }
      const amount = parseFloat(giftCardAmount);
      if (isNaN(amount) || amount < 1) {
        toast({
          title: "Invalid Amount",
          description: "Minimum gift card amount is $1.00",
          variant: "destructive",
        });
        return;
      }
      const currentUser = await ensureUser();
      if (!currentUser) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create a top-up ticket.",
          variant: "destructive",
        });
        return;
      }
      
            console.log('Creating gift card topup ticket with working client...');
      
      // Create ticket
      const ticketData = {
        user_id: currentUser.id,
        subject: `Gift Card Top-up - $${amount}`,
        message: `Gift card top-up request: $${amount}`,
        status: "open",
        category: "giftcard_topup",
      };
      
      const { data: insertResult, error: ticketError } = await workingSupabase
        .from("support_tickets")
        .insert(ticketData);
         
      console.log('Gift card ticket creation result:', { insertResult, ticketError });
         
      if (ticketError) {
        throw new Error(ticketError?.message || "Failed to create ticket.");
      }
      
      // Get ticket ID from insert result (most databases return the created record)
      let ticketId = insertResult?.[0]?.id || insertResult?.id;
      
      // If no ID returned, get the most recent ticket for this user
      if (!ticketId) {
        console.log('No ID returned from gift card insert, querying for recent ticket...');
        const { data: recentTickets } = await workingSupabase
          .from("support_tickets")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("subject", ticketData.subject)
          .order("created_at", { ascending: false })
          .limit(1);
          
        ticketId = recentTickets?.[0]?.id;
        console.log('Found gift card ticket ID from query:', ticketId);
      }
      
      // Add initial messages if we have a ticket ID
      if (ticketId) {
        // Add user message with the gift card code
        await workingSupabase.from("ticket_messages").insert({
          ticket_id: ticketId,
          user_id: currentUser.id,
          message: `Hello! Here's my Amazon Gift Card code for the $${amount} top-up: ${giftCardCode}. Please verify and credit my account when it's ready. Thank you!`,
          is_admin: false,
        });

        // Add initial admin acknowledgment
        await workingSupabase.from("ticket_messages").insert({
          ticket_id: ticketId,
          user_id: "system",
          message: `Hello! Thank you for your Amazon Gift Card top-up request of $${amount}. Once the code is verified, your account will be credited accordingly.`,
          is_admin: true,
        });
      }

      setGiftCardCode("");
      setGiftCardAmount("");
      setIsOpen(false);
      toast({
        title: "Gift Card Submitted",
        description:
          "A support ticket has been created. Visit 'My Tickets' to chat with our team. Your gift card will be verified within 24 hours.",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      toast({
        title: "Ticket Creation Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Gift card ticket creation failed:", error);
    } finally {
      setLoading(false);
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

  if (!user.email_confirmed_at) {
    return (
      <Button 
        disabled 
        variant="outline"
        className="border-gaming-warning text-gaming-warning opacity-60"
      >
        <Wallet className="h-4 w-4 mr-2" />
        Verify Email to Top Up
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-gaming hover:shadow-glow text-lg px-8 py-6 h-auto">
          <Wallet className="h-6 w-6 mr-3" />
          Top Up Balance
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center mb-6">Top Up Your Account</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Crypto Top-up Card */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border-orange-500/20">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mb-2">
                  <Bitcoin className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-orange-400">Cryptocurrency</CardTitle>
                <CardDescription>Pay with LTC or SOL</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCryptoTopUp} className="space-y-4">
                  <div>
                    <Label htmlFor="crypto-amount" className="text-orange-300">Amount (USD)</Label>
                    <Input
                      id="crypto-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="25.00"
                      value={cryptoAmount}
                      onChange={(e) => setCryptoAmount(e.target.value)}
                      required
                      className="bg-background/50 border-orange-500/30 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="crypto-select" className="text-orange-300">Cryptocurrency</Label>
                    <Select onValueChange={setSelectedCrypto} defaultValue={selectedCrypto} value={selectedCrypto}>
                      <SelectTrigger className="bg-background/50 border-orange-500/30 focus:border-orange-500">
                        <SelectValue placeholder="Select a cryptocurrency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CRYPTO_OPTIONS.map((crypto) => (
                          <SelectItem key={crypto.value} value={crypto.value}>
                            <div className="flex items-center gap-2">
                              <img src={crypto.image} alt={crypto.label} className="h-4 w-4" />
                              {crypto.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                    disabled={loading}
                  >
                    <Bitcoin className="h-4 w-4 mr-2" />
                    Create Crypto Request
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Gift Card Top-up Card */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-2">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-blue-400">Gift Card</CardTitle>
                <CardDescription>Amazon Gift Card</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGiftCardTopUp} className="space-y-4">
                  <div>
                    <Label htmlFor="giftcard-amount" className="text-blue-300">Amount (USD)</Label>
                    <Input
                      id="giftcard-amount"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="25.00"
                      value={giftCardAmount}
                      onChange={(e) => setGiftCardAmount(e.target.value)}
                      required
                      className="bg-background/50 border-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="giftcard-code" className="text-blue-300">Gift Card Code</Label>
                    <Input
                      id="giftcard-code"
                      type="text"
                      placeholder="XXXX-XXXX-XXXX"
                      value={giftCardCode}
                      onChange={(e) => setGiftCardCode(e.target.value)}
                      required
                      className="bg-background/50 border-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                    disabled={loading}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Submit Gift Card
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Security Notice */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                Security Notice
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Never share your gift card code anywhere except in the ticket chat. Only admins will contact you about your top-up request.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}