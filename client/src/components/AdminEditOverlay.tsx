import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Save, X, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminEditOverlayProps {
  type: "game" | "catalog" | "price";
  currentValue: string | number;
  onSave: (newValue: any) => void;
  placeholder?: string;
  children: React.ReactNode;
}

const RARITY_OPTIONS = [
  { value: 'Common', label: 'Common', color: 'bg-gray-500' },
  { value: 'Uncommon', label: 'Uncommon', color: 'bg-green-500' },
  { value: 'Rare', label: 'Rare', color: 'bg-blue-500' },
  { value: 'Epic', label: 'Epic', color: 'bg-purple-500' },
  { value: 'Legendary', label: 'Legendary', color: 'bg-orange-500' },
  { value: 'Mythical', label: 'Mythical', color: 'bg-red-500' },
];

export const AdminEditOverlay = ({ 
  type, 
  currentValue, 
  onSave, 
  placeholder, 
  children 
}: AdminEditOverlayProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentValue.toString());
  
  // For catalog items, parse the pipe-separated values
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemRarity, setItemRarity] = useState('Common');
  const [itemDescription, setItemDescription] = useState('');
  
  const { toast } = useToast();

  // Initialize item fields when editing starts
  const startEditing = () => {
    if (type === "catalog") {
      const parts = currentValue.toString().split('|');
      setItemName(parts[0] || '');
      setItemPrice(parts[1] || '');
      setItemImage(parts[2] || '');
      setItemRarity(parts[3] || 'Common');
      setItemDescription(parts[4] || '');
    } else {
      setEditValue(currentValue.toString());
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    if (type === "catalog") {
      // Validate required fields
      if (!itemName.trim() || !itemPrice.trim()) {
        toast({
          title: "Validation Error",
          description: "Name and price are required fields",
          variant: "destructive",
        });
        return;
      }
      
      // Validate price is a number
      const price = parseFloat(itemPrice);
      if (isNaN(price) || price < 0) {
        toast({
          title: "Validation Error", 
          description: "Price must be a valid number",
          variant: "destructive",
        });
        return;
      }
      
      // Combine values with pipe separator
      const finalValue = `${itemName}|${price}|${itemImage}|${itemRarity}|${itemDescription}`;
      onSave(finalValue);
    } else {
      let finalValue: any = editValue;
      if (type === "price") {
        finalValue = parseFloat(editValue);
      }
      onSave(finalValue);
    }
    
    setIsEditing(false);
    toast({
      title: "Updated",
      description: `${type} has been updated successfully`,
    });
  };

  const handleCancel = () => {
    setEditValue(currentValue.toString());
    setItemName('');
    setItemPrice('');
    setItemImage('');
    setItemRarity('Common');
    setItemDescription('');
    setIsEditing(false);
  };

  return (
    <div className="relative group">
      {children}
      
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/90 hover:bg-primary border-primary text-primary-foreground hover:text-primary-foreground"
            onClick={startEditing}
          >
            <Edit className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl bg-gradient-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit {type === 'catalog' ? 'Item' : type}
            </DialogTitle>
            <DialogDescription>
              {type === 'catalog' 
                ? 'Update the item details below' 
                : `Update the ${type} value`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {type === "catalog" ? (
              <>
                {/* Item Preview */}
                <Card className="bg-background/50 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 flex items-center justify-center border-2 border-primary/20 rounded-lg bg-background">
                        {itemImage && itemImage.startsWith('http') ? (
                          <img 
                            src={itemImage} 
                            alt="Preview"
                            className="w-14 h-14 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-2xl">
                            {itemImage || '🎁'}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {itemName || 'Item Name'}
                        </h3>
                        <p className="text-gaming-success font-bold">
                          ${itemPrice || '0.00'}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded text-xs text-white ${
                          RARITY_OPTIONS.find(r => r.value === itemRarity)?.color || 'bg-gray-500'
                        }`}>
                          {itemRarity}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Edit Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="Enter item name"
                      className="border-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="0.00"
                      className="border-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Image URL or Emoji
                  </Label>
                  <Input
                    id="image"
                    value={itemImage}
                    onChange={(e) => setItemImage(e.target.value)}
                    placeholder="https://example.com/image.png or 🎁"
                    className="border-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rarity">Rarity</Label>
                  <Select value={itemRarity} onValueChange={setItemRarity}>
                    <SelectTrigger className="border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RARITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${option.color}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Enter item description..."
                    className="border-primary/20 min-h-[80px]"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={placeholder}
                  className="border-primary/20"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="flex-1 bg-gaming-success hover:bg-gaming-success/80 text-black">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel} className="border-primary/20">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};