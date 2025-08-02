import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogoStyle {
  text: string;
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  color: string;
  textDecoration: string;
  letterSpacing: string;
  textTransform: string;
}

interface AdminLogoEditorProps {
  logoStyle: LogoStyle;
  onLogoUpdate: (logoStyle: LogoStyle) => void;
}

const DEFAULT_LOGO_STYLE: LogoStyle = {
  text: "592 Stock",
  fontSize: "text-2xl",
  fontWeight: "font-bold",
  fontFamily: "font-sans",
  color: "bg-gradient-primary bg-clip-text text-transparent",
  textDecoration: "no-underline",
  letterSpacing: "tracking-normal",
  textTransform: "normal-case"
};

const FONT_SIZES = [
  { value: "text-xs", label: "Extra Small" },
  { value: "text-sm", label: "Small" },
  { value: "text-base", label: "Base" },
  { value: "text-lg", label: "Large" },
  { value: "text-xl", label: "Extra Large" },
  { value: "text-2xl", label: "2X Large" },
  { value: "text-3xl", label: "3X Large" },
  { value: "text-4xl", label: "4X Large" },
  { value: "text-5xl", label: "5X Large" },
  { value: "text-6xl", label: "6X Large" }
];

const FONT_WEIGHTS = [
  { value: "font-thin", label: "Thin" },
  { value: "font-extralight", label: "Extra Light" },
  { value: "font-light", label: "Light" },
  { value: "font-normal", label: "Normal" },
  { value: "font-medium", label: "Medium" },
  { value: "font-semibold", label: "Semi Bold" },
  { value: "font-bold", label: "Bold" },
  { value: "font-extrabold", label: "Extra Bold" },
  { value: "font-black", label: "Black" }
];

const FONT_FAMILIES = [
  { value: "font-sans", label: "Sans Serif" },
  { value: "font-serif", label: "Serif" },
  { value: "font-mono", label: "Monospace" },
  { value: "font-cursive", label: "Cursive" },
  { value: "font-fantasy", label: "Fantasy" }
];

const COLORS = [
  { value: "bg-gradient-primary bg-clip-text text-transparent", label: "Primary Gradient" },
  { value: "text-primary", label: "Primary" },
  { value: "text-gaming-success", label: "Success Green" },
  { value: "text-gaming-accent", label: "Accent Blue" },
  { value: "text-gaming-warning", label: "Warning Yellow" },
  { value: "text-gaming-danger", label: "Danger Red" },
  { value: "text-gaming-orange", label: "Orange" },
  { value: "text-white", label: "White" },
  { value: "text-black", label: "Black" },
  { value: "text-gray-500", label: "Gray" },
  { value: "bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent", label: "Purple-Pink Gradient" },
  { value: "bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent", label: "Blue-Green Gradient" },
  { value: "bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent", label: "Red-Yellow Gradient" },
  { value: "bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent", label: "Indigo-Purple Gradient" }
];

const TEXT_DECORATIONS = [
  { value: "no-underline", label: "None" },
  { value: "underline", label: "Underline" },
  { value: "line-through", label: "Line Through" },
  { value: "overline", label: "Overline" }
];

const LETTER_SPACINGS = [
  { value: "tracking-tighter", label: "Tighter" },
  { value: "tracking-tight", label: "Tight" },
  { value: "tracking-normal", label: "Normal" },
  { value: "tracking-wide", label: "Wide" },
  { value: "tracking-wider", label: "Wider" },
  { value: "tracking-widest", label: "Widest" }
];

const TEXT_TRANSFORMS = [
  { value: "normal-case", label: "Normal" },
  { value: "uppercase", label: "Uppercase" },
  { value: "lowercase", label: "Lowercase" },
  { value: "capitalize", label: "Capitalize" }
];

export const AdminLogoEditor: React.FC<AdminLogoEditorProps> = ({
  logoStyle,
  onLogoUpdate
}) => {
  const [editingStyle, setEditingStyle] = useState<LogoStyle>(logoStyle);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setEditingStyle(logoStyle);
  }, [logoStyle]);

  const handleSave = () => {
    onLogoUpdate(editingStyle);
    localStorage.setItem('admin_logo_style', JSON.stringify(editingStyle));
    setIsOpen(false);
    toast({
      title: "Logo Updated",
      description: "Your logo styling has been saved successfully!",
    });
  };

  const handleReset = () => {
    setEditingStyle(DEFAULT_LOGO_STYLE);
    onLogoUpdate(DEFAULT_LOGO_STYLE);
    localStorage.removeItem('admin_logo_style');
    toast({
      title: "Logo Reset",
      description: "Logo styling has been reset to default.",
    });
  };

  const updateStyle = (field: keyof LogoStyle, value: string) => {
    setEditingStyle({
      ...editingStyle,
      [field]: value
    });
  };

  const getLogoClassName = () => {
    return [
      editingStyle.fontSize,
      editingStyle.fontWeight,
      editingStyle.fontFamily,
      editingStyle.color,
      editingStyle.textDecoration,
      editingStyle.letterSpacing,
      editingStyle.textTransform
    ].join(' ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Type className="h-4 w-4 mr-2" />
          Edit Logo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Logo Style</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content & Typography</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Logo Text & Style</CardTitle>
                <CardDescription>Customize your logo text and font styling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logo-text">Logo Text</Label>
                  <Input
                    id="logo-text"
                    value={editingStyle.text}
                    onChange={(e) => updateStyle('text', e.target.value)}
                    placeholder="Enter logo text"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="font-size">Font Size</Label>
                    <select
                      id="font-size"
                      value={editingStyle.fontSize}
                      onChange={(e) => updateStyle('fontSize', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      {FONT_SIZES.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="font-weight">Font Weight</Label>
                    <select
                      id="font-weight"
                      value={editingStyle.fontWeight}
                      onChange={(e) => updateStyle('fontWeight', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      {FONT_WEIGHTS.map((weight) => (
                        <option key={weight.value} value={weight.value}>
                          {weight.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="font-family">Font Family</Label>
                    <select
                      id="font-family"
                      value={editingStyle.fontFamily}
                      onChange={(e) => updateStyle('fontFamily', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      {FONT_FAMILIES.map((family) => (
                        <option key={family.value} value={family.value}>
                          {family.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="text-color">Color</Label>
                    <select
                      id="text-color"
                      value={editingStyle.color}
                      onChange={(e) => updateStyle('color', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      {COLORS.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="text-decoration">Text Decoration</Label>
                    <select
                      id="text-decoration"
                      value={editingStyle.textDecoration}
                      onChange={(e) => updateStyle('textDecoration', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      {TEXT_DECORATIONS.map((decoration) => (
                        <option key={decoration.value} value={decoration.value}>
                          {decoration.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="letter-spacing">Letter Spacing</Label>
                    <select
                      id="letter-spacing"
                      value={editingStyle.letterSpacing}
                      onChange={(e) => updateStyle('letterSpacing', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    >
                      {LETTER_SPACINGS.map((spacing) => (
                        <option key={spacing.value} value={spacing.value}>
                          {spacing.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="text-transform">Text Transform</Label>
                  <select
                    id="text-transform"
                    value={editingStyle.textTransform}
                    onChange={(e) => updateStyle('textTransform', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    {TEXT_TRANSFORMS.map((transform) => (
                      <option key={transform.value} value={transform.value}>
                        {transform.label}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>See how your logo will look</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 bg-background/50">
                  <div className="flex items-center justify-center">
                    <div className={getLogoClassName()}>
                      {editingStyle.text || "Your Logo"}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <strong>Applied CSS Classes:</strong>
                  <br />
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {getLogoClassName()}
                  </code>
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