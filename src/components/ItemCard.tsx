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
      // Only update the name/text of the item
      const updates: any = { name: value };
      onUpdateItem(item.id, updates);
    }
  };

  return (
    <Card className="group hover:shadow-gaming transition-all duration-300 bg-gradient-card border-primary/20">
      <CardHeader className="text-center relative">
        <div className="text-4xl mb-2">{item.image}</div>
        {isAdminMode && onUpdateItem ? (
          <AdminEditOverlay 
            type="catalog" 
            currentValue={item.name} 
            onSave={handleItemUpdate}
            placeholder="Enter item name"
          >
            <CardTitle className="text-primary group-hover:text-primary-glow transition-colors">
              {item.name}
            </CardTitle>
          </AdminEditOverlay>
        ) : (
          <CardTitle className="text-primary group-hover:text-primary-glow transition-colors">
            {item.name}
          </CardTitle>
        )}
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
        
        <Button 
          onClick={() => onPurchase(item)}
          className="w-full bg-gradient-primary hover:shadow-glow group-hover:scale-105 transition-all duration-300"
        >
          Purchase Now
        </Button>
      </CardContent>
    </Card>
  );
};