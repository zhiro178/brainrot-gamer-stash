import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, RotateCcw, Database, Trash2 } from "lucide-react";

interface AdminPanelProps {
  onResetGames?: () => void;
}

export const AdminPanel = ({ onResetGames }: AdminPanelProps) => {
  const { toast } = useToast();

  const handleClearStorage = () => {
    localStorage.removeItem('admin_games');
    if (onResetGames) {
      onResetGames();
    }
    toast({
      title: "Storage Cleared",
      description: "All admin changes have been reset to defaults",
    });
  };

  const handleClearAllStorage = () => {
    localStorage.clear();
    toast({
      title: "All Storage Cleared",
      description: "All local storage has been cleared",
    });
  };

  const hasChanges = localStorage.getItem('admin_games') !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="relative bg-gaming-accent text-black hover:bg-gaming-accent/80 border-gaming-accent"
        >
          <Shield className="h-4 w-4 mr-2" />
          Admin
          {hasChanges && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-gaming-warning rounded-full"></div>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-gradient-card border-primary/20">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium text-primary">Admin Tools</p>
          <p className="text-xs text-muted-foreground">Quick admin actions</p>
        </div>
        
        <DropdownMenuItem 
          onClick={handleClearStorage}
          className="cursor-pointer hover:bg-background/80"
          disabled={!hasChanges}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Games to Default
          {hasChanges && <Badge variant="destructive" className="ml-auto">!</Badge>}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleClearAllStorage}
          className="cursor-pointer hover:bg-background/80 text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Storage
        </DropdownMenuItem>
        
        <div className="px-2 py-1.5 border-t border-primary/20">
          <p className="text-xs text-muted-foreground">
            {hasChanges ? "Changes saved locally" : "Using defaults"}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};