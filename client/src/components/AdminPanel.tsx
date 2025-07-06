import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Settings, Users, FileText, Megaphone, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction, getAdminLogs, exportAdminLogs } from "@/lib/adminLogging";

export const AdminPanel = () => {
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info',
    active: true,
    expires_at: ''
  });
  const { toast } = useToast();

  const createAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    const announcement = {
      id: Date.now().toString(),
      ...newAnnouncement,
      created_at: new Date().toISOString(),
      created_by: 'admin',
      expires_at: newAnnouncement.expires_at || undefined
    };

    // Save to localStorage
    const existing = localStorage.getItem('admin_announcements');
    const announcements = existing ? JSON.parse(existing) : [];
    const updated = [announcement, ...announcements];
    localStorage.setItem('admin_announcements', JSON.stringify(updated));

    logAdminAction('CREATE_ANNOUNCEMENT', `Created announcement: ${newAnnouncement.title}`, 'admin');

    setNewAnnouncement({
      title: '',
      content: '',
      type: 'info',
      active: true,
      expires_at: ''
    });

    setIsAnnouncementDialogOpen(false);

    toast({
      title: "Announcement Created",
      description: "New announcement has been created successfully",
    });
  };

  const mockUsers = [
    { email: 'zhirocomputer@gmail.com', status: 'Admin', joined: '2024-01-01' },
    { email: 'ajay123phone@gmail.com', status: 'Admin', joined: '2024-01-02' },
    { email: 'user1@example.com', status: 'Active', joined: '2024-01-05' },
    { email: 'user2@example.com', status: 'Active', joined: '2024-01-10' }
  ];

  const adminLogs = getAdminLogs();

  return (
    <div className="flex items-center space-x-2">
      {/* Users Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            👥 Users
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>User Management ({mockUsers.length} users)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {mockUsers.map((user, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{user.email}</span>
                      <Badge className="ml-2" variant={user.status === 'Admin' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">Joined: {user.joined}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Logs Dialog */}
      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
            📋 Logs
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Admin Activity Logs ({adminLogs.length})
              <Button onClick={exportAdminLogs} variant="outline" size="sm">
                📥 Export
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {adminLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No admin activity logged yet</p>
            ) : (
              adminLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{log.action}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{log.details}</p>
                    <p className="text-xs text-muted-foreground">By: {log.admin_email}</p>
                    {log.target_user && (
                      <p className="text-xs text-muted-foreground">Target: {log.target_user}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcements Dialog */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="bg-gaming-success/10 text-gaming-success border-gaming-success/20">
            📢 Announce
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <Plus className="h-4 w-4 mr-2 inline" />
              Create Announcement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newAnnouncement.type} onValueChange={(value) => setNewAnnouncement({...newAnnouncement, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info ℹ️</SelectItem>
                    <SelectItem value="sale">Sale 💰</SelectItem>
                    <SelectItem value="warning">Warning ⚠️</SelectItem>
                    <SelectItem value="success">Success ✅</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                placeholder="Announcement content"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expires (optional)</Label>
                <Input
                  type="datetime-local"
                  value={newAnnouncement.expires_at}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, expires_at: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  checked={newAnnouncement.active}
                  onCheckedChange={(checked) => setNewAnnouncement({...newAnnouncement, active: checked})}
                />
                <Label>Active</Label>
              </div>
            </div>
            <Button onClick={createAnnouncement} className="w-full">
              Create Announcement
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <p className="text-sm font-medium text-primary">Admin Panel</p>
            <p className="text-xs text-muted-foreground">Management tools available</p>
          </div>
          
          <DropdownMenuItem className="flex items-center cursor-pointer">
            <Users className="h-4 w-4 mr-2" />
            User Management
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center cursor-pointer">
            <FileText className="h-4 w-4 mr-2" />
            Activity Logs
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center cursor-pointer">
            <Megaphone className="h-4 w-4 mr-2" />
            Announcements
          </DropdownMenuItem>
          
          <div className="px-2 py-1.5 border-t border-primary/20">
            <p className="text-xs text-muted-foreground">
              Use buttons above for quick access
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};