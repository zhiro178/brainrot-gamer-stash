import { useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItemCard } from "@/components/ItemCard";
import { ShoppingCart } from "@/components/ShoppingCart";
import { useAdmin } from "@/contexts/AdminContext";
import { ArrowLeft, Search, Filter, Plus } from "lucide-react";

// Define types for items
interface CatalogItem {
  id: number;
  name: string;
  price: number;
  rarity: string;
  image: string;
}

// Mock data for demonstration
const SAMPLE_ITEMS: CatalogItem[] = [
  { id: 1, name: "Legendary Dragon Pet", price: 25.99, rarity: "Legendary", image: "🐉" },
  { id: 2, name: "Rainbow Unicorn", price: 19.99, rarity: "Epic", image: "🦄" },
  { id: 3, name: "Golden Crown", price: 15.50, rarity: "Rare", image: "👑" },
  { id: 4, name: "Magic Wand", price: 8.99, rarity: "Common", image: "🪄" },
  { id: 5, name: "Crystal Sword", price: 35.00, rarity: "Legendary", image: "⚔️" },
  { id: 6, name: "Phoenix Egg", price: 42.99, rarity: "Mythical", image: "🥚" },
  { id: 7, name: "Enchanted Ring", price: 12.75, rarity: "Rare", image: "💍" },
  { id: 8, name: "Speed Boots", price: 6.99, rarity: "Common", image: "👢" },
];

export default function Catalog() {
  const [match, params] = useRoute("/game/:gameId/category/:categoryId");
  const [, setLocation] = useLocation();
  const { gameId, categoryId } = params || {};
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterRarity, setFilterRarity] = useState("all");
  const { isAdminMode, isAdmin } = useAdmin();

  const [items, setItems] = useState<CatalogItem[]>(() => {
    // Try to load from localStorage first
    const savedItems = localStorage.getItem(`catalog-items-${gameId}-${categoryId}`);
    return savedItems ? JSON.parse(savedItems) : SAMPLE_ITEMS;
  });

  // Save items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`catalog-items-${gameId}-${categoryId}`, JSON.stringify(items));
  }, [items, gameId, categoryId]);

  const filteredItems = items.filter((item: CatalogItem) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = filterRarity === "all" || item.rarity === filterRarity;
    return matchesSearch && matchesRarity;
  }).sort((a: CatalogItem, b: CatalogItem) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rarity":
        return a.rarity.localeCompare(b.rarity);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handlePurchase = async (item: CatalogItem) => {
    console.log("Purchase item:", item);
    
    try {
      const { simpleSupabase: workingSupabase } = await import("@/lib/simple-supabase");
      
      // Get current user using working client
      const { data: { user } } = await workingSupabase.auth.getUser();
      
      console.log('Purchase flow - user check:', user);
      
      // Check if user is logged in
      if (!user) {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Login Required",
          description: (
            <div className="space-y-3">
              <p>You need to be logged in to purchase items.</p>
              <div className="flex space-x-2">
                <button 
                  onClick={() => window.location.href = "/?login=true"}
                  className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/80"
                >
                  Login
                </button>
                <button 
                  onClick={() => window.location.href = "/?register=true"}
                  className="bg-secondary text-secondary-foreground px-3 py-1 rounded text-sm hover:bg-secondary/80"
                >
                  Register
                </button>
              </div>
            </div>
          ),
        });
        return;
      }
      
      // Check if user is verified
      if (!user.email_confirmed_at) {
        const { toast } = await import("@/hooks/use-toast");
        toast({
          title: "Email Verification Required",
          description: "Please verify your email address before making purchases. Check your inbox for the verification link.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('Purchase flow - checking balance for user:', user.id);
      
      // Check user balance using working client
      const balanceResult = await new Promise((resolve) => {
        workingSupabase
          .from('user_balances')
          .select('balance')
          .eq('user_id', String(user.id))
          .then(resolve);
      });
      
      const balanceData = (balanceResult as any).data;
      const balanceError = (balanceResult as any).error;
      
      console.log('Purchase flow - balance query result:', { balanceData, balanceError });
      
      if (balanceError) {
        throw new Error(`Failed to fetch balance: ${balanceError.message}`);
      }
      
      const currentBalance = parseFloat(balanceData?.[0]?.balance || '0');
      
      console.log('Purchase flow - current balance:', currentBalance, 'item price:', item.price);
      
      if (currentBalance >= item.price) {
        // Deduct from balance using working client
        const newBalance = currentBalance - item.price;
        
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
        
        console.log('Purchase flow - balance updated');
        
        // Dispatch balance refresh events to update UI
        window.dispatchEvent(new CustomEvent('user-balance-updated', { 
          detail: { 
            userId: user.id, 
            newBalance: newBalance.toFixed(2),
            deductedAmount: item.price.toFixed(2)
          } 
        }));
        
        window.dispatchEvent(new CustomEvent('balance-updated', { 
          detail: { userId: user.id } 
        }));
        
        // Cache the new balance
        localStorage.setItem(`user_balance_${user.id}`, newBalance.toString());
        
        // Create purchase ticket using working client
        const ticketResult = await workingSupabase
          .from('support_tickets')
          .insert({
            user_id: String(user.id),
            subject: `Purchase Claim - ${item.name}`,
            message: `Purchase completed for: ${item.name} - Price: $${item.price}. Please deliver the item.`,
            status: 'open',
            category: 'purchase'
          });
        
        const ticketData = ticketResult.data;
        const error = ticketResult.error;
        
        console.log('Purchase flow - ticket creation result:', { ticketData, error });
        
        if (!error && ticketData) {
          // Get the ticket ID from response
          const ticketId = Array.isArray(ticketData) ? ticketData[0]?.id : (ticketData as any)?.id;
          
          if (ticketId) {
            // Add user message
            const userMessageResult = await workingSupabase
              .from('ticket_messages')
              .insert({
                ticket_id: parseInt(ticketId),
                user_id: String(user.id),
                message: `I have purchased: ${item.name} for $${item.price.toFixed(2)}. Please deliver the item to my account.`,
                is_admin: false
              });
            
            // Add admin message
            const adminMessageResult = await workingSupabase
              .from('ticket_messages')
              .insert({
                ticket_id: parseInt(ticketId),
                user_id: "system",
                message: `Payment received! We'll process your Order and deliver it to your account within 24 hours. Thank you for your purchase!`,
                is_admin: true
              });
            
            console.log('Purchase flow - messages created:', { 
              userMessage: userMessageResult.error, 
              adminMessage: adminMessageResult.error 
            });
          }
          
          // Dispatch ticket refresh event for any listening ticket components
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('tickets-updated', { 
              detail: { userId: user.id, action: 'purchase', ticketId: ticketId } 
            }));
          }, 100);
          
          const { toast } = await import("@/hooks/use-toast");
          toast({
            title: "🎉 Purchase Successful!",
            description: (
              <div className="space-y-3 p-4 bg-gradient-to-br from-gaming-success/20 to-gaming-success/10 rounded-lg border border-gaming-success/30">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Item:</span>
                  <span className="font-bold text-primary">{item.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-bold text-destructive">${item.price.toFixed(2)}</span>
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
      } else {
        const { toast } = await import("@/hooks/use-toast");
        const shortfall = (item.price - currentBalance).toFixed(2);
        toast({
          title: "Insufficient Balance",
          description: `You need $${shortfall} more to purchase this item. Current balance: $${currentBalance.toFixed(2)}`,
          className: "bg-gradient-to-br from-cyan-500/20 to-blue-400/20 border border-cyan-400/30 text-cyan-100",
        });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      const { toast } = await import("@/hooks/use-toast");
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddItem = () => {
    const newItem: CatalogItem = {
      id: Math.max(...items.map((i: CatalogItem) => i.id)) + 1,
      name: "New Item",
      price: 9.99,
      rarity: "Common",
      image: "🎁"
    };
    setItems((prev: CatalogItem[]) => [...prev, newItem]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-hero">
        <div className="container mx-auto px-4 py-8">
          <Button 
            onClick={() => setLocation(`/game/${gameId}`)} 
            variant="outline" 
            className="mb-6 border-primary/20 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
              {categoryId?.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())} Items
            </h1>
            <p className="text-muted-foreground">
              Browse and purchase items from this category
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-primary/20"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-background border-primary/20">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-background border-primary/20 z-50">
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="price-low">Price (Low to High)</SelectItem>
                <SelectItem value="price-high">Price (High to Low)</SelectItem>
                <SelectItem value="rarity">Rarity</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterRarity} onValueChange={setFilterRarity}>
              <SelectTrigger className="w-full md:w-48 bg-background border-primary/20">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by rarity" />
              </SelectTrigger>
              <SelectContent className="bg-background border-primary/20 z-50">
                <SelectItem value="all">All Rarities</SelectItem>
                <SelectItem value="Common">Common</SelectItem>
                <SelectItem value="Rare">Rare</SelectItem>
                <SelectItem value="Epic">Epic</SelectItem>
                <SelectItem value="Legendary">Legendary</SelectItem>
                <SelectItem value="Mythical">Mythical</SelectItem>
              </SelectContent>
            </Select>

            <ShoppingCart />

            {isAdmin && isAdminMode && (
              <Button 
                onClick={handleAddItem}
                className="bg-gaming-success hover:bg-gaming-success/80 text-black"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item: CatalogItem) => (
            <ItemCard
              key={item.id}
              item={item}
              onPurchase={handlePurchase}
              onUpdateItem={(itemId: number, updates: Partial<CatalogItem>) => {
                setItems((prev: CatalogItem[]) => prev.map((item: CatalogItem) => 
                  item.id === itemId ? { ...item, ...updates } : item
                ));
              }}
              onDeleteItem={(itemId: number) => {
                setItems((prev: CatalogItem[]) => prev.filter((item: CatalogItem) => item.id !== itemId));
              }}
            />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">No items found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}