import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

export const EmailVerificationDebug = () => {
  const [authState, setAuthState] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkAuthState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      
      setAuthState({
        session: session,
        user: user,
        timestamp: new Date().toISOString()
      });
    };

    checkAuthState();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthState({
        event,
        session,
        user: session?.user || null,
        timestamp: new Date().toISOString()
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const testEmailSettings = async () => {
    try {
      // Test with a dummy email to see the error response
      const { data, error } = await supabase.auth.signUp({
        email: 'test-debug@example.com',
        password: 'testpassword123',
        options: {
          emailRedirectTo: `${window.location.origin}/?verified=true`
        }
      });
      
      console.log('Debug signup test:', { data, error });
      
      // Immediately sign out the test account
      if (data.session) {
        await supabase.auth.signOut();
      }
      
    } catch (error) {
      console.error('Debug signup error:', error);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)} 
        variant="outline" 
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        Debug Auth
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto z-50 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          Auth Debug Panel
          <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">✕</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <div>
          <strong>Current User:</strong>
          <div className="mt-1 p-2 bg-muted rounded">
            <div>Email: {authState?.user?.email || 'None'}</div>
            <div>Verified: {authState?.user?.email_confirmed_at ? 
              <Badge className="bg-green-500 text-white">Yes</Badge> : 
              <Badge variant="destructive">No</Badge>
            }</div>
            <div>Session: {authState?.session ? 
              <Badge className="bg-blue-500 text-white">Active</Badge> : 
              <Badge variant="secondary">None</Badge>
            }</div>
          </div>
        </div>
        
        <div>
          <strong>Email Confirmation Data:</strong>
          <div className="mt-1 p-2 bg-muted rounded">
            <div>email_confirmed_at: {authState?.user?.email_confirmed_at || 'null'}</div>
            <div>confirmation_sent_at: {authState?.user?.confirmation_sent_at || 'null'}</div>
          </div>
        </div>

        <div>
          <strong>Raw User Object:</strong>
          <div className="mt-1 p-2 bg-muted rounded">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(authState?.user, null, 2)}
            </pre>
          </div>
        </div>

        <div className="space-y-2">
          <Button onClick={testEmailSettings} size="sm" className="w-full">
            Test Email Config
          </Button>
          <div className="text-xs text-muted-foreground">
            Check browser console for test results
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <strong>Troubleshooting:</strong>
          <ul className="mt-1 space-y-1">
            <li>• If email_confirmed_at is not null for new users, email verification is disabled</li>
            <li>• Check Supabase Dashboard → Authentication → Settings</li>
            <li>• Ensure "Enable email confirmations" is turned ON</li>
            <li>• Check Email Templates are configured</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};