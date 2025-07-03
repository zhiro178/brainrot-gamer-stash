import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Wallet, LogOut, Ticket, Settings, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";

interface NavbarProps {
  user?: any;
  userBalance?: number;
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string) => void;
  onLogout: () => void;
}

export const Navbar = ({ user, userBalance = 0, onLogin, onRegister, onLogout }: NavbarProps) => {
  const navigate = useNavigate();
  const { isAdminMode, toggleAdminMode, setIsAdmin } = useAdmin();
  
  // Check if user is admin and set admin status
  const isUserAdmin = user && (user.email === 'zhirocomputer@gmail.com' || user.email === 'ajay123phone@gmail.com');
  if (isUserAdmin && !isAdminMode) {
    setIsAdmin(true);
  }
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(loginEmail, loginPassword);
    setIsLoginOpen(false);
    setLoginEmail("");
    setLoginPassword("");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister(registerEmail, registerPassword);
    setIsRegisterOpen(false);
    setRegisterEmail("");
    setRegisterPassword("");
  };

  return (
    <nav className="border-b border-border bg-gradient-card backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              592 Stock
            </div>
            <Badge variant="secondary" className="bg-gaming-accent text-black">
              Gaming Marketplace
            </Badge>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Card className="bg-gradient-card border-primary/20">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Wallet className="h-4 w-4 text-gaming-success" />
                      <div>
                        <p className="text-sm text-muted-foreground">Balance</p>
                        <p className="font-semibold text-gaming-success">${userBalance.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user.email}</span>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/tickets')}
                  className="border-primary/20 hover:bg-primary/10"
                >
                  <Ticket className="h-4 w-4 mr-2" />
                  My Tickets
                </Button>

                {isUserAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/admin')}
                    className="border-primary/20 text-primary hover:bg-primary/10"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
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
                      <DialogTitle className="text-primary">Login to 592 Stock</DialogTitle>
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
                        Join 592 Stock to start trading gaming items
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