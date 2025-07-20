import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

export const SupabaseDiagnostic = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [running, setRunning] = useState(false);

  const addResult = (test: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any) => {
    setResults(prev => [...prev, { test, status, message, details }]);
  };

  const runDiagnostics = async () => {
    setRunning(true);
    setResults([]);
    
    // 1. Supabase Client Setup
    addResult('Client Setup', 'pass', 'Supabase client initialized');
    
    // Check URL and Key format
    const url = import.meta.env?.VITE_SUPABASE_URL || "https://uahxenisnppufpswupnz.supabase.co";
    const key = import.meta.env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";
    
    addResult('Supabase URL', 
      url.includes('supabase.co') ? 'pass' : 'fail',
      url.includes('supabase.co') ? `URL looks correct: ${url}` : `URL looks invalid: ${url}`,
      { url }
    );
    
    addResult('API Key Format', 
      key.startsWith('eyJ') ? 'pass' : 'fail',
      key.startsWith('eyJ') ? 'API key format looks correct (JWT)' : 'API key format looks invalid',
      { keyPrefix: key.substring(0, 20) + '...' }
    );

    // 2. Authentication Status
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      addResult('Authentication - getUser()', 
        user ? 'pass' : 'warning',
        user ? `User found: ${user.email}` : 'No user from getUser()',
        { user: user ? { id: user.id, email: user.email } : null, error: userError }
      );
      
      addResult('Authentication - getSession()', 
        session ? 'pass' : 'warning',
        session ? `Session found: ${session.user?.email}` : 'No session found',
        { session: session ? { user: { id: session.user?.id, email: session.user?.email } } : null, error: sessionError }
      );
      
      // 3. Test simple query to check permissions
      try {
        console.log('Testing basic query access...');
        const { data: testData, error: testError } = await supabase
          .from('support_tickets')
          .select('count')
          .limit(1);
          
        addResult('Database Query Test', 
          testError ? 'fail' : 'pass',
          testError ? `Query failed: ${testError.message}` : 'Basic query succeeded',
          { data: testData, error: testError }
        );
        
        // 4. Test table access specifically
        const { data: ticketsData, error: ticketsError, count } = await supabase
          .from('support_tickets')
          .select('*', { count: 'exact' })
          .limit(5);
          
        addResult('Support Tickets Table', 
          ticketsError ? 'fail' : 'pass',
          ticketsError ? `Table access failed: ${ticketsError.message}` : `Table accessible, found ${count} tickets`,
          { data: ticketsData, error: ticketsError, count }
        );
        
        // 5. Test ticket_messages table
        const { data: messagesData, error: messagesError, count: msgCount } = await supabase
          .from('ticket_messages')
          .select('*', { count: 'exact' })
          .limit(5);
          
        addResult('Ticket Messages Table', 
          messagesError ? 'fail' : 'pass',
          messagesError ? `Messages table failed: ${messagesError.message}` : `Messages table accessible, found ${msgCount} messages`,
          { data: messagesData, error: messagesError, count: msgCount }
        );
        
        // 6. Test insert permissions (if user is logged in)
        if (user) {
          try {
            const testTicket = {
              user_id: user.id,
              subject: 'DIAGNOSTIC TEST TICKET',
              message: 'This is a test ticket created by diagnostic tool',
              status: 'open',
              category: 'general'
            };
            
            const { data: insertData, error: insertError } = await supabase
              .from('support_tickets')
              .insert(testTicket)
              .select();
              
            if (insertError) {
              addResult('Insert Test', 'fail', `Insert failed: ${insertError.message}`, { error: insertError });
            } else {
              addResult('Insert Test', 'pass', 'Insert permissions working', { data: insertData });
              
              // Clean up test ticket
              if (insertData && insertData[0]) {
                await supabase
                  .from('support_tickets')
                  .delete()
                  .eq('id', insertData[0].id);
                addResult('Cleanup', 'pass', 'Test ticket cleaned up');
              }
            }
          } catch (insertTestError) {
            addResult('Insert Test', 'fail', `Insert test threw error: ${insertTestError}`, { error: insertTestError });
          }
        } else {
          addResult('Insert Test', 'warning', 'Skipped - no authenticated user');
        }
        
      } catch (queryError) {
        addResult('Database Query Test', 'fail', `Query threw error: ${queryError}`, { error: queryError });
      }
      
    } catch (authError) {
      addResult('Authentication Check', 'fail', `Auth check failed: ${authError}`, { error: authError });
    }
    
    // 7. Environment Variables Check
    const envUrl = import.meta.env?.VITE_SUPABASE_URL;
    const envKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    
    addResult('Environment Variables', 
      envUrl && envKey ? 'pass' : 'warning',
      envUrl && envKey ? 'Environment variables found' : 'Using hardcoded values (check .env file)',
      { envUrl: envUrl ? 'Set' : 'Not set', envKey: envKey ? 'Set' : 'Not set' }
    );
    
    // 8. Network connectivity test
    try {
      const response = await fetch(`${url}/rest/v1/`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      
      addResult('Network Connectivity', 
        response.ok ? 'pass' : 'fail',
        response.ok ? `API endpoint reachable (${response.status})` : `API endpoint unreachable (${response.status})`,
        { status: response.status, statusText: response.statusText }
      );
    } catch (networkError) {
      addResult('Network Connectivity', 'fail', `Network error: ${networkError}`, { error: networkError });
    }
    
    setRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-500';
      case 'fail': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          🔍 Supabase Diagnostic Tool
          <Button onClick={runDiagnostics} disabled={running}>
            {running ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {results.length > 0 && (
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getStatusIcon(result.status)}</span>
                      <span className="font-medium">{result.test}</span>
                    </div>
                    <Badge className={`${getStatusColor(result.status)} text-white`}>
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                  
                  {result.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">Show Details</summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {results.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            Click "Run Diagnostics" to check your Supabase setup
          </div>
        )}
      </CardContent>
    </Card>
  );
};