import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminEditOverlay } from "@/components/AdminEditOverlay";
import { useAdmin } from "@/contexts/AdminContext";

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    description: string;
    itemCount: number;
  };
  gameId: string;
  onClick: () => void;
  onUpdateCategory?: (categoryId: string, updates: { name?: string; description?: string; itemCount?: number }) => void;
}

export const CategoryCard = ({ 
  category, 
  gameId, 
  onClick, 
  onUpdateCategory 
}: CategoryCardProps) => {
  const { isAdminMode, isAdmin } = useAdmin();

  const handleCategoryUpdate = (value: string) => {
    if (onUpdateCategory) {
      const [newName, newDescription, newItemCount] = value.split('|');
      const updates: any = {};
      if (newName) updates.name = newName;
      if (newDescription) updates.description = newDescription;
      if (newItemCount && !isNaN(parseInt(newItemCount))) updates.itemCount = parseInt(newItemCount);
      onUpdateCategory(category.id, updates);
    }
  };

  return (
    <Card 
      className="group hover:shadow-gaming transition-all duration-300 cursor-pointer bg-gradient-card border-primary/20"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-primary group-hover:text-primary-glow transition-colors">
            {category.name}
          </CardTitle>
          <Badge className="bg-gaming-accent text-black">
            {category.itemCount} Items
          </Badge>
        </div>
        <CardDescription className="text-muted-foreground">
          {category.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <Button 
          className="w-full bg-gradient-primary hover:shadow-glow group-hover:scale-105 transition-all duration-300"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Browse {category.name} Items
        </Button>
        
        {isAdmin && isAdminMode && onUpdateCategory && (
          <div onClick={(e) => e.stopPropagation()}>
            <AdminEditOverlay 
              type="catalog" 
              currentValue={`${category.name}|${category.description}|${category.itemCount}`} 
              onSave={handleCategoryUpdate}
              placeholder="name|description|itemCount"
            >
              <Button 
                variant="outline"
                className="w-full border-gaming-warning text-gaming-warning hover:bg-gaming-warning hover:text-black"
              >
                Edit Category
              </Button>
            </AdminEditOverlay>
          </div>
        )}
      </CardContent>
    </Card>
  );
};