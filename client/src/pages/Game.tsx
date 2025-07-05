import { useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryCard } from "@/components/CategoryCard";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'legendary': return 'bg-yellow-500 text-white';
    case 'epic': return 'bg-purple-500 text-white';
    case 'rare': return 'bg-blue-500 text-white';
    case 'uncommon': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const GAMES = {
  "adopt-me": {
    title: "Adopt Me",
    description: "Trade pets, eggs, and exclusive items from the popular Roblox game",
    categories: [
      { id: "test-1", name: "Test 1", description: "Premium pets and rare items", itemCount: 156 },
      { id: "test-2", name: "Test 2", description: "Legendary eggs and accessories", itemCount: 89 }
    ]
  },
  "grow-garden": {
    title: "Grow a Garden",
    description: "Seeds, tools, and garden decorations for your virtual garden",
    categories: [
      { id: "test-1", name: "Test 1", description: "Rare seeds and plants", itemCount: 78 },
      { id: "test-2", name: "Test 2", description: "Garden tools and decorations", itemCount: 92 }
    ]
  },
  "mm2": {
    title: "MM2 (Murder Mystery 2)",
    description: "Knives, guns, and exclusive items from Murder Mystery 2",
    categories: [
      { id: "test-1", name: "Test 1", description: "Legendary knives and weapons", itemCount: 134 },
      { id: "test-2", name: "Test 2", description: "Rare collectibles and pets", itemCount: 67 }
    ]
  },
  "steal-brainrot": {
    title: "Steal a Brainrot",
    description: "Unique items and collectibles from this trending game",
    categories: [
      { id: "test-1", name: "Test 1", description: "Exclusive meme items", itemCount: 45 },
      { id: "test-2", name: "Test 2", description: "Limited edition collectibles", itemCount: 38 }
    ]
  }
};

export default function Game() {
  const [match, params] = useRoute("/game/:gameId");
  const [, setLocation] = useLocation();
  const [gameData, setGameData] = useState(() => {
    // Try to load from localStorage first
    const savedGames = localStorage.getItem('game-data');
    return savedGames ? JSON.parse(savedGames) : GAMES;
  });
  const [catalog, setCatalog] = useState(() => {
    // Load catalog from localStorage
    const savedCatalog = localStorage.getItem('admin_catalog');
    return savedCatalog ? JSON.parse(savedCatalog) : {};
  });
  const gameId = params?.gameId;
  
  // Save game data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('game-data', JSON.stringify(gameData));
  }, [gameData]);
  
  // Load catalog data on mount and when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCatalog = localStorage.getItem('admin_catalog');
      if (savedCatalog) {
        setCatalog(JSON.parse(savedCatalog));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const game = gameId ? gameData[gameId as keyof typeof gameData] : null;
  const gameCatalog = gameId ? catalog[gameId] : null;

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-gradient-card border-destructive/20">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Game Not Found</h1>
            <p className="text-muted-foreground mb-4">The game you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-hero">
        <div className="container mx-auto px-4 py-12">
          <Button 
            onClick={() => setLocation("/")} 
            variant="outline" 
            className="mb-6 border-primary/20 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              {game.title}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {game.description}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2 text-primary">Browse Categories</h2>
          <p className="text-muted-foreground">Select a category to view available items</p>
          {gameCatalog && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">{gameCatalog.items?.length || 0} items available</Badge>
              <Badge variant="outline">{gameCatalog.categories?.length || 0} categories</Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Show admin catalog categories if available, otherwise fallback to default */}
          {gameCatalog && gameCatalog.categories ? (
            gameCatalog.categories.map((categoryName: string) => {
              const categoryItems = gameCatalog.items?.filter((item: any) => item.category === categoryName) || [];
              return (
                <CategoryCard
                  key={categoryName}
                  category={{
                    id: categoryName.toLowerCase().replace(/\s+/g, '-'),
                    name: categoryName,
                    description: `${categoryItems.length} items available`,
                    itemCount: categoryItems.length
                  }}
                  gameId={gameId!}
                  onClick={() => setLocation(`/game/${gameId}/category/${categoryName.toLowerCase().replace(/\s+/g, '-')}`)}
                  onUpdateCategory={() => {}} // Admin catalog categories are managed through the catalog editor
                />
              );
            })
          ) : (
            game.categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                gameId={gameId!}
                onClick={() => setLocation(`/game/${gameId}/category/${category.id}`)}
                                   onUpdateCategory={(categoryId: string, updates: any) => {
                     setGameData((prev: any) => ({
                       ...prev,
                       [gameId!]: {
                         ...prev[gameId! as keyof typeof prev],
                         categories: prev[gameId! as keyof typeof prev].categories.map((cat: any) =>
                           cat.id === categoryId ? { ...cat, ...updates } : cat
                         )
                       }
                     }));
                   }}
              />
            ))
          )}
        </div>
        
        {/* Show featured items if available */}
        {gameCatalog && gameCatalog.items && gameCatalog.items.length > 0 && (
          <div className="mt-16">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 text-primary">Featured Items</h2>
              <p className="text-muted-foreground">Popular items from our catalog</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {gameCatalog.items.slice(0, 8).map((item: any) => (
                <Card key={item.id} className="bg-gradient-card border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="aspect-square mb-4 overflow-hidden rounded-lg">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{item.name}</h3>
                        <Badge className={`text-xs ${getRarityColor(item.rarity)}`}>
                          {item.rarity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">${item.price}</span>
                        <Badge variant={item.inStock ? "default" : "destructive"} className="text-xs">
                          {item.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}