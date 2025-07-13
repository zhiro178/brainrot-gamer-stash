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
    badges: Array<{
      id: string;
      text: string;
      color: string;
      emoji: string;
    }>;
    layout: {
      titlePosition: { x: number; y: number };
      subtitlePosition: { x: number; y: number };
      badgesPosition: { x: number; y: number };
      containerClass: string;
    };
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
    layout: {
      titlePosition: { x: number; y: number };
      subtitlePosition: { x: number; y: number };
      containerClass: string;
    };
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
    badges: [
      { id: "1", text: "Most Popular", color: "bg-gaming-success", emoji: "🎮" },
      { id: "2", text: "Guaranteed Items", color: "bg-gaming-accent", emoji: "📦" },
      { id: "3", text: "Secure Payments", color: "bg-gaming-warning", emoji: "💰" }
    ],
    layout: {
      titlePosition: { x: 50, y: 30 },
      subtitlePosition: { x: 50, y: 50 },
      badgesPosition: { x: 50, y: 70 },
      containerClass: "text-center"
    }
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
    ],
    layout: {
      titlePosition: { x: 50, y: 20 },
      subtitlePosition: { x: 50, y: 40 },
      containerClass: "text-center"
    }
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

  const updateHeroLayout = (field: string, value: any) => {
    setEditingContent({
      ...editingContent,
      hero: {
        ...editingContent.hero,
        layout: {
          ...editingContent.hero.layout,
          [field]: value
        }
      }
    });
  };

  const updateFeaturesLayout = (field: string, value: any) => {
    setEditingContent({
      ...editingContent,
      features: {
        ...editingContent.features,
        layout: {
          ...editingContent.features.layout,
          [field]: value
        }
      }
    });
  };

  const handleDragEnd = (section: 'hero' | 'features', element: string, e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const container = e.currentTarget.parentElement?.getBoundingClientRect();
    
    if (container) {
      const x = Math.round(((e.clientX - container.left) / container.width) * 100);
      const y = Math.round(((e.clientY - container.top) / container.height) * 100);
      
      if (section === 'hero') {
        updateHeroLayout(`${element}Position`, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
      } else {
        updateFeaturesLayout(`${element}Position`, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
      }
    }
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="features">Features Section</TabsTrigger>
            <TabsTrigger value="layout">Layout & Positioning</TabsTrigger>
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
                          className="px-2 py-1 border rounded"
                        >
                          <option value="bg-gaming-success">Green</option>
                          <option value="bg-gaming-accent">Blue</option>
                          <option value="bg-gaming-warning">Yellow</option>
                          <option value="bg-gaming-primary">Purple</option>
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
          
          <TabsContent value="layout" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Layout & Positioning</CardTitle>
                <CardDescription>Drag elements or use sliders to position them anywhere on the page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hero Section Layout */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Hero Section Layout</h3>
                  
                  {/* Preview Container */}
                  <div className="relative bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-dashed border-gray-300 rounded-lg h-64 mb-4 overflow-hidden">
                    <div className="text-xs text-gray-500 absolute top-2 left-2">Preview (drag to reposition)</div>
                    
                    {/* Draggable Title */}
                    <div
                      draggable
                      onDragEnd={(e) => handleDragEnd('hero', 'title', e)}
                      className="absolute cursor-move bg-white/90 border border-gray-300 rounded px-2 py-1 text-sm font-bold shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        left: `${editingContent.hero.layout.titlePosition.x}%`,
                        top: `${editingContent.hero.layout.titlePosition.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      📝 {editingContent.hero.title.substring(0, 20)}...
                    </div>
                    
                    {/* Draggable Subtitle */}
                    <div
                      draggable
                      onDragEnd={(e) => handleDragEnd('hero', 'subtitle', e)}
                      className="absolute cursor-move bg-white/90 border border-gray-300 rounded px-2 py-1 text-xs shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        left: `${editingContent.hero.layout.subtitlePosition.x}%`,
                        top: `${editingContent.hero.layout.subtitlePosition.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      📄 {editingContent.hero.subtitle.substring(0, 30)}...
                    </div>
                    
                    {/* Draggable Badges */}
                    <div
                      draggable
                      onDragEnd={(e) => handleDragEnd('hero', 'badges', e)}
                      className="absolute cursor-move bg-white/90 border border-gray-300 rounded px-2 py-1 text-xs shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        left: `${editingContent.hero.layout.badgesPosition.x}%`,
                        top: `${editingContent.hero.layout.badgesPosition.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      🏷️ Badges ({editingContent.hero.badges.length})
                    </div>
                  </div>
                  
                  {/* Position Controls */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Title Position</Label>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">X: {editingContent.hero.layout.titlePosition.x}%</Label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingContent.hero.layout.titlePosition.x}
                            onChange={(e) => updateHeroLayout('titlePosition', { 
                              ...editingContent.hero.layout.titlePosition, 
                              x: parseInt(e.target.value) 
                            })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y: {editingContent.hero.layout.titlePosition.y}%</Label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingContent.hero.layout.titlePosition.y}
                            onChange={(e) => updateHeroLayout('titlePosition', { 
                              ...editingContent.hero.layout.titlePosition, 
                              y: parseInt(e.target.value) 
                            })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Subtitle Position</Label>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">X: {editingContent.hero.layout.subtitlePosition.x}%</Label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingContent.hero.layout.subtitlePosition.x}
                            onChange={(e) => updateHeroLayout('subtitlePosition', { 
                              ...editingContent.hero.layout.subtitlePosition, 
                              x: parseInt(e.target.value) 
                            })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y: {editingContent.hero.layout.subtitlePosition.y}%</Label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingContent.hero.layout.subtitlePosition.y}
                            onChange={(e) => updateHeroLayout('subtitlePosition', { 
                              ...editingContent.hero.layout.subtitlePosition, 
                              y: parseInt(e.target.value) 
                            })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Badges Position</Label>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">X: {editingContent.hero.layout.badgesPosition.x}%</Label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingContent.hero.layout.badgesPosition.x}
                            onChange={(e) => updateHeroLayout('badgesPosition', { 
                              ...editingContent.hero.layout.badgesPosition, 
                              x: parseInt(e.target.value) 
                            })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y: {editingContent.hero.layout.badgesPosition.y}%</Label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingContent.hero.layout.badgesPosition.y}
                            onChange={(e) => updateHeroLayout('badgesPosition', { 
                              ...editingContent.hero.layout.badgesPosition, 
                              y: parseInt(e.target.value) 
                            })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Features Section Layout */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Features Section Layout</h3>
                  
                  <div className="relative bg-gradient-to-r from-blue-500/20 to-green-500/20 border-2 border-dashed border-gray-300 rounded-lg h-48 mb-4 overflow-hidden">
                    <div className="text-xs text-gray-500 absolute top-2 left-2">Preview (drag to reposition)</div>
                    
                    {/* Draggable Features Title */}
                    <div
                      draggable
                      onDragEnd={(e) => handleDragEnd('features', 'title', e)}
                      className="absolute cursor-move bg-white/90 border border-gray-300 rounded px-2 py-1 text-sm font-bold shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        left: `${editingContent.features.layout.titlePosition.x}%`,
                        top: `${editingContent.features.layout.titlePosition.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      🎯 {editingContent.features.title}
                    </div>
                    
                    {/* Draggable Features Subtitle */}
                    <div
                      draggable
                      onDragEnd={(e) => handleDragEnd('features', 'subtitle', e)}
                      className="absolute cursor-move bg-white/90 border border-gray-300 rounded px-2 py-1 text-xs shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        left: `${editingContent.features.layout.subtitlePosition.x}%`,
                        top: `${editingContent.features.layout.subtitlePosition.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      📝 {editingContent.features.subtitle}
                    </div>
                  </div>
                  
                  {/* Features Position Controls */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Title Position</Label>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">X: {editingContent.features.layout.titlePosition.x}%</Label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingContent.features.layout.titlePosition.x}
                            onChange={(e) => updateFeaturesLayout('titlePosition', { 
                              ...editingContent.features.layout.titlePosition, 
                              x: parseInt(e.target.value) 
                            })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y: {editingContent.features.layout.titlePosition.y}%</Label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingContent.features.layout.titlePosition.y}
                            onChange={(e) => updateFeaturesLayout('titlePosition', { 
                              ...editingContent.features.layout.titlePosition, 
                              y: parseInt(e.target.value) 
                            })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Subtitle Position</Label>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">X: {editingContent.features.layout.subtitlePosition.x}%</Label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingContent.features.layout.subtitlePosition.x}
                            onChange={(e) => updateFeaturesLayout('subtitlePosition', { 
                              ...editingContent.features.layout.subtitlePosition, 
                              x: parseInt(e.target.value) 
                            })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y: {editingContent.features.layout.subtitlePosition.y}%</Label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={editingContent.features.layout.subtitlePosition.y}
                            onChange={(e) => updateFeaturesLayout('subtitlePosition', { 
                              ...editingContent.features.layout.subtitlePosition, 
                              y: parseInt(e.target.value) 
                            })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Layout Presets */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Quick Layout Presets</Label>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        updateHeroLayout('titlePosition', { x: 50, y: 30 });
                        updateHeroLayout('subtitlePosition', { x: 50, y: 50 });
                        updateHeroLayout('badgesPosition', { x: 50, y: 70 });
                        updateFeaturesLayout('titlePosition', { x: 50, y: 20 });
                        updateFeaturesLayout('subtitlePosition', { x: 50, y: 40 });
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Center Layout
                    </Button>
                    <Button
                      onClick={() => {
                        updateHeroLayout('titlePosition', { x: 20, y: 30 });
                        updateHeroLayout('subtitlePosition', { x: 20, y: 50 });
                        updateHeroLayout('badgesPosition', { x: 20, y: 70 });
                        updateFeaturesLayout('titlePosition', { x: 20, y: 20 });
                        updateFeaturesLayout('subtitlePosition', { x: 20, y: 40 });
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Left Layout
                    </Button>
                    <Button
                      onClick={() => {
                        updateHeroLayout('titlePosition', { x: 80, y: 30 });
                        updateHeroLayout('subtitlePosition', { x: 80, y: 50 });
                        updateHeroLayout('badgesPosition', { x: 80, y: 70 });
                        updateFeaturesLayout('titlePosition', { x: 80, y: 20 });
                        updateFeaturesLayout('subtitlePosition', { x: 80, y: 40 });
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Right Layout
                    </Button>
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