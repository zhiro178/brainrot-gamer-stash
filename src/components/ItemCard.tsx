import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminEditOverlay } from "@/components/AdminEditOverlay";
import { useAdmin } from "@/contexts/AdminContext";

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
}

export const ItemCard = ({ item, onPurchase, onUpdateItem }: ItemCardProps) => {
  const { isAdminMode } = useAdmin();

  const handleItemUpdate = (value: string) => {
    if (onUpdateItem) {
      const [newName, newPrice, newRarity, newImage] = value.split('|');
      const updates: any = {};
      if (newName) updates.name = newName;
      if (newPrice && !isNaN(parseFloat(newPrice))) updates.price = parseFloat(newPrice);
      if (newRarity) updates.rarity = newRarity;
      if (newImage) updates.image = newImage;
      onUpdateItem(item.id, updates);
    }
  };

  return (
    <Card className="group hover:shadow-gaming transition-all duration-300 bg-gradient-card border-primary/20">
      <CardHeader className="text-center">
        <div className="text-4xl mb-2">{item.image}</div>
        <CardTitle className="text-primary group-hover:text-primary-glow transition-colors">
          {item.name}
        </CardTitle>
        <CardDescription className="flex items-center justify-center gap-2">
          <Badge className={`${RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS]} text-white`}>
            {item.rarity}
          </Badge>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="text-center">
          <span className="text-2xl font-bold text-gaming-success">
            ${item.price}
          </span>
        </div>
        
        {isAdminMode && onUpdateItem ? (
          <AdminEditOverlay 
            type="catalog" 
            currentValue={`${item.name}|${item.price}|${item.rarity}|${item.image}`} 
            onSave={handleItemUpdate}
            placeholder="name|price|rarity|emoji"
          >
            <Button 
              onClick={() => onPurchase(item)}
              className="w-full bg-gradient-primary hover:shadow-glow group-hover:scale-105 transition-all duration-300"
            >
              Purchase Now
            </Button>
          </AdminEditOverlay>
        ) : (
          <Button 
            onClick={() => onPurchase(item)}
            className="w-full bg-gradient-primary hover:shadow-glow group-hover:scale-105 transition-all duration-300"
          >
            Purchase Now
          </Button>
        )}
      </CardContent>
    </Card>
  );
};