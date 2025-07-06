import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export const AdminPanel = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-gaming-accent text-black hover:bg-gaming-accent/80 border-gaming-accent"
        >
          <Shield className="h-4 w-4 mr-2" />
          Admin
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-gradient-card border-primary/20">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-primary">Admin Tools</p>
          <p className="text-xs text-muted-foreground">Admin panel access</p>
        </div>
        
        <div className="px-2 py-1.5 border-t border-primary/20">
          <p className="text-xs text-muted-foreground">
            Use the admin mode toggle and edit buttons for management
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};