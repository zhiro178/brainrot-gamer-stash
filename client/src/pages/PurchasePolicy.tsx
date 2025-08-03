import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPolicyEditor } from '@/components/AdminPolicyEditor';
import { supabase } from '@/lib/supabase';
import { useAdmin } from '@/contexts/AdminContext';

interface PolicySection {
  id: string;
  title: string;
  content: string;
  bullets?: string[];
}

interface PolicyContent {
  sections: PolicySection[];
}

const PurchasePolicy = () => {
  const [user, setUser] = useState<any>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [policyTitle, setPolicyTitle] = useState('Purchase Policy');
  const [policyContent, setPolicyContent] = useState<PolicyContent>({ sections: [] });
  const { isAdminMode } = useAdmin();

  // Initialize user session and load policy content
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Get user balance if logged in
        if (currentUser) {
          setBalanceLoading(true);
          const { data: balanceData } = await supabase
            .from('user_balances')
            .select('balance')
            .eq('user_id', currentUser.id)
            .single();
          
          setUserBalance(balanceData?.balance || 0);
          setBalanceLoading(false);
        } else {
          setBalanceLoading(false);
        }

        // Load policy content
        const { data: policyData, error } = await supabase
          .from('policy_content')
          .select('title, content')
          .eq('policy_type', 'privacy_policy')
          .single();

        if (error) {
          console.error('Error loading policy:', error);
        } else if (policyData) {
          setPolicyTitle(policyData.title);
          setPolicyContent(policyData.content as PolicyContent);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setUser(data.user);
  };

  const handleRegister = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    setUser(data.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserBalance(null);
  };

  const handleUserUpdate = (updatedUser: any) => {
    setUser(updatedUser);
  };

  const handlePolicyUpdate = (newTitle: string, newContent: PolicyContent) => {
    setPolicyTitle(newTitle);
    setPolicyContent(newContent);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading policy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        user={user}
        userBalance={userBalance ?? 0}
        balanceLoading={balanceLoading}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
      />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {policyTitle}
              </h1>
              {isAdminMode && user && (user.email === 'zhirocomputer@gmail.com' || user.email === 'ajay123phone@gmail.com') && (
                <AdminPolicyEditor
                  policyType="privacy_policy"
                  currentTitle={policyTitle}
                  currentContent={policyContent}
                  onContentUpdate={handlePolicyUpdate}
                />
              )}
            </div>
            <p className="text-muted-foreground text-lg">
              Important information about purchasing items on 592 Stock
            </p>
          </div>

          <div className="space-y-6">
            {policyContent.sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{section.content}</p>
                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      {section.bullets.map((bullet, index) => (
                        <li key={index}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
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