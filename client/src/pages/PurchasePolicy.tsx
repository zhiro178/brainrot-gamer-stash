import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase, handleSupabaseError } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";
import { useLocation } from "wouter";
import { PolicyRenderer } from "@/components/PolicyRenderer";

const PurchasePolicy = () => {
  const [user, setUser] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [policyData, setPolicyData] = useState<any>(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const { toast } = useToast();
  const { setIsAdmin, isAdminMode, toggleAdminMode } = useAdmin();
  const [, setLocation] = useLocation();

  // Fetch policy data
  const fetchPolicyData = async () => {
    try {
      setPolicyLoading(true);
      const { data, error } = await supabase
        .from('site_policies')
        .select('*')
        .eq('policy_type', 'purchase_policy')
        .single();

      if (error) {
        console.error('Error fetching policy:', error);
        // Use fallback data if database fails
        setPolicyData(null);
      } else {
        setPolicyData(data.content);
      }
    } catch (error) {
      console.error('Error in fetchPolicyData:', error);
      setPolicyData(null);
    } finally {
      setPolicyLoading(false);
    }
  };

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
    // Fetch policy data
    fetchPolicyData();

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

  // Removed logout functionality for policy pages

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

  // Default fallback policy data
  const defaultPolicyData = {
    sections: [
      {
        id: "purchase_process",
        icon: "🛒",
        title: "Purchase Process",
        content: {
          text: "All purchases on 592 Stock are processed securely through our payment system. We accept multiple payment methods including crypto and gift cards.",
          items: [
            "Add items to your cart and proceed to checkout",
            "Select your preferred payment method",
            "Complete payment verification",
            "Receive your items instantly upon successful payment"
          ]
        }
      },
      {
        id: "payment_methods",
        icon: "💰",
        title: "Payment Methods",
        content: {
          text: "We accept the following payment methods:",
          items: [
            "Cryptocurrency (Bitcoin, Ethereum, and other supported coins)",
            "Gift cards (Roblox, Steam, Amazon, and other popular cards)",
            "Account balance (top-up your 592 Stock balance)"
          ],
          note: "All payments are processed securely. We do not store payment information."
        }
      }
    ],
    footer: {
      text: "By making a purchase, you agree to these terms and conditions."
    }
  };

  if (loading || policyLoading) {
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
        onLogout={() => {}} // Disabled logout on policy pages
        onUserUpdate={handleUserUpdate}
      />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Homepage
            </Button>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Purchase Policy
            </h1>
            <p className="text-muted-foreground text-lg">
              Important information about purchasing items on 592 Stock
            </p>
          </div>

          <PolicyRenderer policyData={policyData || defaultPolicyData} />
        </div>
      </div>
    </div>
  );
};

export default PurchasePolicy;