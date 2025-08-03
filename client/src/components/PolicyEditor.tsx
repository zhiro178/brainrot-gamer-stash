import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { simpleSupabase as workingSupabase } from '@/lib/simple-supabase';
import { Edit2, Plus, Trash2, Save, Eye, FileText } from 'lucide-react';

interface PolicySection {
  id: string;
  emoji: string;
  title: string;
  content: string;
  items?: string[];
  note?: string;
  noteType?: 'info' | 'warning' | 'success';
}

interface PolicyData {
  id?: number;
  policy_type: 'privacy-policy' | 'terms-of-service';
  title: string;
  subtitle: string;
  content: PolicySection[];
  updated_at?: string;
  updated_by?: string;
}

export const PolicyEditor: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyData[]>([]);
  const [currentPolicy, setCurrentPolicy] = useState<PolicyData | null>(null);
  const [editingSection, setEditingSection] = useState<PolicySection | null>(null);
  const [newSectionItems, setNewSectionItems] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'privacy-policy' | 'terms-of-service'>('privacy-policy');
  const { toast } = useToast();

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const { data, error } = await workingSupabase
        .from('policy_content')
        .select('*')
        .order('policy_type');

      if (error) {
        console.error('Error fetching policies:', error);
        toast({
          title: "Error",
          description: "Failed to load policies",
          variant: "destructive"
        });
        return;
      }

      setPolicies(data || []);
    } catch (err) {
      console.error('Error loading policies:', err);
      toast({
        title: "Error",
        description: "Failed to load policies",
        variant: "destructive"
      });
    }
  };

  const savePolicy = async (policyData: PolicyData) => {
    setLoading(true);
    try {
      const { data: { user } } = await workingSupabase.auth.getUser();
      
      const updateData = {
        ...policyData,
        updated_by: user?.email || 'Unknown Admin'
      };

      const { error } = await workingSupabase
        .from('policy_content')
        .upsert(updateData, { 
          onConflict: 'policy_type',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error saving policy:', error);
        toast({
          title: "Error",
          description: "Failed to save policy",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Policy saved successfully",
        variant: "default"
      });

      fetchPolicies();
    } catch (err) {
      console.error('Error saving policy:', err);
      toast({
        title: "Error",
        description: "Failed to save policy",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPolicy = () => {
    return policies.find(p => p.policy_type === activeTab) || {
      policy_type: activeTab,
      title: activeTab === 'privacy-policy' ? 'Privacy Policy' : 'Terms of Service',
      subtitle: activeTab === 'privacy-policy' 
        ? 'Your privacy is important to us. Learn how we collect, use, and protect your information.'
        : 'Please read these terms carefully before using 592 Stock',
      content: []
    };
  };

  const updatePolicyMetadata = (field: 'title' | 'subtitle', value: string) => {
    const policy = getCurrentPolicy();
    const updatedPolicy = { ...policy, [field]: value };
    savePolicy(updatedPolicy);
  };

  const addNewSection = () => {
    const newSection: PolicySection = {
      id: `section-${Date.now()}`,
      emoji: '📄',
      title: 'New Section',
      content: 'Section content goes here...',
      items: []
    };

    const policy = getCurrentPolicy();
    const updatedPolicy = {
      ...policy,
      content: [...policy.content, newSection]
    };
    
    savePolicy(updatedPolicy);
  };

  const updateSection = (sectionId: string, updatedSection: PolicySection) => {
    const policy = getCurrentPolicy();
    const updatedContent = policy.content.map(section => 
      section.id === sectionId ? updatedSection : section
    );
    
    const updatedPolicy = {
      ...policy,
      content: updatedContent
    };
    
    savePolicy(updatedPolicy);
    setEditingSection(null);
  };

  const deleteSection = (sectionId: string) => {
    const policy = getCurrentPolicy();
    const updatedContent = policy.content.filter(section => section.id !== sectionId);
    
    const updatedPolicy = {
      ...policy,
      content: updatedContent
    };
    
    savePolicy(updatedPolicy);
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...newSectionItems];
    newItems[index] = value;
    setNewSectionItems(newItems);
  };

  const addNewItem = () => {
    setNewSectionItems([...newSectionItems, '']);
  };

  const removeItem = (index: number) => {
    const newItems = newSectionItems.filter((_, i) => i !== index);
    setNewSectionItems(newItems);
  };

  const openSectionEditor = (section: PolicySection) => {
    setEditingSection(section);
    setNewSectionItems(section.items || ['']);
  };

  const saveSectionChanges = () => {
    if (!editingSection) return;
    
    const filteredItems = newSectionItems.filter(item => item.trim() !== '');
    const updatedSection = {
      ...editingSection,
      items: filteredItems.length > 0 ? filteredItems : undefined
    };
    
    updateSection(editingSection.id, updatedSection);
  };

  const currentPolicyData = getCurrentPolicy();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Policy Content Manager
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Edit privacy policy and terms of service content. Changes are saved automatically and will be visible to users immediately.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="privacy-policy">Privacy Policy</TabsTrigger>
              <TabsTrigger value="terms-of-service">Terms of Service</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6 mt-6">
              {/* Policy Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Page Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="policy-title">Title</Label>
                    <Input
                      id="policy-title"
                      value={currentPolicyData.title}
                      onChange={(e) => updatePolicyMetadata('title', e.target.value)}
                      placeholder="Policy title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="policy-subtitle">Subtitle</Label>
                    <Textarea
                      id="policy-subtitle"
                      value={currentPolicyData.subtitle}
                      onChange={(e) => updatePolicyMetadata('subtitle', e.target.value)}
                      placeholder="Policy subtitle/description"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sections List */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Content Sections</CardTitle>
                  <Button onClick={addNewSection} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {currentPolicyData.content.map((section, index) => (
                      <Card key={section.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold flex items-center gap-2">
                                {section.emoji} {section.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {section.content.substring(0, 100)}
                                {section.content.length > 100 && '...'}
                              </p>
                              {section.items && section.items.length > 0 && (
                                <Badge variant="outline" className="mt-2">
                                  {section.items.length} items
                                </Badge>
                              )}
                              {section.note && (
                                <Badge variant="secondary" className="mt-2 ml-2">
                                  Has note
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => openSectionEditor(section)}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Edit Section: {section.title}</DialogTitle>
                                    <DialogDescription>
                                      Modify the section content, items, and styling.
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  {editingSection && (
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label htmlFor="section-emoji">Emoji</Label>
                                          <Input
                                            id="section-emoji"
                                            value={editingSection.emoji}
                                            onChange={(e) => setEditingSection({...editingSection, emoji: e.target.value})}
                                            placeholder="📄"
                                          />
                                        </div>
                                        <div>
                                          <Label htmlFor="section-title">Title</Label>
                                          <Input
                                            id="section-title"
                                            value={editingSection.title}
                                            onChange={(e) => setEditingSection({...editingSection, title: e.target.value})}
                                            placeholder="Section title"
                                          />
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <Label htmlFor="section-content">Content</Label>
                                        <Textarea
                                          id="section-content"
                                          value={editingSection.content}
                                          onChange={(e) => setEditingSection({...editingSection, content: e.target.value})}
                                          placeholder="Section content"
                                          rows={3}
                                        />
                                      </div>

                                      <div>
                                        <Label>List Items (optional)</Label>
                                        <div className="space-y-2 mt-2">
                                          {newSectionItems.map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                              <Input
                                                value={item}
                                                onChange={(e) => handleItemChange(index, e.target.value)}
                                                placeholder={`Item ${index + 1}`}
                                              />
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeItem(index)}
                                                disabled={newSectionItems.length === 1}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          ))}
                                          <Button type="button" variant="outline" size="sm" onClick={addNewItem}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Item
                                          </Button>
                                        </div>
                                      </div>

                                      <div>
                                        <Label htmlFor="section-note">Note (optional)</Label>
                                        <Textarea
                                          id="section-note"
                                          value={editingSection.note || ''}
                                          onChange={(e) => setEditingSection({...editingSection, note: e.target.value})}
                                          placeholder="Optional note or highlight"
                                          rows={2}
                                        />
                                      </div>

                                      <div>
                                        <Label htmlFor="note-type">Note Type</Label>
                                        <Select
                                          value={editingSection.noteType || 'info'}
                                          onValueChange={(value) => setEditingSection({...editingSection, noteType: value as any})}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select note type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="info">Info (Blue)</SelectItem>
                                            <SelectItem value="warning">Warning (Red)</SelectItem>
                                            <SelectItem value="success">Success (Green)</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="flex justify-end gap-2">
                                        <Button variant="outline" onClick={() => setEditingSection(null)}>
                                          Cancel
                                        </Button>
                                        <Button onClick={saveSectionChanges} disabled={loading}>
                                          <Save className="h-4 w-4 mr-2" />
                                          Save Changes
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteSection(section.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Preview Link */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Preview Changes</h4>
                      <p className="text-sm text-muted-foreground">
                        View how the policy looks to users
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const url = activeTab === 'privacy-policy' ? '/privacy-policy' : '/terms-of-service';
                        window.open(url, '_blank');
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};