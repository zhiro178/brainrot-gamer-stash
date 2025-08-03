import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { 
  Move, 
  GripVertical, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Layout
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SectionItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  visible: boolean;
  component: string;
}

interface AdminSectionManagerProps {
  sections: SectionItem[];
  onSectionsUpdate: (sections: SectionItem[]) => void;
}

const DEFAULT_SECTIONS: SectionItem[] = [
  {
    id: 'email-verification',
    name: 'Email Verification Alert',
    description: 'Shows email verification notice when needed',
    icon: '📧',
    visible: true,
    component: 'EmailVerificationAlert'
  },
  {
    id: 'hero',
    name: 'Hero Section',
    description: 'Main welcome section with title and badges',
    icon: '🏠',
    visible: true,
    component: 'HeroSection'
  },
  {
    id: 'games',
    name: 'Games Section',
    description: 'Browse available games and categories',
    icon: '🎮',
    visible: true,
    component: 'GamesSection'
  },
  {
    id: 'features',
    name: 'Features Section',
    description: 'Highlight platform features and benefits',
    icon: '⭐',
    visible: true,
    component: 'FeaturesSection'
  },
  {
    id: 'live-chat',
    name: 'Live Chat',
    description: 'Customer support chat widget',
    icon: '💬',
    visible: true,
    component: 'LiveChat'
  }
];

export const AdminSectionManager: React.FC<AdminSectionManagerProps> = ({
  sections,
  onSectionsUpdate
}) => {
  const [editingSections, setEditingSections] = useState<SectionItem[]>(sections);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditingSections(sections);
  }, [sections]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(editingSections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setEditingSections(items);
  };

  const toggleSectionVisibility = (sectionId: string) => {
    setEditingSections(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, visible: !section.visible }
          : section
      )
    );
  };

  const handleSave = () => {
    onSectionsUpdate(editingSections);
    localStorage.setItem('admin_section_order', JSON.stringify(editingSections));
    setIsOpen(false);
    toast({
      title: "Section Order Updated",
      description: "Your homepage section arrangement has been saved successfully!",
    });
  };

  const handleReset = () => {
    setEditingSections(DEFAULT_SECTIONS);
    onSectionsUpdate(DEFAULT_SECTIONS);
    localStorage.removeItem('admin_section_order');
    toast({
      title: "Section Order Reset",
      description: "Homepage sections have been reset to default order.",
    });
  };

  const getSectionStatusColor = (visible: boolean) => {
    return visible ? "bg-gaming-success" : "bg-gaming-danger";
  };

  const getSectionStatusText = (visible: boolean) => {
    return visible ? "Visible" : "Hidden";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Layout className="h-4 w-4 mr-2" />
          Arrange Sections
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Homepage Sections</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center">
              <Move className="h-4 w-4 mr-2" />
              How to Use
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Drag sections using the grip handle to reorder them</li>
              <li>• Click the eye icon to show/hide sections</li>
              <li>• Changes apply to the entire homepage layout</li>
              <li>• Save to make changes permanent</li>
            </ul>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 p-4 rounded-lg border-2 border-dashed transition-colors ${
                    snapshot.isDraggingOver 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-background/50'
                  }`}
                >
                  <h3 className="font-semibold text-center text-sm text-muted-foreground mb-4">
                    Drag to Reorder Sections
                  </h3>
                  
                  {editingSections.map((section, index) => (
                    <Draggable 
                      key={section.id} 
                      draggableId={section.id} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`transition-all duration-200 ${
                            snapshot.isDragging 
                              ? 'shadow-lg rotate-3 scale-105 border-primary' 
                              : 'hover:shadow-md'
                          } ${!section.visible ? 'opacity-60' : ''}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1">
                                <div 
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                                >
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>
                                
                                <div className="text-2xl">{section.icon}</div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="font-semibold">{section.name}</h4>
                                    <Badge 
                                      variant="secondary" 
                                      className={`${getSectionStatusColor(section.visible)} text-white text-xs`}
                                    >
                                      {getSectionStatusText(section.visible)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {section.description}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                  Position {index + 1}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSectionVisibility(section.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  {section.visible ? (
                                    <Eye className="h-4 w-4 text-gaming-success" />
                                  ) : (
                                    <EyeOff className="h-4 w-4 text-gaming-danger" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="bg-muted/30 p-3 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Preview Order:</h4>
            <div className="flex flex-wrap gap-2">
              {editingSections
                .filter(section => section.visible)
                .map((section, index) => (
                <Badge key={section.id} variant="outline" className="text-xs">
                  {index + 1}. {section.icon} {section.name}
                </Badge>
              ))}
            </div>
            {editingSections.filter(section => section.visible).length === 0 && (
              <p className="text-xs text-muted-foreground italic">No visible sections</p>
            )}
          </div>
        </div>
        
        <div className="flex justify-between pt-4 border-t">
          <Button onClick={handleReset} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <div className="space-x-2">
            <Button onClick={() => setIsOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Layout className="h-4 w-4 mr-2" />
              Save Layout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};