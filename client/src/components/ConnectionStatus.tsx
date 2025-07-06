import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const ConnectionStatus = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const { toast } = useToast();

  const testConnection = async () => {
    setStatus('checking');
    
    try {
      // Simple test to check if Supabase is reachable
      const { data, error } = await supabase.from('dummy_table').select('*').limit(1);
      
      if (error && (error.code === '42P01' || error.message.includes('table') || error.message.includes('relation'))) {
        // This error is expected - table doesn't exist but connection works
        setStatus('connected');
      } else if (error) {
        // Real connection error
        console.error('Connection test failed:', error);
        setStatus('failed');
      } else {
        setStatus('connected');
      }
      
      setLastChecked(new Date());
    } catch (error) {
      console.error('Connection test error:', error);
      setStatus('failed');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      case 'connected':
        return <Badge className="bg-gaming-success text-black">Connected</Badge>;
      case 'failed':
        return <Badge variant="destructive">Connection Failed</Badge>;
    }
  };

  const retryConnection = async () => {
    await testConnection();
    toast({
      title: status === 'connected' ? "Connection restored" : "Connection still failing",
      description: status === 'connected' 
        ? "Supabase connection is working properly" 
        : "Unable to reach Supabase servers",
      variant: status === 'connected' ? "default" : "destructive"
    });
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span>Supabase:</span>
      {getStatusBadge()}
      {status === 'failed' && (
        <Button
          onClick={retryConnection}
          size="sm"
          variant="outline"
          className="h-6 text-xs"
        >
          Retry
        </Button>
      )}
      {lastChecked && (
        <span className="text-xs text-muted-foreground">
          {lastChecked.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};