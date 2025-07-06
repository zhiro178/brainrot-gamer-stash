import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

export const DiagnosticPanel = () => {
  const [results, setResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    const testResults: any = {};

    // Test 1: Basic connection
    try {
      const { data, error } = await supabase.from('test_table').select('*').limit(1);
      testResults.connection = error?.code === '42P01' ? 'success' : 'failed';
      testResults.connectionDetail = error?.message || 'Connected';
    } catch (error) {
      testResults.connection = 'failed';
      testResults.connectionDetail = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test 2: Auth service
    try {
      const { data: session } = await supabase.auth.getSession();
      testResults.auth = 'success';
      testResults.authDetail = session ? 'Session exists' : 'No session';
    } catch (error) {
      testResults.auth = 'failed';
      testResults.authDetail = error instanceof Error ? error.message : 'Auth failed';
    }

    // Test 3: Simple query
    try {
      const { error } = await supabase.from('dummy').select('id').limit(1);
      testResults.query = error?.code === '42P01' ? 'success' : 'failed';
      testResults.queryDetail = error?.message || 'Query executed';
    } catch (error) {
      testResults.query = 'failed';
      testResults.queryDetail = error instanceof Error ? error.message : 'Query failed';
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500 text-white">✓ Working</Badge>;
      case 'failed':
        return <Badge variant="destructive">✗ Failed</Badge>;
      default:
        return <Badge variant="secondary">? Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Supabase Connection Diagnostics
          <Button onClick={runDiagnostics} disabled={testing} size="sm">
            {testing ? 'Testing...' : 'Run Tests'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {results.connection && (
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">Basic Connection</div>
                <div className="text-sm text-muted-foreground">{results.connectionDetail}</div>
              </div>
              {getStatusBadge(results.connection)}
            </div>
          )}
          
          {results.auth && (
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">Authentication Service</div>
                <div className="text-sm text-muted-foreground">{results.authDetail}</div>
              </div>
              {getStatusBadge(results.auth)}
            </div>
          )}
          
          {results.query && (
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-medium">Database Query</div>
                <div className="text-sm text-muted-foreground">{results.queryDetail}</div>
              </div>
              {getStatusBadge(results.query)}
            </div>
          )}
          
          {Object.keys(results).length === 0 && !testing && (
            <div className="text-center py-6 text-muted-foreground">
              Click "Run Tests" to diagnose Supabase connection issues
            </div>
          )}
        </div>
        
        {Object.keys(results).length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded text-sm">
            <strong>Solutions:</strong>
            <ul className="mt-2 space-y-1">
              <li>• If connection failed: Check if Supabase project is active</li>
              <li>• If auth failed: Verify API keys are correct</li>
              <li>• If query failed: Check CORS settings in Supabase dashboard</li>
              <li>• Try refreshing the page or restarting the dev server</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};