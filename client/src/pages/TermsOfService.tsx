import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase, handleSupabaseError } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction } from "@/lib/adminLogging";

const TermsOfService = () => {
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
                <p className="text-muted-foreground">
                  These terms apply to all visitors, users, and others who access or use our service.
                </p>
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
                <p className="text-sm bg-blue-50 text-blue-700 p-3 rounded-lg">
                  ℹ️ We recommend using a strong, unique password for your account security.
                </p>
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
                <p className="text-sm bg-red-50 text-red-700 p-3 rounded-lg">
                  ⚠️ Violation of these terms may result in account suspension or termination.
                </p>
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
                  🔒 Privacy & Data
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
                  📞 Contact Information
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

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              These terms are effective immediately and supersede all previous versions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;