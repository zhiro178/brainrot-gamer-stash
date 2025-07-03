import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  
  const game = gameId ? GAMES[gameId as keyof typeof GAMES] : null;

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
            <Card 
              key={category.id}
              className="group hover:shadow-gaming transition-all duration-300 cursor-pointer bg-gradient-card border-primary/20"
              onClick={() => navigate(`/game/${gameId}/category/${category.id}`)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary group-hover:text-primary-glow transition-colors">
                    {category.name}
                  </CardTitle>
                  <Badge className="bg-gaming-accent text-black">
                    {category.itemCount} Items
                  </Badge>
                </div>
                <CardDescription className="text-muted-foreground">
                  {category.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Button 
                  className="w-full bg-gradient-primary hover:shadow-glow group-hover:scale-105 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/game/${gameId}/category/${category.id}`);
                  }}
                >
                  Browse {category.name} Items
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}