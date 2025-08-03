import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HomepageContent {
  hero: {
    title: string;
    subtitle: string;
    titleColor: string;
    badges: Array<{
      id: string;
      text: string;
      color: string;
      emoji: string;
    }>;
  };
  features: {
    title: string;
    subtitle: string;
    items: Array<{
      id: string;
      emoji: string;
      title: string;
      description: string;
    }>;
  };
}

interface AdminHomepageEditorProps {
  content: HomepageContent;
  onContentUpdate: (content: HomepageContent) => void;
}

const DEFAULT_CONTENT: HomepageContent = {
  hero: {
    title: "Welcome to 592 Stock",
    subtitle: "Your ultimate destination for gaming items across Adopt Me, Grow a Garden, MM2, and Steal a Brainrot",
    titleColor: "bg-gradient-primary bg-clip-text text-transparent",
    badges: [
      { id: "1", text: "Most Popular", color: "bg-gaming-success", emoji: "🎮" },
      { id: "2", text: "Guaranteed Items", color: "bg-gaming-accent", emoji: "📦" },
      { id: "3", text: "Secure Payments", color: "bg-gaming-warning", emoji: "💰" }
    ]
  },
  features: {
    title: "Why Choose 592 Stock?",
    subtitle: "The most trusted gaming marketplace",
    items: [
      {
        id: "1",
        emoji: "🔒",
        title: "Secure Payments",
        description: "Multiple payment options including crypto and gift cards with secure processing"
      },
      {
        id: "2",
        emoji: "⚡",
        title: "Instant Delivery",
        description: "Get your gaming items delivered instantly after successful payment"
      },
      {
        id: "3",
        emoji: "💬",
        title: "24/7 Support",
        description: "Our AI-powered support mascot is always here to help with your questions"
      }
    ]
  }
};

export const AdminHomepageEditor: React.FC<AdminHomepageEditorProps> = ({
  content,
  onContentUpdate
}) => {
  const [editingContent, setEditingContent] = useState<HomepageContent>(content);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditingContent(content);
  }, [content]);

  const handleSave = () => {
    onContentUpdate(editingContent);
    localStorage.setItem('admin_homepage_content', JSON.stringify(editingContent));
    setIsOpen(false);
    toast({
      title: "Homepage Updated",
      description: "Your homepage content has been saved successfully!",
    });
  };

  const handleReset = () => {
    setEditingContent(DEFAULT_CONTENT);
    onContentUpdate(DEFAULT_CONTENT);
    localStorage.removeItem('admin_homepage_content');
    toast({
      title: "Homepage Reset",
      description: "Homepage content has been reset to default.",
    });
  };

  const addBadge = () => {
    const newBadge = {
      id: Date.now().toString(),
      text: "New Badge",
      color: "bg-gaming-primary",
      emoji: "✨"
    };
    setEditingContent({
      ...editingContent,
      hero: {
        ...editingContent.hero,
        badges: [...editingContent.hero.badges, newBadge]
      }
    });
  };

  const removeBadge = (badgeId: string) => {
    setEditingContent({
      ...editingContent,
      hero: {
        ...editingContent.hero,
        badges: editingContent.hero.badges.filter(badge => badge.id !== badgeId)
      }
    });
  };

  const updateBadge = (badgeId: string, field: string, value: string) => {
    setEditingContent({
      ...editingContent,
      hero: {
        ...editingContent.hero,
        badges: editingContent.hero.badges.map(badge =>
          badge.id === badgeId ? { ...badge, [field]: value } : badge
        )
      }
    });
  };

  const addFeature = () => {
    const newFeature = {
      id: Date.now().toString(),
      emoji: "🎯",
      title: "New Feature",
      description: "Feature description"
    };
    setEditingContent({
      ...editingContent,
      features: {
        ...editingContent.features,
        items: [...editingContent.features.items, newFeature]
      }
    });
  };

  const removeFeature = (featureId: string) => {
    setEditingContent({
      ...editingContent,
      features: {
        ...editingContent.features,
        items: editingContent.features.items.filter(feature => feature.id !== featureId)
      }
    });
  };

  const updateFeature = (featureId: string, field: string, value: string) => {
    setEditingContent({
      ...editingContent,
      features: {
        ...editingContent.features,
        items: editingContent.features.items.map(feature =>
          feature.id === featureId ? { ...feature, [field]: value } : feature
        )
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Edit Homepage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Homepage Content</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="hero" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="features">Features Section</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hero" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Edit the main hero section content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hero-title">Title</Label>
                  <Input
                    id="hero-title"
                    value={editingContent.hero.title}
                    onChange={(e) => setEditingContent({
                      ...editingContent,
                      hero: { ...editingContent.hero, title: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="hero-title-color">Title Color</Label>
                  <select
                    id="hero-title-color"
                    value={editingContent.hero.titleColor}
                    onChange={(e) => setEditingContent({
                      ...editingContent,
                      hero: { ...editingContent.hero, titleColor: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="bg-gradient-primary bg-clip-text text-transparent">Primary Gradient (Default)</option>
                    <option value="text-primary">Primary Color</option>
                    <option value="text-gaming-success">Success Green</option>
                    <option value="text-gaming-accent">Accent Blue</option>
                    <option value="text-gaming-warning">Warning Yellow</option>
                    <option value="text-gaming-danger">Danger Red</option>
                    <option value="text-gaming-orange">Orange</option>
                    <option value="text-white">White</option>
                    <option value="text-black">Black</option>
                    <option value="text-gray-500">Gray</option>
                    <option value="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Purple-Pink Gradient</option>
                    <option value="bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">Blue-Green Gradient</option>
                    <option value="bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">Red-Yellow Gradient</option>
                    <option value="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">Indigo-Purple Gradient</option>
                    <option value="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Green-Blue Gradient</option>
                    <option value="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Yellow-Orange Gradient</option>
                  </select>
                  <div className="mt-2 p-2 border rounded bg-muted/50">
                    <p className="text-sm text-muted-foreground">Preview:</p>
                    <h3 className={`text-2xl font-bold ${editingContent.hero.titleColor}`}>
                      {editingContent.hero.title || "Your Title"}
                    </h3>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="hero-subtitle">Subtitle</Label>
                  <Textarea
                    id="hero-subtitle"
                    value={editingContent.hero.subtitle}
                    onChange={(e) => setEditingContent({
                      ...editingContent,
                      hero: { ...editingContent.hero, subtitle: e.target.value }
                    })}
                    rows={3}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Badges</Label>
                    <Button onClick={addBadge} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Badge
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {editingContent.hero.badges.map((badge) => (
                      <div key={badge.id} className="flex items-center space-x-2 p-2 border rounded">
                        <Input
                          placeholder="Emoji"
                          value={badge.emoji}
                          onChange={(e) => updateBadge(badge.id, 'emoji', e.target.value)}
                          className="w-16"
                        />
                        <Input
                          placeholder="Text"
                          value={badge.text}
                          onChange={(e) => updateBadge(badge.id, 'text', e.target.value)}
                          className="flex-1"
                        />
                        <select
                          value={badge.color}
                          onChange={(e) => updateBadge(badge.id, 'color', e.target.value)}
                          className="px-2 py-1 border rounded text-black"
                        >
                          <option value="bg-gaming-success">Green</option>
                          <option value="bg-gaming-accent">Blue</option>
                          <option value="bg-gaming-warning">Yellow</option>
                          <option value="bg-gaming-primary">Purple</option>
                          <option value="bg-gaming-danger">Red</option>
                          <option value="bg-gaming-info">Light Blue</option>
                          <option value="bg-gaming-orange">Orange</option>
                          <option value="bg-gaming-black">Black</option>
                          <option value="bg-gaming-dark-gray">Dark Gray</option>
                          <option value="bg-gaming-charcoal">Charcoal</option>
                          <option value="bg-gaming-forest-green">Forest Green</option>
                          <option value="bg-gaming-midnight-blue">Midnight Blue</option>
                          <option value="bg-gaming-deep-emerald">Deep Emerald</option>
                          <option value="bg-gaming-prussian-blue">Prussian Blue</option>
                          <option value="bg-gaming-mint-green">Mint Green</option>
                          <option value="bg-gaming-lavender">Lavender</option>
                          <option value="bg-gaming-pale-yellow">Pale Yellow</option>
                          <option value="bg-gaming-powder-blue">Powder Blue</option>
                        </select>
                        <Button
                          onClick={() => removeBadge(badge.id)}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Features Section</CardTitle>
                <CardDescription>Edit the features section content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="features-title">Title</Label>
                  <Input
                    id="features-title"
                    value={editingContent.features.title}
                    onChange={(e) => setEditingContent({
                      ...editingContent,
                      features: { ...editingContent.features, title: e.target.value }
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="features-subtitle">Subtitle</Label>
                  <Input
                    id="features-subtitle"
                    value={editingContent.features.subtitle}
                    onChange={(e) => setEditingContent({
                      ...editingContent,
                      features: { ...editingContent.features, subtitle: e.target.value }
                    })}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Features</Label>
                    <Button onClick={addFeature} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feature
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {editingContent.features.items.map((feature) => (
                      <Card key={feature.id} className="p-4">
                        <div className="flex items-start space-x-2">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <Input
                                placeholder="Emoji"
                                value={feature.emoji}
                                onChange={(e) => updateFeature(feature.id, 'emoji', e.target.value)}
                                className="w-16"
                              />
                              <Input
                                placeholder="Title"
                                value={feature.title}
                                onChange={(e) => updateFeature(feature.id, 'title', e.target.value)}
                                className="flex-1"
                              />
                            </div>
                            <Textarea
                              placeholder="Description"
                              value={feature.description}
                              onChange={(e) => updateFeature(feature.id, 'description', e.target.value)}
                              rows={2}
                            />
                          </div>
                          <Button
                            onClick={() => removeFeature(feature.id)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-between pt-4">
          <Button onClick={handleReset} variant="outline">
            Reset to Default
          </Button>
          <div className="space-x-2">
            <Button onClick={() => setIsOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};