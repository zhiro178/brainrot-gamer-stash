import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { createClient } from "@supabase/supabase-js";
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

// Import game banners
import adoptMeBanner from "@/assets/adopt-me-banner.jpg";
import gardenBanner from "@/assets/garden-banner.jpg";
import mm2Banner from "@/assets/mm2-banner.jpg";
import brainrotBanner from "@/assets/brainrot-banner.jpg";

// Temporary hardcoded values to bypass env issues
const supabaseUrl = "https://uahxenisnppufpswupnz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";

console.log('Using hardcoded Supabase credentials');

const supabase = createClient(supabaseUrl, supabaseKey);

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully logged in to 592 Stock",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Please check your email to confirm your account",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Logout Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Goodbye!",
          description: "Successfully logged out",
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
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
      toast({
        title: "Top-up Failed",
        description: "There was an error processing your request",
        variant: "destructive",
      });
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
  };



  const handleHomepageContentUpdate = (newContent: any) => {
    setHomepageContent(newContent);
  };


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
      
      {/* Hero Section */}
      <div className="relative bg-gradient-hero">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="flex justify-center mb-4">
            {isAdminMode && (
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
            {isAdminMode && (
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
    </div>
  );
};

export default Index;
