import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryCard } from "@/components/CategoryCard";
import { ArrowLeft } from "lucide-react";

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
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState(GAMES);
  
  const game = gameId ? gameData[gameId as keyof typeof gameData] : null;

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-gradient-card border-destructive/20">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Game Not Found</h1>
            <p className="text-muted-foreground mb-4">The game you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/")} variant="outline">
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
            onClick={() => navigate("/")} 
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {game.categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              gameId={gameId!}
              onClick={() => navigate(`/game/${gameId}/category/${category.id}`)}
              onUpdateCategory={(categoryId, updates) => {
                setGameData(prev => ({
                  ...prev,
                  [gameId!]: {
                    ...prev[gameId! as keyof typeof prev],
                    categories: prev[gameId! as keyof typeof prev].categories.map(cat =>
                      cat.id === categoryId ? { ...cat, ...updates } : cat
                    )
                  }
                }));
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}