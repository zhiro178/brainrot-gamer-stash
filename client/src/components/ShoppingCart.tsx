import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { Trash2, Plus, Minus, ShoppingCart as ShoppingCartIcon, CreditCard } from "lucide-react";

export function ShoppingCart() {
  const { items, itemCount, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative border-primary/20 hover:bg-primary/10">
          <ShoppingCartIcon className="h-4 w-4 mr-2" />
          Cart
          {itemCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-gaming-success text-black min-w-[20px] h-5 flex items-center justify-center text-xs">
              {itemCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-gradient-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCartIcon className="h-5 w-5" />
            Shopping Cart ({itemCount} items)
          </DialogTitle>
          <DialogDescription>
            Review your items and proceed to checkout. Maximum 10 items allowed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCartIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground">Add some items to get started!</p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <Card key={item.id} className="bg-background border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center">
                          {item.image.startsWith('http') ? (
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded border border-primary/20"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <span 
                            className={`text-2xl ${item.image.startsWith('http') ? 'hidden' : 'block'}`}
                            style={{ display: item.image.startsWith('http') ? 'none' : 'block' }}
                          >
                            {item.image.startsWith('http') ? '🎁' : item.image}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.rarity}</p>
                          <p className="text-sm font-bold text-gaming-success">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-semibold">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 p-0"
                            disabled={itemCount >= 10}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.id)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-gaming-success">${totalPrice.toFixed(2)}</span>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Clear Cart
                </Button>
                <CheckoutDialog 
                  isOpen={isCheckoutOpen}
                  onOpenChange={setIsCheckoutOpen}
                  items={items}
                  totalPrice={totalPrice}
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CheckoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  items: any[];
  totalPrice: number;
}

function CheckoutDialog({ isOpen, onOpenChange, items, totalPrice }: CheckoutDialogProps) {
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    setIsProcessing(true);
    
    try {
      const { simpleSupabase: workingSupabase } = await import("@/lib/simple-supabase");
      
      // Get current user
      const { data: { user } } = await workingSupabase.auth.getUser();
      
      if (!user) {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Login Required",
          description: "You need to be logged in to checkout.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if user is verified
      if (!user.email_confirmed_at) {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Email Verification Required",
          description: "Please verify your email address before making purchases.",
          variant: "destructive",
        });
        return;
      }
      
      // Check user balance
      const balanceResult = await new Promise((resolve) => {
        workingSupabase
          .from('user_balances')
          .select('balance')
          .eq('user_id', String(user.id))
          .then(resolve);
      });
      
      const balanceData = (balanceResult as any).data;
      const balanceError = (balanceResult as any).error;
      
      if (balanceError) {
        throw new Error(`Failed to fetch balance: ${balanceError.message}`);
      }
      
      const currentBalance = parseFloat(balanceData?.[0]?.balance || '0');
      
      if (currentBalance < totalPrice) {
        const { toast } = await import("@/hooks/use-toast");
        const shortfall = (totalPrice - currentBalance).toFixed(2);
        toast({
          title: "Insufficient Balance",
          description: `You need $${shortfall} more to complete this purchase. Current balance: $${currentBalance.toFixed(2)}`,
          className: "bg-gradient-to-br from-cyan-500/20 to-blue-400/20 border border-cyan-400/30 text-cyan-100",
        });
        return;
      }
      
      // Deduct from balance
      const newBalance = currentBalance - totalPrice;
      
      const updateResult = await new Promise((resolve) => {
        workingSupabase
          .from('user_balances')
          .update({
            balance: newBalance.toFixed(2)
          })
          .eq('user_id', String(user.id))
          .then(resolve);
      });
      
      const updateError = (updateResult as any).error;
      if (updateError) {
        throw new Error(`Failed to update balance: ${updateError.message}`);
      }
      
      // Dispatch balance refresh events
      window.dispatchEvent(new CustomEvent('user-balance-updated', { 
        detail: { 
          userId: user.id, 
          newBalance: newBalance.toFixed(2),
          deductedAmount: totalPrice.toFixed(2)
        } 
      }));
      
      window.dispatchEvent(new CustomEvent('balance-updated', { 
        detail: { userId: user.id } 
      }));
      
      // Cache the new balance
      localStorage.setItem(`user_balance_${user.id}`, newBalance.toString());
      
             // Create enhanced order summary with proper formatting and images
        const itemsList = items.map(item => {
          const logoLine = item.image.startsWith('http') ? `🖼️ ${item.image}\n` : '';
          return `${logoLine}• ${item.name} (${item.rarity}) - Qty: ${item.quantity}`;
        }).join('\n');
        
        const orderSummary = `ORDER SUMMARY:\n${itemsList}`;
        
        // Create purchase ticket
        const ticketResult = await workingSupabase
          .from('support_tickets')
          .insert({
            user_id: String(user.id),
            subject: `Bulk Purchase Order - ${items.length} items - $${totalPrice.toFixed(2)}`,
            message: `Bulk purchase completed.\n\n${orderSummary}\n\nPlease deliver all items to my account.`,
            status: 'open',
            category: 'purchase'
          });
        
        const ticketData = ticketResult.data;
        const error = ticketResult.error;
        
        if (!error && ticketData) {
          const ticketId = Array.isArray(ticketData) ? ticketData[0]?.id : (ticketData as any)?.id;
          
          if (ticketId) {
            // Add user message with detailed order summary
            await workingSupabase
              .from('ticket_messages')
              .insert({
                ticket_id: parseInt(ticketId),
                user_id: String(user.id),
                message: `I have ordered the following item(s):\n\n${orderSummary}\n\nPlease deliver all items to my account.`,
                is_admin: false
              });
            
            // Add admin confirmation message
            const itemNames = items.map(item => item.name).join(', ');
            await workingSupabase
              .from('ticket_messages')
              .insert({
                ticket_id: parseInt(ticketId),
                user_id: "system",
                message: `✅ Payment received!\n\nYour order is confirmed.\nDelivery will be completed within 24 hours.\n\nThanks for your purchase!`,
                is_admin: true
              });
          }
        
        // Clear cart and close dialogs
        clearCart();
        onOpenChange(false);
        
        // Dispatch ticket refresh
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('tickets-updated', { 
            detail: { userId: user.id, action: 'bulk_purchase', ticketId: ticketId } 
          }));
        }, 100);
        
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "🎉 Purchase Successful!",
          description: (
            <div className="space-y-3 p-4 bg-gradient-to-br from-gaming-success/20 to-gaming-success/10 rounded-lg border border-gaming-success/30">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-bold text-primary">{items.length} items</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Paid:</span>
                <span className="font-bold text-destructive">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">New Balance:</span>
                <span className="font-bold text-gaming-success">${newBalance.toFixed(2)}</span>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-3 italic">
                🎫 Check 'My Tickets' for delivery updates and chat with support
              </p>
            </div>
          ),
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Checkout Failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className="flex-1 bg-gaming-success hover:bg-gaming-success/80 text-black"
          disabled={items.length === 0}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Checkout
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-gradient-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Checkout Summary
          </DialogTitle>
          <DialogDescription>
            Review your order before completing the purchase
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="bg-background/50 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {item.image.startsWith('http') ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-8 h-8 object-cover rounded border border-primary/20"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span 
                        className={`text-lg ${item.image.startsWith('http') ? 'hidden' : 'block'}`}
                        style={{ display: item.image.startsWith('http') ? 'none' : 'block' }}
                      >
                        {item.image.startsWith('http') ? '🎁' : item.image}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.rarity} • Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-gaming-success">${totalPrice.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              className="flex-1 bg-gaming-success hover:bg-gaming-success/80 text-black"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : `Pay $${totalPrice.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}