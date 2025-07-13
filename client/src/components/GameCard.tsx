import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminEditOverlay } from "@/components/AdminEditOverlay";
import { useAdmin } from "@/contexts/AdminContext";
import { Edit } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const { isAdminMode, isAdmin } = useAdmin();
  return (
    <TooltipProvider>
      <Card className="group hover:shadow-gaming transition-all duration-300 cursor-pointer bg-gradient-card border-primary/20 overflow-hidden h-fit">
        <div className="relative">
          {isAdmin && isAdminMode && onUpdateGame ? (
            <div className="relative">
              <img 
                src={imageUrl} 
                alt={title}
                className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300"
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
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </AdminEditOverlay>
            </div>
          ) : (
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-20 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          
          <div className="absolute inset-0 bg-gradient-hero opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <Badge className="absolute top-1 right-1 bg-gaming-accent text-black text-xs">
            {itemCount}
          </Badge>
        </div>
        
        <div className="p-3">
          <h3 className="text-primary group-hover:text-primary-glow transition-colors text-sm font-semibold mb-1">
            {title}
          </h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-muted-foreground text-xs truncate cursor-help">
                {description}
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{description}</p>
            </TooltipContent>
          </Tooltip>
          
          <Button 
            onClick={onClick}
            className="w-full bg-gradient-primary hover:shadow-glow group-hover:scale-105 transition-all duration-300 mt-2"
            size="sm"
          >
            Browse Items
          </Button>
        </div>
      </Card>
    </TooltipProvider>
  );
};