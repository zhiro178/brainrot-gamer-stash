import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, CreditCard, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TopUpModalProps {
  user?: any;
  onTopUp: (amount: number, method: string, details?: any) => void;
}

export const TopUpModal = ({ user, onTopUp }: TopUpModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [giftCardCode, setGiftCardCode] = useState("");
  const { toast } = useToast();

  const handleCryptoTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(cryptoAmount);
    if (amount < 5) {
      toast({
        title: "Minimum Amount",
        description: "Minimum crypto top-up is $5.00",
        variant: "destructive",
      });
      return;
    }
    
    onTopUp(amount, "crypto");
    setCryptoAmount("");
    setIsOpen(false);
    
    toast({
      title: "Crypto Payment Initiated",
      description: "You will be redirected to complete the payment",
    });
  };

  const handleGiftCardTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCardCode.trim()) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid gift card code",
        variant: "destructive",
      });
      return;
    }
    
    onTopUp(0, "gift_card", { code: giftCardCode });
    setGiftCardCode("");
    setIsOpen(false);
    
    toast({
      title: "Gift Card Submitted",
      description: "Your gift card will be verified manually within 24 hours",
    });
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
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm">Crypto Payment</CardTitle>
                <CardDescription>
                  Instant processing • Minimum $5.00
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCryptoTopUp} className="space-y-4">
                  <div>
                    <Label htmlFor="crypto-amount">Amount (USD)</Label>
                    <Input
                      id="crypto-amount"
                      type="number"
                      min="5"
                      step="0.01"
                      placeholder="5.00"
                      value={cryptoAmount}
                      onChange={(e) => setCryptoAmount(e.target.value)}
                      required
                      className="bg-muted border-primary/20"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-primary hover:shadow-glow">
                    Pay with Crypto
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="giftcard" className="space-y-4">
            <Card className="bg-background border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm">Amazon Gift Card</CardTitle>
                <CardDescription>
                  Manual verification • 24h processing time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGiftCardTopUp} className="space-y-4">
                  <div>
                    <Label htmlFor="gift-code">Gift Card Code</Label>
                    <Input
                      id="gift-code"
                      type="text"
                      placeholder="Enter your Amazon gift card code"
                      value={giftCardCode}
                      onChange={(e) => setGiftCardCode(e.target.value)}
                      required
                      className="bg-muted border-primary/20"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gaming-warning text-black hover:shadow-glow">
                    Submit Gift Card
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