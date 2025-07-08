import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Wallet, AlertTriangle, Bitcoin, CreditCard } from "lucide-react";
import { simpleSupabase as workingSupabase } from "@/lib/simple-supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Your admin email
const ADMIN_EMAIL = "zhirocomputer@gmail.com";

export function TopUpModal({ user }: { user?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cryptoAmount, setCryptoAmount] = useState("");
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
      
      // Create ticket
      const ticketData = {
        user_id: currentUser.id,
        subject: `Crypto Top-up Request - $${amount}`,
        message: `Crypto top-up request for $${amount} USD (LTC/SOL).`,
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
      
      // For now, we'll generate messages without relying on the returned ticket ID
      // since the database will auto-generate the ID
      let ticketId;
      if (insertResult && Array.isArray(insertResult) && insertResult[0]?.id) {
        ticketId = insertResult[0].id;
      } else {
        // If we don't get an ID back, we'll create the ticket and then query for it
        console.log('No ID returned, will create messages after a short delay...');
        // Wait a moment for the insert to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Query for the most recent ticket by this user with matching subject
        const { data: recentTickets } = await workingSupabase
          .from("support_tickets")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("subject", ticketData.subject)
          .order("created_at", { ascending: false })
          .limit(1);
          
        if (recentTickets && recentTickets.length > 0) {
          ticketId = recentTickets[0].id;
          console.log('Found ticket ID from query:', ticketId);
        }
      }
      
      // Add initial messages if we have a ticket ID
      if (ticketId) {
        // Add initial user message
        await workingSupabase
          .from("ticket_messages")
          .insert({
            ticket_id: ticketId,
            user_id: currentUser.id,
            message: `I would like to top up my account with $${amount} USD using cryptocurrency (LTC/SOL). Please provide payment instructions.`,
            is_admin: false,
          });

        // Add automatic admin response to start the conversation
        await workingSupabase
          .from("ticket_messages")
          .insert({
            ticket_id: ticketId,
            user_id: "system",
            message: `Hello! Thank you for your crypto top-up request of $${amount} USD. An admin will review your request and provide payment instructions shortly. Please check back here for updates or wait for our response.`,
            is_admin: true,
          });
      } else {
        console.log('Warning: Could not get ticket ID, messages not created');
      }
      setCryptoAmount("");
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
        message: `Gift card top-up request: $${amount} USD Amazon gift card with code: ${giftCardCode}`,
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
      
      // For now, we'll generate messages without relying on the returned ticket ID
      // since the database will auto-generate the ID
      let ticketId;
      if (insertResult && Array.isArray(insertResult) && insertResult[0]?.id) {
        ticketId = insertResult[0].id;
      } else {
        // If we don't get an ID back, we'll create the ticket and then query for it
        console.log('No ID returned, will create messages after a short delay...');
        // Wait a moment for the insert to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Query for the most recent ticket by this user with matching subject
        const { data: recentTickets } = await workingSupabase
          .from("support_tickets")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("subject", ticketData.subject)
          .order("created_at", { ascending: false })
          .limit(1);
          
        if (recentTickets && recentTickets.length > 0) {
          ticketId = recentTickets[0].id;
          console.log('Found gift card ticket ID from query:', ticketId);
        }
      }
      
      // Add initial messages if we have a ticket ID
      if (ticketId) {
        // Add initial user message
        await workingSupabase
          .from("ticket_messages")
          .insert({
            ticket_id: ticketId,
            user_id: currentUser.id,
            message: `I would like to top up my account using an Amazon gift card.\n\nAmount: $${amount} USD\nGift Card Code: ${giftCardCode}\n\nPlease verify and add the funds to my account.`,
            is_admin: false,
          });

        // Add automatic admin response to start the conversation
        await workingSupabase
          .from("ticket_messages")
          .insert({
            ticket_id: ticketId,
            user_id: "system",
            message: `Hello! Thank you for submitting your Amazon gift card for $${amount} USD. We will verify your gift card and process your top-up request within 24 hours. You can chat with us here if you have any questions!`,
            is_admin: true,
          });
      } else {
        console.log('Warning: Could not get gift card ticket ID, messages not created');
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