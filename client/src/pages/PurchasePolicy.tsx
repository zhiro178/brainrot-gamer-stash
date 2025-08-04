import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, handleSupabaseError } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/adminLogging";

const PurchasePolicy = () => {
  const [user, setUser] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user balance
  const fetchUserBalance = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching balance:', error);
        return;
      }

      const balance = data?.balance || 0;
      setUserBalance(balance);
      setBalanceLoading(false);
      
      // Cache the balance
      localStorage.setItem(`user_balance_${userId}`, balance.toString());
    } catch (error) {
      console.error('Error fetching user balance:', error);
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Load cached balance immediately if available
        const cachedBalance = localStorage.getItem(`user_balance_${session.user.id}`);
        if (cachedBalance) {
          setUserBalance(parseFloat(cachedBalance));
          setBalanceLoading(false);
        }
        // Then fetch fresh balance
        fetchUserBalance(session.user.id);
      } else {
        setBalanceLoading(false);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Load cached balance immediately if available
        const cachedBalance = localStorage.getItem(`user_balance_${session.user.id}`);
        if (cachedBalance) {
          setUserBalance(parseFloat(cachedBalance));
          setBalanceLoading(false);
        }
        // Then fetch fresh balance
        fetchUserBalance(session.user.id);
      } else {
        setUserBalance(null);
        setBalanceLoading(false);
        // Clear cached balance on logout
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('user_balance_')) {
            localStorage.removeItem(key);
          }
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
          emailRedirectTo: `${window.location.origin}/?verified=true`,
          data: {
            email_confirm: true // Explicitly require email confirmation
          }
        }
      });
      
      if (error) {
        const errorInfo = handleSupabaseError(error, "Registration failed");
        toast(errorInfo);
        return;
      }
      
      // Check if user was created but not confirmed
      if (data.user && !data.session) {
        logAdminAction('USER_REGISTERED', `New unverified user registered: ${email}`, 'system');
        
        toast({
          title: "Account Created! 📧",
          description: "Please check your email and click the verification link to activate your account. Check your spam folder if you don't see it.",
        });
      } else if (data.session) {
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
      setUserBalance(null);
      setBalanceLoading(false);
      
      // Clear cached user balances
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('user_balance_')) {
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
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Force logout by clearing everything
      setUser(null);
      setUserBalance(null);
      setBalanceLoading(false);
      
      toast({
        title: "Logged out",
        description: "Session ended",
      });
    }
  };

  const handleUserUpdate = () => {
    if (user?.id) {
      fetchUserBalance(user.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        user={user}
        userBalance={userBalance || 0}
        balanceLoading={balanceLoading}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
      />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Purchase Policy
            </h1>
            <p className="text-muted-foreground text-lg">
              Important information about purchasing items on 592 Stock
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  🛒 Purchase Process
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  All purchases on 592 Stock are processed securely through our payment system. 
                  We accept multiple payment methods including crypto and gift cards.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Add items to your cart and proceed to checkout</li>
                  <li>Select your preferred payment method</li>
                  <li>Complete payment verification</li>
                  <li>Receive your items instantly upon successful payment</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  💰 Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>We accept the following payment methods:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Cryptocurrency (Bitcoin, Ethereum, and other supported coins)</li>
                  <li>Gift cards (Roblox, Steam, Amazon, and other popular cards)</li>
                  <li>Account balance (top-up your 592 Stock balance)</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  All payments are processed securely. We do not store payment information.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  📦 Delivery Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  We provide instant delivery for all digital gaming items:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Items are delivered immediately after successful payment</li>
                  <li>You will receive detailed instructions for claiming your items</li>
                  <li>Our support team is available 24/7 to assist with delivery</li>
                  <li>Delivery method varies by game (trade, code, or direct transfer)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  🔄 Refund Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  We want you to be completely satisfied with your purchase:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Refunds are available within 24 hours if items cannot be delivered</li>
                  <li>Issues with item delivery will be resolved by our support team</li>
                  <li>Refunds are processed to your 592 Stock balance or original payment method</li>
                  <li>Contact support immediately if you experience any issues</li>
                </ul>
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  ⚠️ Digital items cannot be refunded once successfully delivered and claimed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  🛡️ Security & Safety
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Your security is our top priority:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>All transactions are encrypted and secure</li>
                  <li>We never ask for your game passwords or personal information</li>
                  <li>Items are sourced from verified and trusted suppliers</li>
                  <li>Your account information is protected and never shared</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  📞 Contact & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Need help with your purchase? Our support team is here to assist:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>24/7 live chat support available on all pages</li>
                  <li>Create a support ticket for detailed assistance</li>
                  <li>Response time: typically within 1-2 hours</li>
                  <li>All purchase issues are resolved quickly and fairly</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              By making a purchase, you agree to these terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasePolicy;