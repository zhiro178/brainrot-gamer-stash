import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GameCardProps {
  title: string;
  description: string;
  imageUrl: string;
  itemCount: number;
  onClick: () => void;
}

export const GameCard = ({ title, description, imageUrl, itemCount, onClick }: GameCardProps) => {
  return (
    <Card className="group hover:shadow-gaming transition-all duration-300 cursor-pointer bg-gradient-card border-primary/20 overflow-hidden">
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
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