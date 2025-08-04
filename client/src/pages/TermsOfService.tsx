import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase, handleSupabaseError } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";
import { useLocation } from "wouter";

const TermsOfService = () => {
  const [user, setUser] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { setIsAdmin, isAdminMode, toggleAdminMode } = useAdmin();
  const [, setLocation] = useLocation();

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
              Terms of Service
            </h1>
            <p className="text-muted-foreground text-lg">
              Please read these terms carefully before using 592 Stock
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  📋 Acceptance of Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  By accessing and using 592 Stock, you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, 
                  please do not use this service.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">ℹ️</span>
                    <span>These terms apply to all visitors, users, and others who access or use our service.</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  👤 User Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>To use our service, you must:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Be at least 13 years old or have parental consent</li>
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Verify your email address to activate full account features</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">💡</span>
                    <span><strong>Security Tip:</strong> We recommend using a strong, unique password for your account security.</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  🛍️ Service Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  592 Stock provides a digital marketplace for gaming items including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Virtual items from popular Roblox games</li>
                  <li>Secure payment processing and instant delivery</li>
                  <li>Customer support and account management</li>
                  <li>Balance management and transaction history</li>
                </ul>
                <p className="text-muted-foreground">
                  We reserve the right to modify or discontinue any part of our service 
                  with reasonable notice to users.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  ⚖️ User Responsibilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>As a user of 592 Stock, you agree to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Use the service only for lawful purposes</li>
                  <li>Not attempt to circumvent security measures</li>
                  <li>Not engage in fraudulent or deceptive practices</li>
                  <li>Respect the intellectual property rights of others</li>
                  <li>Not share your account credentials with others</li>
                  <li>Report any suspicious activity or security breaches</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  🚫 Prohibited Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>The following activities are strictly prohibited:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Attempting to hack, exploit, or damage our systems</li>
                  <li>Using automated tools to access our service (bots, scripts)</li>
                  <li>Creating multiple accounts to circumvent restrictions</li>
                  <li>Engaging in money laundering or illegal financial activities</li>
                  <li>Harassing other users or our support staff</li>
                  <li>Posting or sharing inappropriate content</li>
                </ul>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">⚠️</span>
                    <span><strong>Warning:</strong> Violation of these terms may result in account suspension or termination.</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  💳 Payment Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Regarding payments and transactions:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>All prices are displayed in USD unless otherwise noted</li>
                  <li>Payment processing is handled securely by our partners</li>
                  <li>Chargebacks may result in account restrictions</li>
                  <li>Account balances are non-transferable between users</li>
                  <li>We reserve the right to verify payment sources</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  🔒 Privacy & Data Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Your privacy is important to us:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>We collect only necessary information to provide our service</li>
                  <li>Your personal data is protected and never sold to third parties</li>
                  <li>We use encryption to secure sensitive information</li>
                  <li>You can request deletion of your account and data</li>
                  <li>We comply with applicable data protection regulations</li>
                </ul>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800 flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">🔐</span>
                    <span>Your data is encrypted both in transit and at rest using industry-standard protocols.</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                  ⚠️ Disclaimers & Limitations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Important legal information:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Our service is provided "as is" without warranties</li>
                  <li>We are not liable for any losses from service interruptions</li>
                  <li>Digital items have no real-world monetary value</li>
                  <li>Game publishers may change their terms affecting our service</li>
                  <li>Our liability is limited to the amount paid for services</li>
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
                  If you have questions about these Terms of Service, please contact us:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Use our 24/7 live chat support</li>
                  <li>Create a support ticket for detailed inquiries</li>
                  <li>All terms-related questions will be answered promptly</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-2">Terms Effective Date</h3>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                These terms are effective immediately and supersede all previous versions.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                By continuing to use our service, you acknowledge that you have read, understood, and agree to be bound by these terms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;