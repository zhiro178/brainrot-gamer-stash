import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { setupPoliciesTable, checkPoliciesSetup } from '@/lib/setupPolicies';

interface PolicySection {
  id: string;
  icon: string;
  title: string;
  content: {
    text: string;
    items?: string[];
    note?: string;
    warning?: { type: string; text: string };
    info?: { type: string; text: string };
    tip?: { type: string; text: string };
    security?: { type: string; text: string };
  };
}

interface PolicyData {
  sections: PolicySection[];
  footer?: { text: string };
  effective_date?: { title: string; content: string[] };
}

interface Policy {
  id: number;
  policy_type: string;
  title: string;
  content: PolicyData;
  last_updated: string;
  updated_by: string;
}

export const AdminPolicyEditor: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [editingSection, setEditingSection] = useState<PolicySection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [settingUp, setSettingUp] = useState(false);
  const { toast } = useToast();

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      
      // First check if setup is needed
      const setupCheck = await checkPoliciesSetup();
      if (setupCheck.needsSetup) {
        setNeedsSetup(true);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('site_policies')
        .select('*')
        .order('policy_type');

      if (error) throw error;
      setPolicies(data || []);
      setNeedsSetup(false);
    } catch (error) {
      console.error('Error fetching policies:', error);
      setNeedsSetup(true);
      toast({
        title: "Setup Required",
        description: "Policies table needs to be initialized",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPolicies = async () => {
    try {
      setSettingUp(true);
      const result = await setupPoliciesTable();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Policies table initialized successfully",
        });
        setNeedsSetup(false);
        await fetchPolicies();
      } else {
        toast({
          title: "Setup Failed",
          description: "Failed to initialize policies table",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error setting up policies:', error);
      toast({
        title: "Setup Failed",
        description: "Failed to initialize policies table",
        variant: "destructive",
      });
    } finally {
      setSettingUp(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSavePolicy = async (policy: Policy) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('site_policies')
        .update({
          title: policy.title,
          content: policy.content,
          last_updated: new Date().toISOString(),
          updated_by: 'admin' // You might want to get the actual admin email
        })
        .eq('id', policy.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Policy updated successfully",
      });

      fetchPolicies();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving policy:', error);
      toast({
        title: "Error",
        description: "Failed to save policy",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = () => {
    if (!selectedPolicy) return;

    const newSection: PolicySection = {
      id: `section_${Date.now()}`,
      icon: '📄',
      title: 'New Section',
      content: {
        text: 'Section content goes here...',
        items: []
      }
    };

    const updatedPolicy = {
      ...selectedPolicy,
      content: {
        ...selectedPolicy.content,
        sections: [...selectedPolicy.content.sections, newSection]
      }
    };

    setSelectedPolicy(updatedPolicy);
    setEditingSection(newSection);
    setIsSectionDialogOpen(true);
  };

  const handleEditSection = (section: PolicySection) => {
    setEditingSection({ ...section });
    setIsSectionDialogOpen(true);
  };

  const handleSaveSection = () => {
    if (!selectedPolicy || !editingSection) return;

    const updatedSections = selectedPolicy.content.sections.map(section =>
      section.id === editingSection.id ? editingSection : section
    );

    setSelectedPolicy({
      ...selectedPolicy,
      content: {
        ...selectedPolicy.content,
        sections: updatedSections
      }
    });

    setIsSectionDialogOpen(false);
    setEditingSection(null);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!selectedPolicy) return;

    const updatedSections = selectedPolicy.content.sections.filter(
      section => section.id !== sectionId
    );

    setSelectedPolicy({
      ...selectedPolicy,
      content: {
        ...selectedPolicy.content,
        sections: updatedSections
      }
    });
  };

  const addListItem = () => {
    if (!editingSection) return;

    setEditingSection({
      ...editingSection,
      content: {
        ...editingSection.content,
        items: [...(editingSection.content.items || []), 'New item']
      }
    });
  };

  const updateListItem = (index: number, value: string) => {
    if (!editingSection) return;

    const updatedItems = [...(editingSection.content.items || [])];
    updatedItems[index] = value;

    setEditingSection({
      ...editingSection,
      content: {
        ...editingSection.content,
        items: updatedItems
      }
    });
  };

  const removeListItem = (index: number) => {
    if (!editingSection) return;

    const updatedItems = editingSection.content.items?.filter((_, i) => i !== index) || [];

    setEditingSection({
      ...editingSection,
      content: {
        ...editingSection.content,
        items: updatedItems
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="space-y-6">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Policy Editor Setup Required</h2>
          <p className="text-muted-foreground mb-6">
            The policies database table needs to be initialized with default content.
          </p>
          <Button 
            onClick={handleSetupPolicies}
            disabled={settingUp}
            className="bg-gradient-primary hover:shadow-glow"
          >
            {settingUp ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Setting up...
              </>
            ) : (
              'Initialize Policies Table'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Policy Editor</h2>
          <p className="text-muted-foreground">Manage site policies and terms</p>
        </div>
        <Button onClick={fetchPolicies} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {policies.map((policy) => (
          <Card key={policy.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {policy.title}
                    <Badge variant="secondary">
                      {policy.content.sections.length} sections
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Last updated: {new Date(policy.last_updated).toLocaleDateString()} by {policy.updated_by}
                  </CardDescription>
                </div>
                <Dialog open={isDialogOpen && selectedPolicy?.id === policy.id} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPolicy(policy)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Policy
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit {policy.title}</DialogTitle>
                      <DialogDescription>
                        Modify the sections and content of this policy
                      </DialogDescription>
                    </DialogHeader>

                    {selectedPolicy && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="policy-title">Policy Title</Label>
                          <Input
                            id="policy-title"
                            value={selectedPolicy.title}
                            onChange={(e) => setSelectedPolicy({
                              ...selectedPolicy,
                              title: e.target.value
                            })}
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Sections</h3>
                            <Button onClick={handleAddSection} size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Add Section
                            </Button>
                          </div>

                          {selectedPolicy.content.sections.map((section, index) => (
                            <Card key={section.id} className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{section.icon}</span>
                                  <span className="font-medium">{section.title}</span>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleEditSection(section)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteSection(section.id)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {section.content.text}
                              </p>
                              {section.content.items && section.content.items.length > 0 && (
                                <Badge variant="secondary" className="mt-2">
                                  {section.content.items.length} items
                                </Badge>
                              )}
                            </Card>
                          ))}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                          <Button
                            onClick={() => setIsDialogOpen(false)}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => handleSavePolicy(selectedPolicy)}
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Policy
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Section Editor Dialog */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>
              Modify the section content and properties
            </DialogDescription>
          </DialogHeader>

          {editingSection && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="section-icon">Icon</Label>
                  <Input
                    id="section-icon"
                    value={editingSection.icon}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      icon: e.target.value
                    })}
                    placeholder="📄"
                  />
                </div>
                <div>
                  <Label htmlFor="section-title">Title</Label>
                  <Input
                    id="section-title"
                    value={editingSection.title}
                    onChange={(e) => setEditingSection({
                      ...editingSection,
                      title: e.target.value
                    })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="section-text">Main Text</Label>
                <Textarea
                  id="section-text"
                  value={editingSection.content.text}
                  onChange={(e) => setEditingSection({
                    ...editingSection,
                    content: {
                      ...editingSection.content,
                      text: e.target.value
                    }
                  })}
                  rows={3}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>List Items</Label>
                  <Button onClick={addListItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
                <div className="space-y-2">
                  {editingSection.content.items?.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => updateListItem(index, e.target.value)}
                        placeholder="List item"
                      />
                      <Button
                        onClick={() => removeListItem(index)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="section-note">Note (optional)</Label>
                <Textarea
                  id="section-note"
                  value={editingSection.content.note || ''}
                  onChange={(e) => setEditingSection({
                    ...editingSection,
                    content: {
                      ...editingSection.content,
                      note: e.target.value || undefined
                    }
                  })}
                  rows={2}
                  placeholder="Additional note for this section"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  onClick={() => setIsSectionDialogOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveSection}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Section
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};