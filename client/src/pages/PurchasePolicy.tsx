import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, handleSupabaseError } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";

const PurchasePolicy = () => {
  const [user, setUser] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { setIsAdmin, isAdminMode, toggleAdminMode } = useAdmin();

  // Fetch user balance
  const fetchUserBalance = async (userId: string) => {
    try {
      setBalanceLoading(true);
      console.log('Fetching balance for user:', userId);
      
      const { simpleSupabase: workingSupabase } = await import('@/lib/simple-supabase');
      
      const { data, error } = await workingSupabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching balance:', error);
        if (error.code === 'PGRST116') {
          // No balance record found, create one
          const { data: newBalance, error: createError } = await workingSupabase
            .from('user_balances')
            .insert([{ user_id: userId, balance: 0 }])
            .select('balance')
            .single();

          if (createError) {
            console.error('Error creating balance record:', createError);
            setUserBalance(0);
          } else {
            console.log('Created new balance record:', newBalance);
            setUserBalance(newBalance.balance);
            localStorage.setItem(`user_balance_${userId}`, newBalance.balance.toString());
          }
        }
      } else {
        console.log('Balance fetched successfully:', data);
        setUserBalance(data.balance);
        localStorage.setItem(`user_balance_${userId}`, data.balance.toString());
      }
    } catch (error) {
      console.error('Error in fetchUserBalance:', error);
      setUserBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  // Authentication setup
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Load cached balance immediately if available
        const cachedBalance = localStorage.getItem(`user_balance_${session.user.id}`);
        if (cachedBalance) {
          console.log('Loading cached balance on initial session:', cachedBalance);
          setUserBalance(parseFloat(cachedBalance));
          setBalanceLoading(false);
        }
        // Then fetch fresh balance
        fetchUserBalance(session.user.id);
        // Set admin status if user is admin
        if (session.user.email === 'zhirocomputer@gmail.com' || session.user.email === 'ajay123phone@gmail.com') {
          setIsAdmin(true);
        }
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
          console.log('Loading cached balance on auth change:', cachedBalance);
          setUserBalance(parseFloat(cachedBalance));
          setBalanceLoading(false);
        }
        // Then fetch fresh balance
        fetchUserBalance(session.user.id);
        // Set admin status if user is admin
        if (session.user.email === 'zhirocomputer@gmail.com' || session.user.email === 'ajay123phone@gmail.com') {
          setIsAdmin(true);
        }
      } else {
        setUserBalance(null);
        setBalanceLoading(false);
        setIsAdmin(false);
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

  // Authentication handlers
  const handleLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login successful!",
        description: "Welcome back to 592 Stock!",
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: handleSupabaseError(error),
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error logging out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (email: string, password: string, username: string) => {
    try {
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account.",
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: handleSupabaseError(error),
        variant: "destructive",
      });
    }
  };

  const handleUserUpdate = () => {
    if (user?.id) {
      fetchUserBalance(user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        user={user}
        userBalance={userBalance}
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
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-amber-600 mt-0.5">⚠️</span>
                    <span><strong>Important:</strong> Digital items cannot be refunded once successfully delivered and claimed.</span>
                  </p>
                </div>
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