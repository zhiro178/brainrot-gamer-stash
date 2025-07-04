import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminEditOverlay } from "@/components/AdminEditOverlay";
import { useAdmin } from "@/contexts/AdminContext";
import { Trash2 } from "lucide-react";

const RARITY_COLORS = {
  "Common": "bg-gray-500",
  "Rare": "bg-blue-500",
  "Epic": "bg-purple-500",
  "Legendary": "bg-yellow-500",
  "Mythical": "bg-red-500"
};

interface ItemCardProps {
  item: {
    id: number;
    name: string;
    price: number;
    rarity: string;
    image: string;
  };
  onPurchase: (item: any) => void;
  onUpdateItem?: (itemId: number, updates: { name?: string; price?: number; rarity?: string; image?: string }) => void;
  onDeleteItem?: (itemId: number) => void;
}

export const ItemCard = ({ item, onPurchase, onUpdateItem, onDeleteItem }: ItemCardProps) => {
  const { isAdminMode, isAdmin } = useAdmin();

  const handleItemUpdate = (value: string) => {
    if (onUpdateItem) {
      const [newName, newPrice, newImage] = value.split('|');
      const updates: any = {};
      if (newName) updates.name = newName;
      if (newPrice && !isNaN(parseFloat(newPrice))) updates.price = parseFloat(newPrice);
      if (newImage) updates.image = newImage;
      onUpdateItem(item.id, updates);
    }
  };

  return (
    <Card className="group hover:shadow-gaming transition-all duration-300 bg-gradient-card border-primary/20">
      <CardHeader className="text-center relative">
        <div className="text-4xl mb-2 h-16 flex items-center justify-center">
          {item.image.startsWith('http') ? (
            <img 
              src={item.image} 
              alt={item.name}
              className="max-h-16 max-w-16 object-cover rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.textContent = '🎁';
              }}
            />
          ) : (
            <span>{item.image}</span>
          )}
          {item.image.startsWith('http') && <span className="hidden">🎁</span>}
        </div>
        {isAdmin && isAdminMode && onUpdateItem ? (
          <AdminEditOverlay 
            type="catalog" 
            currentValue={`${item.name}|${item.price}|${item.image}`} 
            onSave={handleItemUpdate}
            placeholder="name|price|imageUrl"
          >
            <CardTitle className="text-primary group-hover:text-primary-glow transition-colors text-base">
              {item.name}
            </CardTitle>
          </AdminEditOverlay>
        ) : (
          <CardTitle className="text-primary group-hover:text-primary-glow transition-colors text-base">
            {item.name}
          </CardTitle>
        )}
        <CardDescription className="flex items-center justify-center gap-2 text-xs">
          <Badge className={`${RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS]} text-white`}>
            {item.rarity}
          </Badge>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center">
          <span className="text-xl font-bold text-gaming-success">
            ${item.price}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => onPurchase(item)}
            className="flex-1 bg-gradient-primary hover:shadow-glow group-hover:scale-105 transition-all duration-300"
          >
            Purchase Now
          </Button>
          
          {isAdmin && isAdminMode && onDeleteItem && (
            <Button 
              onClick={() => onDeleteItem(item.id)}
              variant="destructive"
              size="sm"
              className="px-3"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};