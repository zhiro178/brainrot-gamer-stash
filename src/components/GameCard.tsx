import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminEditOverlay } from "@/components/AdminEditOverlay";
import { useAdmin } from "@/contexts/AdminContext";
import { Edit } from "lucide-react";

interface GameCardProps {
  title: string;
  description: string;
  imageUrl: string;
  itemCount: number;
  onClick: () => void;
  onUpdateGame?: (newImageUrl: string, newDescription: string) => void;
}

export const GameCard = ({ 
  title, 
  description, 
  imageUrl, 
  itemCount, 
  onClick, 
  onUpdateGame
}: GameCardProps) => {
  const { isAdminMode } = useAdmin();
  return (
    <Card className="group hover:shadow-gaming transition-all duration-300 cursor-pointer bg-gradient-card border-primary/20 overflow-hidden">
      <div className="relative">
        {isAdminMode && onUpdateGame ? (
          <div className="relative">
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <AdminEditOverlay 
              type="game" 
              currentValue={`${imageUrl}|${description}`} 
              onSave={(value) => {
                const [newImageUrl, newDescription] = value.split('|');
                if (onUpdateGame && newImageUrl && newDescription) {
                  onUpdateGame(newImageUrl, newDescription);
                }
              }}
              placeholder="imageUrl|description"
            >
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <Button 
                  size="sm" 
                  className="bg-gaming-warning text-black hover:bg-gaming-warning/80"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Game
                </Button>
              </div>
            </AdminEditOverlay>
          </div>
        ) : (
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <Badge className="absolute top-2 right-2 bg-gaming-accent text-black">
          {itemCount} Items
        </Badge>
      </div>
      
      <CardHeader>
        <CardTitle className="text-primary group-hover:text-primary-glow transition-colors">
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardFooter>
        <Button 
          onClick={onClick}
          className="w-full bg-gradient-primary hover:shadow-glow group-hover:scale-105 transition-all duration-300"
        >
          Browse Items
        </Button>
      </CardFooter>
    </Card>
  );
};