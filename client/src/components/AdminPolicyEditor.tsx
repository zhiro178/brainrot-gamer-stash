import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Plus, Trash2, Edit, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface PolicySection {
  id: string;
  title: string;
  content: string;
  bullets?: string[];
}

interface PolicyContent {
  sections: PolicySection[];
}

interface AdminPolicyEditorProps {
  policyType: 'privacy_policy' | 'terms_of_service';
  currentTitle: string;
  currentContent: PolicyContent;
  onContentUpdate: (title: string, content: PolicyContent) => void;
}

export function AdminPolicyEditor({ 
  policyType, 
  currentTitle, 
  currentContent, 
  onContentUpdate 
}: AdminPolicyEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [content, setContent] = useState<PolicyContent>(currentContent);
  const [loading, setLoading] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset state when props change
  useEffect(() => {
    setTitle(currentTitle);
    setContent(currentContent);
  }, [currentTitle, currentContent]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('policy_content')
        .update({
          title: title,
          content: content,
          updated_at: new Date().toISOString()
        })
        .eq('policy_type', policyType);

      if (error) throw error;

      onContentUpdate(title, content);
      setIsOpen(false);
      
      toast({
        title: "Policy Updated",
        description: `${policyType === 'privacy_policy' ? 'Privacy Policy' : 'Terms of Service'} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating policy:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update policy content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSection = () => {
    const newSection: PolicySection = {
      id: `section_${Date.now()}`,
      title: "New Section",
      content: "Enter section content here...",
      bullets: []
    };
    
    setContent(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (sectionId: string, updates: Partial<PolicySection>) => {
    setContent(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const deleteSection = (sectionId: string) => {
    setContent(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const addBullet = (sectionId: string) => {
    updateSection(sectionId, {
      bullets: [...(content.sections.find(s => s.id === sectionId)?.bullets || []), "New bullet point"]
    });
  };

  const updateBullet = (sectionId: string, bulletIndex: number, value: string) => {
    const section = content.sections.find(s => s.id === sectionId);
    if (!section?.bullets) return;
    
    const newBullets = [...section.bullets];
    newBullets[bulletIndex] = value;
    updateSection(sectionId, { bullets: newBullets });
  };

  const deleteBullet = (sectionId: string, bulletIndex: number) => {
    const section = content.sections.find(s => s.id === sectionId);
    if (!section?.bullets) return;
    
    const newBullets = section.bullets.filter((_, index) => index !== bulletIndex);
    updateSection(sectionId, { bullets: newBullets });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Edit {policyType === 'privacy_policy' ? 'Privacy Policy' : 'Terms of Service'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {policyType === 'privacy_policy' ? 'Privacy Policy' : 'Terms of Service'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Title Editor */}
          <div className="space-y-2">
            <Label htmlFor="policy-title">Policy Title</Label>
            <Input
              id="policy-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter policy title"
            />
          </div>
          
          {/* Sections Editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Policy Sections</h3>
              <Button onClick={addSection} size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Section
              </Button>
            </div>
            
            <div className="space-y-4">
              {content.sections.map((section, index) => (
                <Card key={section.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          placeholder="Section title"
                          className="font-medium"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteSection(section.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {editingSection === section.id && (
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Section Content</Label>
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(section.id, { content: e.target.value })}
                          placeholder="Enter section content"
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Bullet Points</Label>
                          <Button
                            onClick={() => addBullet(section.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {section.bullets?.map((bullet, bulletIndex) => (
                          <div key={bulletIndex} className="flex items-center gap-2">
                            <Input
                              value={bullet}
                              onChange={(e) => updateBullet(section.id, bulletIndex, e.target.value)}
                              placeholder="Bullet point"
                              className="flex-1"
                            />
                            <Button
                              onClick={() => deleteBullet(section.id, bulletIndex)}
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}