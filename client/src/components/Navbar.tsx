import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Wallet, LogOut, Ticket, Settings, Edit } from "lucide-react";
import { useLocation } from "wouter";
import { useAdmin } from "@/contexts/AdminContext";
import { AdminPanel } from "@/components/AdminPanel";
import { UserProfile } from "@/components/UserProfile";
import { AdminLogoEditor } from "@/components/AdminLogoEditor";

interface NavbarProps {
  user?: any;
  userBalance?: number;
  balanceLoading?: boolean;
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string) => void;
  onLogout: () => void;
  onUserUpdate?: (user: any) => void;
}

export const Navbar = ({ user, userBalance = 0, balanceLoading = false, onLogin, onRegister, onLogout, onUserUpdate }: NavbarProps) => {
  const [, setLocation] = useLocation();
  const { isAdminMode, toggleAdminMode, setIsAdmin } = useAdmin();
  
  // Check if user is admin and set admin status
  const isUserAdmin = user && (
    user.email?.toLowerCase() === 'zhirocomputer@gmail.com' || 
    user.email?.toLowerCase() === 'ajay123phone@gmail.com'
  );
  if (isUserAdmin && !isAdminMode) {
    setIsAdmin(true);
  }

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  // Logo style state management
  const [logoStyle, setLogoStyle] = useState(() => {
    const saved = localStorage.getItem('admin_logo_style');
    return saved ? JSON.parse(saved) : {
      text: "592 Stock",
      fontSize: "text-2xl",
      fontWeight: "font-bold",
      fontFamily: "font-sans",
      color: "bg-gradient-primary bg-clip-text text-transparent",
      textDecoration: "no-underline",
      letterSpacing: "tracking-normal",
      textTransform: "normal-case"
    };
  });

  const handleLogoUpdate = (newLogoStyle: any) => {
    setLogoStyle(newLogoStyle);
  };

  const getLogoClassName = () => {
    return [
      logoStyle.fontSize,
      logoStyle.fontWeight,
      logoStyle.fontFamily,
      logoStyle.color,
      logoStyle.textDecoration,
      logoStyle.letterSpacing,
      logoStyle.textTransform
    ].filter(Boolean).join(' ');
  };

  // Simple notification system
  useEffect(() => {
    if (!user) return;

    const checkNotifications = async () => {
      try {
        let totalUnread = 0;

        // Get user's tickets
        const { data: tickets, error: ticketsError } = await supabase
          .from('support_tickets')
          .select('id, created_at')
          .eq('user_id', user.id);

        if (ticketsError || !tickets) return;

        for (const ticket of tickets) {
          const notificationKey = `ticket_notification_${user.id}_${ticket.id}`;
          const hasSeenTicket = localStorage.getItem(notificationKey);

          // Check if there are any admin messages in this ticket
          const { data: adminMessages, error: messagesError } = await supabase
            .from('ticket_messages')
            .select('created_at')
            .eq('ticket_id', ticket.id)
            .eq('is_admin', true);

          if (messagesError) continue;

          // Show notification if:
          // 1. User hasn't seen this ticket notification yet, OR
          // 2. There are admin messages and user hasn't seen the latest admin response
          if (!hasSeenTicket || (adminMessages && adminMessages.length > 0)) {
            const lastAdminMessage = adminMessages?.[adminMessages.length - 1];
            const lastSeenAdmin = localStorage.getItem(`${notificationKey}_admin`);
            
            if (!hasSeenTicket || (lastAdminMessage && (!lastSeenAdmin || new Date(lastAdminMessage.created_at) > new Date(lastSeenAdmin)))) {
              totalUnread++;
            }
          }
        }

        setUnreadMessages(totalUnread);
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    checkNotifications();
    
    // Check every 10 seconds for new messages
    const interval = setInterval(checkNotifications, 10000);
    
    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = (e: any) => {
    e.preventDefault();
    onLogin(loginEmail, loginPassword);
    setIsLoginOpen(false);
    setLoginEmail("");
    setLoginPassword("");
  };

  const handleRegister = (e: any) => {
    e.preventDefault();
    onRegister(registerEmail, registerPassword);
    setIsRegisterOpen(false);
    setRegisterEmail("");
    setRegisterPassword("");
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.nickname) {
      return user.user_metadata.nickname;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const displayName = getUserDisplayName();
    return displayName.charAt(0).toUpperCase();
  };

  return (
    <nav className="border-b border-border bg-gradient-card backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div 
              className={`${getLogoClassName()} cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => setLocation('/')}
            >
              {logoStyle.text}
            </div>
            <Badge variant="secondary" className="bg-gaming-accent text-black">
              Gaming Marketplace
            </Badge>
            {isAdminMode && isUserAdmin && (
              <AdminLogoEditor 
                logoStyle={logoStyle}
                onLogoUpdate={handleLogoUpdate}
              />
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 bg-background/50 backdrop-blur-sm border border-primary/20 rounded-lg px-3 py-2">
                  <Wallet className="h-4 w-4 text-gaming-success" />
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    {balanceLoading ? (
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-gaming-success"></div>
                        <p className="font-semibold text-gaming-success text-sm">Loading...</p>
                      </div>
                    ) : (
                      <p className="font-semibold text-gaming-success text-sm">${userBalance.toFixed(2)}</p>
                    )}
                  </div>
                </div>
                
                <UserProfile user={user} onUserUpdate={onUserUpdate} />
                
                {(!isUserAdmin || isAdminMode) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation('/tickets')}
                    className="border-primary/20 hover:bg-primary/10 relative"
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    My Tickets
                    {unreadMessages > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-destructive text-white text-xs min-w-[1.2rem] h-5 flex items-center justify-center rounded-full">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </Badge>
                    )}
                  </Button>
                )}

                {isUserAdmin && (
                  <>
                    <Button 
                      variant={isAdminMode ? "default" : "outline"}
                      size="sm"
                      onClick={toggleAdminMode}
                      className={isAdminMode ? "bg-gaming-warning text-black hover:bg-gaming-warning/80" : "border-gaming-warning/20 text-gaming-warning hover:bg-gaming-warning/10"}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {isAdminMode ? "Exit Admin Mode" : "Admin Mode"}
                    </Button>
                    
                    {isAdminMode && (
                      <AdminPanel />
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation('/admin')}
                      className="border-primary/20 text-primary hover:bg-primary/10"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Admin Panel
                    </Button>
                  </>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onLogout}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Login</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gradient-card border-primary/20">
                    <DialogHeader>
                      <DialogTitle className="text-primary">Login to {logoStyle.text}</DialogTitle>
                      <DialogDescription>
                        Enter your email and password to access your account
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          className="bg-background border-primary/20"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          className="bg-background border-primary/20"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-primary hover:shadow-glow">
                        Login
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-primary hover:shadow-glow">Register</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gradient-card border-primary/20">
                    <DialogHeader>
                      <DialogTitle className="text-primary">Create Account</DialogTitle>
                      <DialogDescription>
                        Join {logoStyle.text} to start trading gaming items
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <Label htmlFor="reg-email">Email</Label>
                        <Input
                          id="reg-email"
                          type="email"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                          className="bg-background border-primary/20"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reg-password">Password</Label>
                        <Input
                          id="reg-password"
                          type="password"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                          className="bg-background border-primary/20"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-primary hover:shadow-glow">
                        Create Account
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};