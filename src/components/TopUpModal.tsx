import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Wallet, AlertTriangle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Supabase config (your actual credentials)
const supabaseUrl = "https://uahxenisnppufpswupnz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";
const supabase = createClient(supabaseUrl, supabaseKey);

// Your admin email
const ADMIN_EMAIL = "zhirocomputer@gmail.com";

export default function TopUpModal({ user }: { user?: any }) {
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
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) return null;
      currentUser = authUser;
    }
    return currentUser;
  };

  // Helper: get admin user by email
  const getAdminUser = async () => {
    const { data: adminUser, error: adminError } = await supabase
      .from("auth.users")
      .select("id")
      .eq("email", ADMIN_EMAIL)
      .single();
    if (!adminUser || adminError) return null;
    return adminUser;
  };

  // Crypto top-up
  const handleCryptoTopUp = async (e: React.FormEvent) => {
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
      // Create ticket
      const ticketData = {
        user_id: currentUser.id,
        subject: `Crypto Top-up Request - $${amount}`,
        message: `Crypto top-up request for $${amount} USD (LTC/SOL).`,
        status: "open",
        category: "crypto_topup",
      };
      const { data: insertResult, error: ticketError } = await supabase
        .from("support_tickets")
        .insert(ticketData)
        .select("id")
        .single();
      if (!insertResult || ticketError) {
        throw new Error(ticketError?.message || "Failed to create ticket.");
      }
      // Get admin
      const adminUser = await getAdminUser();
      if (!adminUser) {
        toast({
          title: "Admin Error",
          description: "Admin user not found. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      // Add user & admin messages
      const messageData = [
        {
          ticket_id: insertResult.id,
          user_id: currentUser.id,
          message: `I would like to top up my account with $${amount} USD using cryptocurrency.`,
          is_admin: false,
        },
        {
          ticket_id: insertResult.id,
          user_id: adminUser.id,
          message: `Hello! We've received your crypto top-up request. We'll process this shortly.`,
          is_admin: true,
        },
      ];
      const { error: messageError } = await supabase
        .from("ticket_messages")
        .insert(messageData);
      if (messageError) {
        throw new Error(messageError.message);
      }
      setCryptoAmount("");
      setIsOpen(false);
      toast({
        title: "Top-up Request Submitted",
        description:
          "A support ticket has been created. You'll receive payment instructions shortly.",
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
  const handleGiftCardTopUp = async (e: React.FormEvent) => {
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
      // Create ticket
      const ticketData = {
        user_id: currentUser.id,
        subject: `Gift Card Top-up - $${amount}`,
        message: `Gift card top-up request: $${amount} USD Amazon gift card with code: ${giftCardCode}`,
        status: "open",
        category: "giftcard_topup",
      };
      const { data: insertResult, error: ticketError } = await supabase
        .from("support_tickets")
        .insert(ticketData)
        .select("id")
        .single();
      if (!insertResult || ticketError) {
        throw new Error(ticketError?.message || "Failed to create ticket.");
      }
      // Get admin
      const adminUser = await getAdminUser();
      if (!adminUser) {
        toast({
          title: "Admin Error",
          description: "Admin user not found. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      // Add user & admin messages
      const messageData = [
        {
          ticket_id: insertResult.id,
          user_id: currentUser.id,
          message: `I would like to top up my account using an Amazon gift card. Amount: $${amount} USD, Code: ${giftCardCode}`,
          is_admin: false,
        },
        {
          ticket_id: insertResult.id,
          user_id: adminUser.id,
          message: `Hello! I've received your gift card top-up request for $${amount} USD. I'll verify your Amazon gift card within 24 hours.`,
          is_admin: true,
        },
      ];
      const { error: messageError } = await supabase
        .from("ticket_messages")
        .insert(messageData);
      if (messageError) {
        throw new Error(messageError.message);
      }
      setGiftCardCode("");
      setGiftCardAmount("");
      setIsOpen(false);
      toast({
        title: "Gift Card Submitted",
        description:
          "A support ticket has been created. Your gift card will be verified within 24 hours.",
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-gaming hover:shadow-glow">
          <Wallet className="h-4 w-4 mr-2" />
          Top Up
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div>
          <h2 className="text-xl font-bold mb-3">Top Up Your Account</h2>
          <form onSubmit={handleCryptoTopUp} className="space-y-4">
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
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:shadow-glow"
              disabled={loading}
            >
              Create Crypto Top-up Ticket
            </Button>
          </form>
          <hr className="my-4" />
          <form onSubmit={handleGiftCardTopUp} className="space-y-4">
            <Label htmlFor="giftcard-amount">Gift Card Amount (USD)</Label>
            <Input
              id="giftcard-amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="25.00"
              value={giftCardAmount}
              onChange={(e) => setGiftCardAmount(e.target.value)}
              required
              className="bg-muted border-primary/20"
            />
            <Label htmlFor="giftcard-code">Gift Card Code</Label>
            <Input
              id="giftcard-code"
              type="text"
              placeholder="XXXX-XXXX-XXXX"
              value={giftCardCode}
              onChange={(e) => setGiftCardCode(e.target.value)}
              required
              className="bg-muted border-primary/20"
            />
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:shadow-glow"
              disabled={loading}
            >
              Create Gift Card Top-up Ticket
            </Button>
          </form>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-destructive">
                Important Notice
              </span>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-xs mt-2">
              Do not share your gift card code anywhere except in this ticket chat. Only admins with email {ADMIN_EMAIL} will contact you.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}