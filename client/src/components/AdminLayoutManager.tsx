import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Layout, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Move,
  RotateCcw,
  Monitor
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SectionLayout {
  id: string;
  name: string;
  description: string;
  icon: string;
  alignment: 'left' | 'center' | 'right';
  maxWidth: string;
  padding: string;
  margin: string;
}

interface AdminLayoutManagerProps {
  sections: SectionLayout[];
  onLayoutUpdate: (sections: SectionLayout[]) => void;
}

const DEFAULT_LAYOUTS: SectionLayout[] = [
  {
    id: 'hero',
    name: 'Hero Section',
    description: 'Main welcome section with title and badges',
    icon: '🏠',
    alignment: 'center',
    maxWidth: 'max-w-none',
    padding: 'px-4 py-16',
    margin: 'mx-auto'
  },
  {
    id: 'games',
    name: 'Games Section',
    description: 'Browse available games and categories',
    icon: '🎮',
    alignment: 'center',
    maxWidth: 'max-w-none',
    padding: 'px-4 py-16',
    margin: 'mx-auto'
  },
  {
    id: 'features',
    name: 'Features Section',
    description: 'Highlight platform features and benefits',
    icon: '⭐',
    alignment: 'center',
    maxWidth: 'max-w-none',
    padding: 'px-4 py-16',
    margin: 'mx-auto'
  }
];

const ALIGNMENT_OPTIONS = [
  { value: 'left', label: 'Left', icon: AlignLeft, description: 'Align content to the left side' },
  { value: 'center', label: 'Center', icon: AlignCenter, description: 'Center content (default)' },
  { value: 'right', label: 'Right', icon: AlignRight, description: 'Align content to the right side' }
] as const;

const MAX_WIDTH_OPTIONS = [
  { value: 'max-w-xs', label: 'Extra Small', description: '320px max width' },
  { value: 'max-w-sm', label: 'Small', description: '384px max width' },
  { value: 'max-w-md', label: 'Medium', description: '448px max width' },
  { value: 'max-w-lg', label: 'Large', description: '512px max width' },
  { value: 'max-w-xl', label: 'Extra Large', description: '576px max width' },
  { value: 'max-w-2xl', label: '2X Large', description: '672px max width' },
  { value: 'max-w-4xl', label: '4X Large', description: '896px max width' },
  { value: 'max-w-6xl', label: '6X Large', description: '1152px max width' },
  { value: 'max-w-none', label: 'Full Width', description: 'No max width limit' }
];

const PADDING_OPTIONS = [
  { value: 'px-2 py-4', label: 'Small', description: 'Minimal padding' },
  { value: 'px-4 py-8', label: 'Medium', description: 'Standard padding' },
  { value: 'px-4 py-16', label: 'Large', description: 'Generous padding (default)' },
  { value: 'px-8 py-20', label: 'Extra Large', description: 'Maximum padding' }
];

export const AdminLayoutManager: React.FC<AdminLayoutManagerProps> = ({
  sections,
  onLayoutUpdate
}) => {
  const [editingSections, setEditingSections] = useState<SectionLayout[]>(sections);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditingSections(sections);
  }, [sections]);

  const updateSectionLayout = (sectionId: string, field: keyof SectionLayout, value: string) => {
    setEditingSections(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, [field]: value }
          : section
      )
    );
  };

  const handleSave = () => {
    onLayoutUpdate(editingSections);
    localStorage.setItem('admin_section_layouts', JSON.stringify(editingSections));
    setIsOpen(false);
    toast({
      title: "Layout Updated",
      description: "Your section layouts have been saved successfully!",
    });
  };

  const handleReset = () => {
    setEditingSections(DEFAULT_LAYOUTS);
    onLayoutUpdate(DEFAULT_LAYOUTS);
    localStorage.removeItem('admin_section_layouts');
    toast({
      title: "Layout Reset",
      description: "Section layouts have been reset to default.",
    });
  };

  const getAlignmentClasses = (alignment: string) => {
    switch (alignment) {
      case 'left':
        return 'text-left items-start justify-start ml-0 mr-auto';
      case 'right':
        return 'text-right items-end justify-end ml-auto mr-0';
      case 'center':
      default:
        return 'text-center items-center justify-center mx-auto';
    }
  };

  const getAlignmentIcon = (alignment: string) => {
    const option = ALIGNMENT_OPTIONS.find(opt => opt.value === alignment);
    return option?.icon || AlignCenter;
  };

  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'left': return 'text-blue-500';
      case 'right': return 'text-purple-500';
      case 'center': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Layout className="h-4 w-4 mr-2" />
          Layout Manager
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Section Layout Manager</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center">
              <Move className="h-4 w-4 mr-2" />
              Layout Controls
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Alignment:</strong> Move sections left, center, or right</li>
              <li>• <strong>Width:</strong> Control how wide sections can be</li>
              <li>• <strong>Padding:</strong> Adjust spacing inside sections</li>
              <li>• <strong>Live Preview:</strong> See changes in real-time</li>
            </ul>
          </div>

          <div className="space-y-4">
            {editingSections.map((section) => (
              <Card key={section.id} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{section.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{section.name}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={getAlignmentColor(section.alignment)}>
                        {React.createElement(getAlignmentIcon(section.alignment), { className: "h-3 w-3 mr-1" })}
                        {section.alignment.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Alignment Control */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Horizontal Alignment</label>
                      <div className="space-y-2">
                        {ALIGNMENT_OPTIONS.map((option) => (
                          <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`alignment-${section.id}`}
                              value={option.value}
                              checked={section.alignment === option.value}
                              onChange={(e) => updateSectionLayout(section.id, 'alignment', e.target.value)}
                              className="text-primary"
                            />
                            <div className="flex items-center space-x-1">
                              {React.createElement(option.icon, { className: "h-4 w-4" })}
                              <span className="text-sm">{option.label}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Max Width Control */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Maximum Width</label>
                      <select
                        value={section.maxWidth}
                        onChange={(e) => updateSectionLayout(section.id, 'maxWidth', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                      >
                        {MAX_WIDTH_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Padding Control */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Section Padding</label>
                      <select
                        value={section.padding}
                        onChange={(e) => updateSectionLayout(section.id, 'padding', e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                      >
                        {PADDING_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="border-2 border-dashed border-border rounded-lg p-4 bg-background/50">
                    <div className="text-xs text-muted-foreground mb-2 flex items-center">
                      <Monitor className="h-3 w-3 mr-1" />
                      Live Preview
                    </div>
                    <div className={`${getAlignmentClasses(section.alignment)}`}>
                      <div className={`${section.maxWidth} ${section.padding} bg-primary/10 rounded border-2 border-primary/20`}>
                        <div className="text-lg font-semibold text-primary">{section.icon} {section.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Alignment: {section.alignment} | Width: {section.maxWidth} | Padding: {section.padding}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Applied CSS Classes Preview:</h4>
            <div className="space-y-2 text-xs font-mono">
              {editingSections.map((section) => (
                <div key={section.id} className="bg-background p-2 rounded border">
                  <span className="text-primary font-semibold">{section.name}:</span>
                  <br />
                  <span className="text-muted-foreground">
                    {getAlignmentClasses(section.alignment)} {section.maxWidth} {section.padding}
                  </span>
                </div>
              ))}
            </div>
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