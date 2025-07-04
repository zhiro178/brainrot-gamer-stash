import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ItemCard } from "@/components/ItemCard";
import { useAdmin } from "@/contexts/AdminContext";
import { ArrowLeft, Search, Filter, Plus } from "lucide-react";

// Mock data for demonstration
const SAMPLE_ITEMS = [
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
  const { gameId, categoryId } = useParams<{ gameId: string; categoryId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterRarity, setFilterRarity] = useState("all");
  const { isAdminMode, isAdmin } = useAdmin();

  const [items, setItems] = useState(SAMPLE_ITEMS);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRarity = filterRarity === "all" || item.rarity === filterRarity;
    return matchesSearch && matchesRarity;
  }).sort((a, b) => {
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

  const handlePurchase = async (item: any) => {
    console.log("Purchase item:", item);
    
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = "https://uahxenisnppufpswupnz.supabase.co";
      const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check user balance
        const { data: balanceData } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('user_id', user.id)
          .single();
        
        const currentBalance = balanceData?.balance || 0;
        
        if (currentBalance >= item.price) {
          // Deduct from balance
          await supabase
            .from('user_balances')
            .upsert({
              user_id: user.id,
              balance: currentBalance - item.price
            });
          
          // Create purchase ticket
          const { data: ticketData, error } = await supabase
            .from('support_tickets')
            .insert({
              user_id: user.id,
              subject: `Purchase Claim - ${item.name}`,
              message: `Purchase completed for: ${item.name} - Price: $${item.price}. Please deliver the item.`,
              status: 'open',
              category: 'purchase'
            })
            .select('id')
            .single();
          
          if (!error && ticketData) {
            // Add user message
            await supabase
              .from('ticket_messages')
              .insert({
                ticket_id: ticketData.id,
                user_id: user.id,
                message: `I have successfully purchased: ${item.name} for $${item.price}. My remaining balance is $${(currentBalance - item.price).toFixed(2)}. Please deliver the item to my account.`,
                is_admin: false
              });
            
            // Add admin message
            await supabase
              .from('ticket_messages')
              .insert({
                ticket_id: ticketData.id,
                user_id: user.id,
                message: `Payment received! We'll process your ${item.name} order and deliver it to your account within 24 hours. Thank you for your purchase!`,
                is_admin: true
              });
            
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
                    <span className="font-bold text-destructive">${item.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">New Balance:</span>
                    <span className="font-bold text-gaming-success">${(currentBalance - item.price).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-3 italic">
                    🎫 Check 'My Tickets' for delivery updates
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
            variant: "destructive",
          });
        }
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
    const newItem = {
      id: Math.max(...items.map(i => i.id)) + 1,
      name: "New Item",
      price: 9.99,
      rarity: "Common",
      image: "🎁"
    };
    setItems(prev => [...prev, newItem]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-hero">
        <div className="container mx-auto px-4 py-8">
          <Button 
            onClick={() => navigate(`/game/${gameId}`)} 
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
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onPurchase={handlePurchase}
              onUpdateItem={(itemId, updates) => {
                setItems(prev => prev.map(item => 
                  item.id === itemId ? { ...item, ...updates } : item
                ));
              }}
              onDeleteItem={(itemId) => {
                setItems(prev => prev.filter(item => item.id !== itemId));
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