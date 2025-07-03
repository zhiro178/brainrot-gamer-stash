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
  onTopUp: (amount: number, method: string, details?: any) => void;
}

export const TopUpModal = ({ user, onTopUp }: TopUpModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardAmount, setGiftCardAmount] = useState("");
  const { toast } = useToast();

  const handleCryptoTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await onTopUp(amount, "crypto_ticket", { 
        type: "crypto_topup",
        amount,
        message: `Crypto top-up request for $${amount} USD (LTC/SOL)`
      });
      
      setCryptoAmount("");
      setIsOpen(false);
      
      toast({
        title: "Top-up Request Submitted",
        description: "A support ticket has been created. You'll receive payment instructions shortly.",
      });
    } catch (error) {
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
      await onTopUp(amount, "giftcard_ticket", { 
        type: "giftcard_topup",
        code: giftCardCode, 
        amount,
        message: `Gift card top-up request: $${amount} USD Amazon gift card with code: ${giftCardCode}`
      });
      
      setGiftCardCode("");
      setGiftCardAmount("");
      setIsOpen(false);
      
      toast({
        title: "Gift Card Submitted",
        description: "A support ticket has been created. Your gift card will be verified within 24 hours.",
      });
    } catch (error) {
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
              <CreditCard className="h-4 w-4 mr-2" />
              Crypto
            </TabsTrigger>
            <TabsTrigger value="giftcard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Gift className="h-4 w-4 mr-2" />
              Gift Card
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crypto" className="space-y-4">
            <div className="bg-gaming-warning/10 border border-gaming-warning/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gaming-warning" />
                <span className="text-sm font-medium text-gaming-warning">Payment Notice</span>
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
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Important Notice</span>
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