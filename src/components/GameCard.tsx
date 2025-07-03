import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminEditOverlay } from "@/components/AdminEditOverlay";
import { useAdmin } from "@/contexts/AdminContext";

interface GameCardProps {
  title: string;
  description: string;
  imageUrl: string;
  itemCount: number;
  onClick: () => void;
  onUpdateTitle?: (newTitle: string) => void;
  onUpdateImage?: (newImageUrl: string) => void;
  onUpdateCount?: (newCount: number) => void;
}

export const GameCard = ({ 
  title, 
  description, 
  imageUrl, 
  itemCount, 
  onClick, 
  onUpdateTitle, 
  onUpdateImage, 
  onUpdateCount 
}: GameCardProps) => {
  const { isAdminMode } = useAdmin();
  return (
    <Card className="group hover:shadow-gaming transition-all duration-300 cursor-pointer bg-gradient-card border-primary/20 overflow-hidden">
      <div className="relative">
        {isAdminMode && onUpdateImage ? (
          <AdminEditOverlay 
            type="game" 
            currentValue={imageUrl} 
            onSave={onUpdateImage}
            placeholder="Enter image URL"
          >
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </AdminEditOverlay>
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
      
      <CardFooter className="relative">
        {isAdminMode && (onUpdateTitle || onUpdateImage) ? (
          <AdminEditOverlay 
            type="game" 
            currentValue={`${title}|${imageUrl}|${description}`} 
            onSave={(value) => {
              const [newTitle, newImageUrl] = value.split('|');
              if (onUpdateTitle && newTitle) onUpdateTitle(newTitle);
              if (onUpdateImage && newImageUrl) onUpdateImage(newImageUrl);
            }}
            placeholder="title|imageUrl"
          >
            <Button 
              onClick={onClick}
              className="w-full bg-gradient-primary hover:shadow-glow group-hover:scale-105 transition-all duration-300"
            >
              Browse Items
            </Button>
          </AdminEditOverlay>
        ) : (
          <Button 
            onClick={onClick}
            className="w-full bg-gradient-primary hover:shadow-glow group-hover:scale-105 transition-all duration-300"
          >
            Browse Items
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};