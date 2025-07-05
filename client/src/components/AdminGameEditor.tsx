import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Settings, Edit, Save, X, Upload, Eye, Trash2, Plus, RotateCcw } from "lucide-react";

interface GameData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  itemCount: number;
}

interface AdminGameEditorProps {
  games: GameData[];
  defaultGames: GameData[];
  onGamesUpdate: (games: GameData[]) => void;
}

export const AdminGameEditor = ({ games, defaultGames, onGamesUpdate }: AdminGameEditorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameData | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    itemCount: 0
  });
  const [newGame, setNewGame] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (editingGame) {
      setFormData({
        title: editingGame.title,
        description: editingGame.description,
        imageUrl: editingGame.imageUrl,
        itemCount: editingGame.itemCount
      });
      setPreviewUrl(editingGame.imageUrl);
    }
  }, [editingGame]);

  const handleSave = () => {
    if (!formData.title || !formData.description || !formData.imageUrl) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    let updatedGames = [...games];
    
    if (newGame) {
      // Add new game
      const newGameData: GameData = {
        id: formData.title.toLowerCase().replace(/\s+/g, '-'),
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        itemCount: formData.itemCount
      };
      updatedGames.push(newGameData);
      toast({
        title: "Game Added",
        description: `${formData.title} has been added successfully`,
      });
    } else if (editingGame) {
      // Update existing game
      updatedGames = updatedGames.map(game => 
        game.id === editingGame.id ? { ...game, ...formData } : game
      );
      toast({
        title: "Game Updated",
        description: `${formData.title} has been updated successfully`,
      });
    }

    // Save to localStorage for persistence
    localStorage.setItem('admin_games', JSON.stringify(updatedGames));
    
    onGamesUpdate(updatedGames);
    setEditingGame(null);
    setNewGame(false);
    setFormData({ title: "", description: "", imageUrl: "", itemCount: 0 });
    setPreviewUrl("");
  };

  const handleDelete = (game: GameData) => {
    const updatedGames = games.filter(g => g.id !== game.id);
    localStorage.setItem('admin_games', JSON.stringify(updatedGames));
    onGamesUpdate(updatedGames);
    toast({
      title: "Game Deleted",
      description: `${game.title} has been removed`,
    });
  };

  const handleResetToDefaults = () => {
    localStorage.removeItem('admin_games');
    onGamesUpdate(defaultGames);
    setEditingGame(null);
    setNewGame(false);
    setFormData({ title: "", description: "", imageUrl: "", itemCount: 0 });
    setPreviewUrl("");
    toast({
      title: "Reset Complete",
      description: "Games have been reset to default configuration",
    });
  };

  const handleCancel = () => {
    setEditingGame(null);
    setNewGame(false);
    setFormData({ title: "", description: "", imageUrl: "", itemCount: 0 });
    setPreviewUrl("");
  };

  const handleImagePreview = () => {
    if (formData.imageUrl) {
      setPreviewUrl(formData.imageUrl);
    }
  };

  const startEdit = (game: GameData) => {
    setEditingGame(game);
    setNewGame(false);
  };

  const startNew = () => {
    setEditingGame(null);
    setNewGame(true);
    setFormData({ title: "", description: "", imageUrl: "", itemCount: 0 });
    setPreviewUrl("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-gaming-warning text-black hover:bg-gaming-warning/80 border-gaming-warning"
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Games
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl max-h-[90vh] bg-gradient-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Game Management System
          </DialogTitle>
          {JSON.stringify(games) !== JSON.stringify(defaultGames) && (
            <Badge variant="secondary" className="bg-gaming-warning text-black w-fit">
              ⚠️ Modified from defaults
            </Badge>
          )}
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Game List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary">Current Games</h3>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleResetToDefaults}
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                <Button 
                  onClick={startNew}
                  size="sm"
                  className="bg-gaming-success hover:bg-gaming-success/80"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {games.map((game) => (
                  <Card key={game.id} className="bg-background border-primary/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={game.imageUrl} 
                            alt={game.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <CardTitle className="text-sm text-primary">{game.title}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {game.itemCount} items
                            </Badge>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(game)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(game)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-xs line-clamp-2">
                        {game.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Edit Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">
              {newGame ? "Add New Game" : editingGame ? "Edit Game" : "Select a game to edit"}
            </h3>
            
            {(editingGame || newGame) && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-primary">Game Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter game title"
                    className="bg-background border-primary/20"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-primary">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter game description"
                    className="bg-background border-primary/20 min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="imageUrl" className="text-primary">Image URL *</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      placeholder="Enter image URL"
                      className="bg-background border-primary/20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleImagePreview}
                      className="px-3"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  {previewUrl && (
                    <div className="mt-2">
                      <img 
                        src={previewUrl} 
                        alt="Preview"
                        className="w-32 h-20 object-cover rounded border-2 border-primary/20"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="itemCount" className="text-primary">Item Count</Label>
                  <Input
                    id="itemCount"
                    type="number"
                    value={formData.itemCount}
                    onChange={(e) => setFormData({...formData, itemCount: parseInt(e.target.value) || 0})}
                    placeholder="Enter number of items"
                    className="bg-background border-primary/20"
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button 
                    onClick={handleSave}
                    className="bg-gaming-success hover:bg-gaming-success/80"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {newGame ? "Add Game" : "Save Changes"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};