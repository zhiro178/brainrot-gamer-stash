import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminEditOverlayProps {
  type: "game" | "catalog" | "price";
  currentValue: string | number;
  onSave: (newValue: any) => void;
  placeholder?: string;
  children: React.ReactNode;
}

export const AdminEditOverlay = ({ 
  type, 
  currentValue, 
  onSave, 
  placeholder, 
  children 
}: AdminEditOverlayProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentValue.toString());
  const { toast } = useToast();

  const handleSave = () => {
    let finalValue: any = editValue;
    if (type === "price") {
      finalValue = parseFloat(editValue);
    } else if (type === "game" && editValue.includes('|')) {
      // Handle game editing with title|imageUrl format
      finalValue = editValue;
    }
    onSave(finalValue);
    setIsEditing(false);
    toast({
      title: "Updated",
      description: `${type} has been updated successfully`,
    });
  };

  const handleCancel = () => {
    setEditValue(currentValue.toString());
    setIsEditing(false);
  };

  return (
    <div className="relative group">
      {children}
      
      {/* Admin Edit Overlay */}
      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="bg-gaming-warning text-black hover:bg-gaming-warning/80"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit {type}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gradient-card border-primary/20">
            <DialogHeader>
              <DialogTitle>Edit {type}</DialogTitle>
              <DialogDescription>
                Update the {type} value
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-value">
                  {type === "game" ? "Game (imageUrl|description)" : 
                   type === "catalog" ? "Item/Category Details" :
                   type === "price" ? "Price ($)" : "Value"}
                </Label>
                <Input
                  id="edit-value"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={placeholder || (type === "game" ? "Image URL|Description" : "Enter value")}
                  type={type === "price" ? "number" : "text"}
                  step={type === "price" ? "0.01" : undefined}
                  className="bg-background border-primary/20"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} className="bg-gaming-success hover:bg-gaming-success/80">
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};