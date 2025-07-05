import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Trash2, Edit, Upload, Download, Star, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GameItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  imageUrl: string;
  inStock: boolean;
  stockCount: number;
  tags: string[];
}

interface GameCatalog {
  [gameId: string]: {
    name: string;
    categories: string[];
    items: GameItem[];
  };
}

interface AdminCatalogEditorProps {
  games: Array<{
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    itemCount: number;
  }>;
}

const DEFAULT_CATALOG: GameCatalog = {
  'adopt-me': {
    name: 'Adopt Me',
    categories: ['Pets', 'Eggs', 'Vehicles', 'Toys', 'Food', 'Furniture'],
    items: [
      {
        id: '1',
        name: 'Shadow Dragon',
        description: 'Legendary pet from Halloween 2019',
        price: 25.99,
        category: 'Pets',
        rarity: 'legendary',
        imageUrl: '/api/placeholder/150/150',
        inStock: true,
        stockCount: 5,
        tags: ['legendary', 'dragon', 'halloween']
      },
      {
        id: '2',
        name: 'Frost Dragon',
        description: 'Legendary pet from Christmas 2019',
        price: 22.99,
        category: 'Pets',
        rarity: 'legendary',
        imageUrl: '/api/placeholder/150/150',
        inStock: true,
        stockCount: 3,
        tags: ['legendary', 'dragon', 'christmas']
      }
    ]
  },
  'grow-garden': {
    name: 'Grow a Garden',
    categories: ['Seeds', 'Tools', 'Decorations', 'Fertilizers'],
    items: [
      {
        id: '1',
        name: 'Rainbow Seeds',
        description: 'Magical seeds that grow rainbow flowers',
        price: 5.99,
        category: 'Seeds',
        rarity: 'rare',
        imageUrl: '/api/placeholder/150/150',
        inStock: true,
        stockCount: 20,
        tags: ['rainbow', 'magical', 'flowers']
      }
    ]
  },
  'mm2': {
    name: 'MM2 (Murder Mystery 2)',
    categories: ['Knives', 'Guns', 'Pets', 'Boxes'],
    items: [
      {
        id: '1',
        name: 'Chroma Lightbringer',
        description: 'Legendary chroma knife',
        price: 45.99,
        category: 'Knives',
        rarity: 'legendary',
        imageUrl: '/api/placeholder/150/150',
        inStock: true,
        stockCount: 2,
        tags: ['chroma', 'legendary', 'knife']
      }
    ]
  },
  'steal-brainrot': {
    name: 'Steal a Brainrot',
    categories: ['Items', 'Collectibles', 'Upgrades'],
    items: [
      {
        id: '1',
        name: 'Sigma Aura',
        description: 'Ultimate brainrot collectible',
        price: 12.99,
        category: 'Collectibles',
        rarity: 'epic',
        imageUrl: '/api/placeholder/150/150',
        inStock: true,
        stockCount: 10,
        tags: ['sigma', 'aura', 'brainrot']
      }
    ]
  }
};

export const AdminCatalogEditor: React.FC<AdminCatalogEditorProps> = ({ games }) => {
  const [catalog, setCatalog] = useState<GameCatalog>(DEFAULT_CATALOG);
  const [selectedGame, setSelectedGame] = useState<string>('adopt-me');
  const [editingItem, setEditingItem] = useState<GameItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved catalog from localStorage
    const savedCatalog = localStorage.getItem('admin_catalog');
    if (savedCatalog) {
      try {
        setCatalog(JSON.parse(savedCatalog));
      } catch (error) {
        console.error('Error loading saved catalog:', error);
        setCatalog(DEFAULT_CATALOG);
      }
    }
  }, []);

  const saveCatalog = () => {
    localStorage.setItem('admin_catalog', JSON.stringify(catalog));
    toast({
      title: "Catalog Saved",
      description: "Your catalog changes have been saved successfully!",
    });
  };

  const resetCatalog = () => {
    setCatalog(DEFAULT_CATALOG);
    localStorage.removeItem('admin_catalog');
    toast({
      title: "Catalog Reset",
      description: "Catalog has been reset to default.",
    });
  };

  const exportCatalog = () => {
    const dataStr = JSON.stringify(catalog, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'catalog.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importCatalog = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedCatalog = JSON.parse(e.target?.result as string);
          setCatalog(importedCatalog);
          saveCatalog();
          toast({
            title: "Catalog Imported",
            description: "Catalog has been imported successfully!",
          });
        } catch (error) {
          toast({
            title: "Import Failed",
            description: "Failed to import catalog. Please check the file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const addCategory = (gameId: string) => {
    const categoryName = prompt("Enter category name:");
    if (categoryName && !catalog[gameId]?.categories.includes(categoryName)) {
      setCatalog({
        ...catalog,
        [gameId]: {
          ...catalog[gameId],
          categories: [...catalog[gameId].categories, categoryName]
        }
      });
    }
  };

  const removeCategory = (gameId: string, category: string) => {
    setCatalog({
      ...catalog,
      [gameId]: {
        ...catalog[gameId],
        categories: catalog[gameId].categories.filter(cat => cat !== category),
        items: catalog[gameId].items.filter(item => item.category !== category)
      }
    });
  };

  const addItem = () => {
    const newItem: GameItem = {
      id: Date.now().toString(),
      name: 'New Item',
      description: 'Item description',
      price: 0,
      category: catalog[selectedGame]?.categories[0] || 'Items',
      rarity: 'common',
      imageUrl: '/api/placeholder/150/150',
      inStock: true,
      stockCount: 0,
      tags: []
    };
    setEditingItem(newItem);
    setIsItemDialogOpen(true);
  };

  const editItem = (item: GameItem) => {
    setEditingItem({ ...item });
    setIsItemDialogOpen(true);
  };

  const saveItem = () => {
    if (!editingItem) return;

    const gameItems = catalog[selectedGame]?.items || [];
    const existingIndex = gameItems.findIndex(item => item.id === editingItem.id);
    
    let updatedItems;
    if (existingIndex >= 0) {
      updatedItems = [...gameItems];
      updatedItems[existingIndex] = editingItem;
    } else {
      updatedItems = [...gameItems, editingItem];
    }

    setCatalog({
      ...catalog,
      [selectedGame]: {
        ...catalog[selectedGame],
        items: updatedItems
      }
    });

    setEditingItem(null);
    setIsItemDialogOpen(false);
    toast({
      title: "Item Saved",
      description: `${editingItem.name} has been saved successfully!`,
    });
  };

  const deleteItem = (itemId: string) => {
    setCatalog({
      ...catalog,
      [selectedGame]: {
        ...catalog[selectedGame],
        items: catalog[selectedGame].items.filter(item => item.id !== itemId)
      }
    });
    toast({
      title: "Item Deleted",
      description: "Item has been removed from the catalog.",
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'bg-yellow-500';
      case 'epic': return 'bg-purple-500';
      case 'rare': return 'bg-blue-500';
      case 'uncommon': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const currentGameItems = catalog[selectedGame]?.items || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Package className="h-4 w-4 mr-2" />
            Edit Catalog
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Admin Catalog Editor</DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Label>Game:</Label>
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {games.map(game => (
                    <SelectItem key={game.id} value={game.id}>
                      {game.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".json"
                onChange={importCatalog}
                className="hidden"
                id="import-catalog"
              />
              <Button
                onClick={() => document.getElementById('import-catalog')?.click()}
                variant="outline"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button onClick={exportCatalog} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={resetCatalog} variant="outline" size="sm">
                Reset
              </Button>
              <Button onClick={saveCatalog} size="sm">
                Save All
              </Button>
            </div>
          </div>

          <Tabs defaultValue="items" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            
            <TabsContent value="items" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {catalog[selectedGame]?.name || 'Game'} Items ({currentGameItems.length})
                </h3>
                <Button onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentGameItems.map((item) => (
                  <Card key={item.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge className={`${getRarityColor(item.rarity)} text-white`}>
                          {item.rarity}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Button
                            onClick={() => editItem(item)}
                            size="sm"
                            variant="ghost"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => deleteItem(item.id)}
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-sm">{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                      <p className="text-xs text-muted-foreground mb-2">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold">${item.price}</span>
                        <span className={`px-2 py-1 rounded ${item.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {item.inStock ? `${item.stockCount} in stock` : 'Out of stock'}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="categories" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {catalog[selectedGame]?.name || 'Game'} Categories
                </h3>
                <Button onClick={() => addCategory(selectedGame)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(catalog[selectedGame]?.categories || []).map((category) => (
                  <Card key={category}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category}</span>
                        <Button
                          onClick={() => removeCategory(selectedGame, category)}
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {currentGameItems.filter(item => item.category === category).length} items
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Item Editor Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.id && catalog[selectedGame]?.items.find(item => item.id === editingItem.id) 
                ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>
          
          {editingItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item-name">Name</Label>
                  <Input
                    id="item-name"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="item-price">Price ($)</Label>
                  <Input
                    id="item-price"
                    type="number"
                    step="0.01"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="item-description">Description</Label>
                <Textarea
                  id="item-description"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item-category">Category</Label>
                  <Select
                    value={editingItem.category}
                    onValueChange={(value) => setEditingItem({...editingItem, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(catalog[selectedGame]?.categories || []).map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="item-rarity">Rarity</Label>
                  <Select
                    value={editingItem.rarity}
                    onValueChange={(value: any) => setEditingItem({...editingItem, rarity: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item-stock">Stock Count</Label>
                  <Input
                    id="item-stock"
                    type="number"
                    value={editingItem.stockCount}
                    onChange={(e) => setEditingItem({...editingItem, stockCount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="item-instock"
                    checked={editingItem.inStock}
                    onChange={(e) => setEditingItem({...editingItem, inStock: e.target.checked})}
                  />
                  <Label htmlFor="item-instock">In Stock</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="item-image">Image URL</Label>
                <Input
                  id="item-image"
                  value={editingItem.imageUrl}
                  onChange={(e) => setEditingItem({...editingItem, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div>
                <Label htmlFor="item-tags">Tags (comma-separated)</Label>
                <Input
                  id="item-tags"
                  value={editingItem.tags.join(', ')}
                  onChange={(e) => setEditingItem({...editingItem, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
                  placeholder="legendary, dragon, rare"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button onClick={() => setIsItemDialogOpen(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={saveItem}>
                  Save Item
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};