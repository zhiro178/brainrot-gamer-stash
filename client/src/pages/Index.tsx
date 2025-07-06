import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase, handleSupabaseError } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { GameCard } from "@/components/GameCard";
import { TopUpModal } from "@/components/TopUpModal";
import { LiveChat } from "@/components/LiveChat";
import { AdminGameEditor } from "@/components/AdminGameEditor";
import { AdminHomepageEditor } from "@/components/AdminHomepageEditor";
import { AdminCatalogEditor } from "@/components/AdminCatalogEditor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";
import { Settings } from "lucide-react";
import { logAdminAction } from "@/lib/adminLogging";

// Import game banners
import adoptMeBanner from "@/assets/adopt-me-banner.jpg";
import gardenBanner from "@/assets/garden-banner.jpg";
import mm2Banner from "@/assets/mm2-banner.jpg";
import brainrotBanner from "@/assets/brainrot-banner.jpg";

const GAMES = [
  {
    id: "adopt-me",
    title: "Adopt Me",
    description: "Trade pets, eggs, and exclusive items from the popular Roblox game",
    imageUrl: adoptMeBanner,
    itemCount: 245
  },
  {
    id: "grow-garden",
    title: "Grow a Garden",
    description: "Seeds, tools, and garden decorations for your virtual garden",
    imageUrl: gardenBanner,
    itemCount: 170
  },
  {
    id: "mm2",
    title: "MM2 (Murder Mystery 2)",
    description: "Knives, guns, and exclusive items from Murder Mystery 2",
    imageUrl: mm2Banner,
    itemCount: 201
  },
  {
    id: "steal-brainrot",
    title: "Steal a Brainrot",
    description: "Unique items and collectibles from this trending game",
    imageUrl: brainrotBanner,
    itemCount: 83
  }
];

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [userBalance, setUserBalance] = useState(0);
  const [games, setGames] = useState(GAMES);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setIsAdmin, isAdminMode, toggleAdminMode } = useAdmin();
  
  // Announcement functionality
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
  
  // Homepage content state
  const [homepageContent, setHomepageContent] = useState({
    hero: {
      title: "Welcome to 592 Stock",
      subtitle: "Your ultimate destination for gaming items across Adopt Me, Grow a Garden, MM2, and Steal a Brainrot",
      badges: [
        { id: "1", text: "Most Popular", color: "bg-gaming-success", emoji: "🎮" },
        { id: "2", text: "Guaranteed Items", color: "bg-gaming-accent", emoji: "📦" },
        { id: "3", text: "Secure Payments", color: "bg-gaming-warning", emoji: "💰" }
      ]
    },
    features: {
      title: "Why Choose 592 Stock?",
      subtitle: "The most trusted gaming marketplace",
      items: [
        {
          id: "1",
          emoji: "🔒",
          title: "Secure Payments",
          description: "Multiple payment options including crypto and gift cards with secure processing"
        },
        {
          id: "2",
          emoji: "⚡",
          title: "Instant Delivery",
          description: "Get your gaming items delivered instantly after successful payment"
        },
        {
          id: "3",
          emoji: "💬",
          title: "24/7 Support",
          description: "Our AI-powered support mascot is always here to help with your questions"
        }
      ]
    }
  });

  useEffect(() => {
    // Check for verification success from URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      toast({
        title: "Email Verified! ✅",
        description: "Your account has been verified successfully. You can now access all features!",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Load saved games from localStorage or use defaults
    const savedGames = localStorage.getItem('admin_games');
    if (savedGames) {
      try {
        setGames(JSON.parse(savedGames));
      } catch (error) {
        console.error('Error loading saved games:', error);
        setGames(GAMES);
      }
    }
    
    // Load saved homepage content from localStorage
    const savedHomepageContent = localStorage.getItem('admin_homepage_content');
    if (savedHomepageContent) {
      try {
        setHomepageContent(JSON.parse(savedHomepageContent));
      } catch (error) {
        console.error('Error loading saved homepage content:', error);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserBalance(session.user.id);
        // Set admin status if user is admin
        if (session.user.email === 'zhirocomputer@gmail.com' || session.user.email === 'ajay123phone@gmail.com') {
          setIsAdmin(true);
          // Auto-enable admin mode for admin users
          if (!isAdminMode) {
            toggleAdminMode();
          }
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserBalance(session.user.id);
        // Set admin status if user is admin
        if (session.user.email === 'zhirocomputer@gmail.com' || session.user.email === 'ajay123phone@gmail.com') {
          setIsAdmin(true);
          // Auto-enable admin mode for admin users
          if (!isAdminMode) {
            toggleAdminMode();
          }
        }
      } else {
        setUserBalance(0);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load announcements
  useEffect(() => {
    const savedAnnouncements = localStorage.getItem('admin_announcements');
    if (savedAnnouncements) {
      try {
        const allAnnouncements = JSON.parse(savedAnnouncements);
        const activeAnnouncements = allAnnouncements.filter((ann: any) => {
          if (!ann.active) return false;
          if (ann.expires_at && new Date(ann.expires_at) < new Date()) return false;
          return true;
        });
        setAnnouncements(activeAnnouncements);
      } catch (error) {
        console.error('Error loading announcements:', error);
      }
    }

    const dismissed = localStorage.getItem('dismissed_announcements');
    if (dismissed) {
      try {
        setDismissedAnnouncements(JSON.parse(dismissed));
      } catch (error) {
        console.error('Error loading dismissed announcements:', error);
      }
    }
  }, []);

  const fetchUserBalance = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();
      
      // Handle expected errors gracefully (table doesn't exist, no records found)
      if (error && !['PGRST116', '42703', '42P01'].includes(error.code)) {
        console.error('Error fetching balance:', error);
        return;
      }
      
      setUserBalance(parseFloat(data?.balance || '0'));
    } catch (error) {
      console.error('Error:', error);
      setUserBalance(0); // Set default balance if any error occurs
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Special handling for unverified email errors
        if (error.message.includes('Email not confirmed') || error.message.includes('not verified')) {
          toast({
            title: "Email Not Verified",
            description: "Please check your email and click the verification link to activate your account.",
            variant: "destructive",
          });
        } else {
          const errorInfo = handleSupabaseError(error, "Login failed");
          toast(errorInfo);
        }
        return;
      }
      
      if (!data.user) {
        toast({
          title: "Login Error",
          description: "Something went wrong during login. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if user is verified before allowing access
      const isVerified = data.user.email_confirmed_at !== null;
      
      if (!isVerified) {
        // Force logout unverified users
        await supabase.auth.signOut();
        
        toast({
          title: "Email Verification Required ⚠️",
          description: "You must verify your email before you can log in. Please check your inbox and click the verification link.",
          variant: "destructive",
        });
        return;
      }
      
      // User is verified - proceed with login
      const userData = {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
        email_confirmed_at: data.user.email_confirmed_at,
        last_sign_in_at: new Date().toISOString(),
        user_metadata: data.user.user_metadata
      };
      
      const existingUsers = localStorage.getItem('admin_users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      const updatedUsers = [userData, ...users.filter((u: any) => u.id !== data.user.id)];
      localStorage.setItem('admin_users', JSON.stringify(updatedUsers));
      
      toast({
        title: "Welcome back! 🎮",
        description: "Successfully logged in to 592 Stock",
      });
      
      logAdminAction('USER_LOGIN', `Verified user logged in: ${email}`, 'system');
      
    } catch (error) {
      console.error('Login error:', error);
      const errorInfo = handleSupabaseError(error, "Login failed");
      toast(errorInfo);
    }
  };

  const handleRegister = async (email: string, password: string) => {
    try {
      // Sign out any existing session first
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/?verified=true`
          // Removed email_confirm: false as it might interfere with email sending
        }
      });
      
      if (error) {
        const errorInfo = handleSupabaseError(error, "Registration failed");
        toast(errorInfo);
        return;
      }
      
      // Debug logging
      console.log('=== REGISTRATION DEBUG ===');
      console.log('Registration data:', data);
      console.log('User created:', data.user);
      console.log('Session created:', data.session);
      console.log('email_confirmed_at:', data.user?.email_confirmed_at);
      console.log('========================');
      
      // Check if user was created but not confirmed
      if (data.user && !data.session) {
        // This is the correct flow - user created but not logged in until verified
        const userData = {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
          email_confirmed_at: data.user.email_confirmed_at, // Use actual value from Supabase
          last_sign_in_at: null,
          user_metadata: data.user.user_metadata
        };
        
        // Update admin user list with unverified user
        const existingUsers = localStorage.getItem('admin_users');
        const users = existingUsers ? JSON.parse(existingUsers) : [];
        const updatedUsers = [userData, ...users.filter((u: any) => u.id !== data.user.id)];
        localStorage.setItem('admin_users', JSON.stringify(updatedUsers));
        
        logAdminAction('USER_REGISTERED', `New unverified user registered: ${email}`, 'system');
        
        toast({
          title: "Account Created! 📧",
          description: "Please check your email and click the verification link to activate your account. Check your spam folder if you don't see it.",
        });
      } else if (data.session) {
        // User was auto-logged in (this shouldn't happen if email confirmation is required)
        console.warn('User was auto-logged in during registration - this suggests email confirmation is not properly configured');
        
        // Force logout to ensure they verify email first
        await supabase.auth.signOut();
        
        toast({
          title: "Account Created! 📧", 
          description: "Please check your email and click the verification link to activate your account.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Error",
          description: "Something went wrong during registration. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorInfo = handleSupabaseError(error, "Registration failed");
      toast(errorInfo);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear local state immediately
      setUser(null);
      setUserBalance(0);
      setIsAdmin(false);
      
      // Clear any localStorage that might contain session data
      localStorage.removeItem('admin_users');
      localStorage.removeItem('user_balances');
      
      // Clear any Supabase auth tokens from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      // Try to sign out from Supabase
      await supabase.auth.signOut();
      
      // Show success message
      toast({
        title: "Goodbye!",
        description: "Successfully logged out",
      });
      
      // Very brief delay to show the toast, then reload
      setTimeout(() => {
        window.location.href = window.location.pathname; // Full navigation to clear everything
      }, 500);
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Force logout by clearing everything and reloading
      setUser(null);
      setUserBalance(0);
      setIsAdmin(false);
      
      // Clear all localStorage
      localStorage.removeItem('admin_users');
      localStorage.removeItem('user_balances');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
      
      toast({
        title: "Logged out!",
        description: "Session cleared",
      });
      
      // Force navigation to clear all state
      setTimeout(() => {
        window.location.href = window.location.pathname;
      }, 500);
    }
  };

  const handleTopUp = async (amount: number, method: string, details?: any) => {
    try {
      if (method === "crypto_ticket" || method === "giftcard_ticket") {
        // Create a support ticket for top-up requests
        const { error } = await supabase
          .from('support_tickets')
          .insert({
            user_id: user?.id,
            subject: `Top-up Request - ${method === "crypto_ticket" ? "Crypto" : "Gift Card"}`,
            message: details.message,
            status: 'open',
            category: 'payment'
          });
        
        if (error) throw error;
        
        // Add initial message from user
        const { data: ticketData } = await supabase
          .from('support_tickets')
          .select('id')
          .eq('user_id', user?.id)
          .eq('subject', `Top-up Request - ${method === "crypto_ticket" ? "Crypto" : "Gift Card"}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (ticketData) {
          // Add user message
          await supabase
            .from('ticket_messages')
            .insert({
              ticket_id: ticketData.id,
              user_id: user?.id,
              message: details.message,
              is_admin: false
            });
          
          // Add admin welcome message
          const adminUser = await supabase
            .from('auth.users')
            .select('id')
            .eq('email', 'zhirocomputer@gmail.com')
            .single();
          
          if (adminUser.data) {
            await supabase
              .from('ticket_messages')
              .insert({
                ticket_id: ticketData.id,
                user_id: adminUser.data.id,
                message: `Hello! We've received your ${method === "crypto_ticket" ? "crypto" : "gift card"} top-up request. We'll process this shortly and get back to you.`,
                is_admin: true
              });
          }
        }
        
        toast({
          title: "Ticket Created",
          description: "Your top-up request has been submitted. Check 'My Tickets' for updates.",
        });
      } else if (method === "crypto") {
        // Legacy crypto payment flow (if still needed)
        const { data, error } = await supabase.functions.invoke('create-payment', {
          body: { amount: amount * 100 }
        });
        
        if (error) throw error;
        
        if (data?.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Top-up error:', error);
      const errorInfo = handleSupabaseError(error, "Failed to create support ticket");
      toast(errorInfo);
    }
  };

  const handleGameClick = (gameId: string) => {
    setLocation(`/game/${gameId}`);
  };

  const handleUpdateGame = (gameId: string, newImageUrl: string, newDescription: string) => {
    const updatedGames = games.map(game => 
      game.id === gameId ? { ...game, imageUrl: newImageUrl, description: newDescription } : game
    );
    setGames(updatedGames);
    // Save to localStorage for persistence
    localStorage.setItem('admin_games', JSON.stringify(updatedGames));
  };

  const handleGamesUpdate = (updatedGames: typeof GAMES) => {
    setGames(updatedGames);
    logAdminAction('UPDATE_GAMES', 'Updated games configuration', user?.email);
  };



  const handleHomepageContentUpdate = (newContent: any) => {
    setHomepageContent(newContent);
    logAdminAction('UPDATE_HOMEPAGE', 'Updated homepage content', user?.email);
  };

  // Announcement helper functions
  const refreshAnnouncements = () => {
    const savedAnnouncements = localStorage.getItem('admin_announcements');
    if (savedAnnouncements) {
      try {
        const allAnnouncements = JSON.parse(savedAnnouncements);
        const activeAnnouncements = allAnnouncements.filter((ann: any) => {
          if (!ann.active) return false;
          if (ann.expires_at && new Date(ann.expires_at) < new Date()) return false;
          return true;
        });
        setAnnouncements(activeAnnouncements);
      } catch (error) {
        console.error('Error loading announcements:', error);
      }
    }
  };

  const dismissAnnouncement = (announcementId: string) => {
    const newDismissed = [...dismissedAnnouncements, announcementId];
    setDismissedAnnouncements(newDismissed);
    localStorage.setItem('dismissed_announcements', JSON.stringify(newDismissed));
  };

  const getAnnouncementStyle = (type: string) => {
    switch (type) {
      case 'sale':
        return 'border-gaming-success bg-gaming-success/10 text-gaming-success';
      case 'warning':
        return 'border-gaming-warning bg-gaming-warning/10 text-gaming-warning';
      case 'success':
        return 'border-green-500 bg-green-500/10 text-green-500';
      default:
        return 'border-blue-500 bg-blue-500/10 text-blue-500';
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'sale': return '💰';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(
    (ann: any) => !dismissedAnnouncements.includes(ann.id)
  );


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading 592 Stock...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background">
      <Navbar
        user={user}
        userBalance={userBalance}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
      />
      
      {/* Verification Banner */}
      {user && !user.email_confirmed_at && (
        <div className="bg-gaming-warning/20 border-gaming-warning border-t border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-gaming-warning text-2xl">⚠️</div>
                <div>
                  <h3 className="font-semibold text-gaming-warning">Email Verification Required</h3>
                  <p className="text-sm text-muted-foreground">
                    Please verify your email to access profile customization and full features.
                  </p>
                </div>
              </div>
              <Button
                onClick={async () => {
                  try {
                    const { error } = await supabase.auth.resend({
                      type: 'signup',
                      email: user.email
                    });
                    
                    if (error) throw error;
                    
                    toast({
                      title: "Verification email sent",
                      description: "Check your email for the verification link",
                    });
                  } catch (error) {
                    toast({
                      title: "Failed to send email",
                      description: "Please try again later",
                      variant: "destructive",
                    });
                  }
                }}
                variant="outline"
                size="sm"
                className="border-gaming-warning text-gaming-warning hover:bg-gaming-warning/10"
              >
                Resend Email
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Announcements */}
      {visibleAnnouncements.length > 0 && (
        <div className="container mx-auto px-4 py-4 space-y-3">
          {visibleAnnouncements.map((announcement: any) => (
            <Card key={announcement.id} className={`${getAnnouncementStyle(announcement.type)} border-2`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getAnnouncementIcon(announcement.type)}</span>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        <Badge className={`${getAnnouncementStyle(announcement.type)} text-xs`}>
                          {announcement.type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm opacity-90">{announcement.content}</p>
                      {announcement.expires_at && (
                        <p className="text-xs opacity-70 mt-1">
                          Expires: {new Date(announcement.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => dismissAnnouncement(announcement.id)}
                    variant="ghost"
                    size="sm"
                    className="opacity-70 hover:opacity-100"
                  >
                    ✕
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Hero Section */}
      <div className="relative bg-gradient-hero">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="flex justify-center mb-4">
            {isAdminMode && user && (user.email === 'zhirocomputer@gmail.com' || user.email === 'ajay123phone@gmail.com') && (
              <AdminHomepageEditor 
                content={homepageContent}
                onContentUpdate={handleHomepageContentUpdate}
              />
            )}
          </div>
          
          <h1 className="text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            {homepageContent.hero.title}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {homepageContent.hero.subtitle}
          </p>
          
          <div className="flex flex-col gap-6 justify-center items-center">
            <div className="flex items-center space-x-2">
              {homepageContent.hero.badges.map((badge) => (
                <Badge key={badge.id} variant="secondary" className={`${badge.color} text-black`}>
                  {badge.emoji.startsWith('http://') || badge.emoji.startsWith('https://') || badge.emoji.startsWith('data:image/') ? (
                    <img src={badge.emoji} alt="Badge icon" className="w-4 h-4 inline mr-1 object-cover rounded" />
                  ) : (
                    <span className="mr-1">{badge.emoji}</span>
                  )}
                  {badge.text}
                </Badge>
              ))}
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <TopUpModal user={user} />
            </div>
          </div>
        </div>
      </div>

      {/* Games Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <h2 className="text-3xl font-bold text-primary">Browse Games</h2>
            {isAdminMode && user && (user.email === 'zhirocomputer@gmail.com' || user.email === 'ajay123phone@gmail.com') && (
              <>
                <AdminGameEditor 
                  games={games}
                  defaultGames={GAMES}
                  onGamesUpdate={handleGamesUpdate}
                />
                <AdminCatalogEditor 
                  games={games}
                />
              </>
            )}
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select your favorite game to explore available items and start trading
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game) => (
            <GameCard
              key={game.id}
              title={game.title}
              description={game.description}
              imageUrl={game.imageUrl}
              itemCount={game.itemCount}
              onClick={() => handleGameClick(game.id)}
              onUpdateGame={(newImageUrl, newDescription) => handleUpdateGame(game.id, newImageUrl, newDescription)}
            />
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-card py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-primary">{homepageContent.features.title}</h2>
            <p className="text-muted-foreground">{homepageContent.features.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homepageContent.features.items.map((feature) => (
              <Card key={feature.id} className="bg-background border-primary/20">
                <CardHeader className="text-center">
                  <div className="mb-2 flex justify-center">
                    {feature.emoji.startsWith('http://') || feature.emoji.startsWith('https://') || feature.emoji.startsWith('data:image/') ? (
                      <img src={feature.emoji} alt="Feature icon" className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <span className="text-4xl">{feature.emoji}</span>
                    )}
                  </div>
                  <CardTitle className="text-primary">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <LiveChat user={user} />
      
      {/* Debug Panel for Email Verification - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button 
            onClick={() => {
              console.log('=== EMAIL VERIFICATION DEBUG ===');
              console.log('Current user:', user);
              console.log('User email_confirmed_at:', user?.email_confirmed_at);
              console.log('User email:', user?.email);
              console.log('User created_at:', user?.created_at);
              console.log('================================');
            }}
            variant="outline" 
            size="sm"
            className="bg-red-500 text-white hover:bg-red-600"
          >
            Debug Auth
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;
