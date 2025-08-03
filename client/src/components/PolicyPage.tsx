import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { simpleSupabase as workingSupabase } from '@/lib/simple-supabase';
import { useAuth } from '@/contexts/AuthContext';

interface PolicySection {
  id: string;
  emoji: string;
  title: string;
  content: string;
  items?: string[];
  note?: string;
  noteType?: 'info' | 'warning' | 'success';
}

interface PolicyContent {
  title: string;
  subtitle: string;
  content: PolicySection[];
  updated_at: string;
}

interface PolicyPageProps {
  policyType: 'privacy-policy' | 'terms-of-service';
  fallbackContent?: PolicyContent;
}

export const PolicyPage: React.FC<PolicyPageProps> = ({ policyType, fallbackContent }) => {
  const [policyContent, setPolicyContent] = useState<PolicyContent | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPolicyContent();
  }, [policyType]);

  const fetchPolicyContent = async () => {
    try {
      const { data, error } = await workingSupabase
        .from('policy_content')
        .select('*')
        .eq('policy_type', policyType)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching policy content:', error);
        setPolicyContent(fallbackContent || null);
      } else if (data) {
        setPolicyContent({
          title: data.title,
          subtitle: data.subtitle,
          content: data.content,
          updated_at: data.updated_at
        });
      } else {
        setPolicyContent(fallbackContent || null);
      }
    } catch (err) {
      console.error('Error loading policy:', err);
      setPolicyContent(fallbackContent || null);
    } finally {
      setLoading(false);
    }
  };

  const renderNoteCard = (note: string, noteType?: string) => {
    const bgClass = noteType === 'warning' ? 'bg-red-50 text-red-700' :
                   noteType === 'success' ? 'bg-green-50 text-green-700' :
                   'bg-blue-50 text-blue-700';
    
    return (
      <p className={`text-sm ${bgClass} p-3 rounded-lg`}>
        {note}
      </p>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar 
          user={user}
          userBalance={0}
          balanceLoading={false}
          onLogin={() => {}}
          onRegister={() => {}}
          onLogout={() => {}}
          onUserUpdate={() => {}}
        />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!policyContent) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar 
          user={user}
          userBalance={0}
          balanceLoading={false}
          onLogin={() => {}}
          onRegister={() => {}}
          onLogout={() => {}}
          onUserUpdate={() => {}}
        />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4 text-red-500">
              Content Not Available
            </h1>
            <p className="text-muted-foreground">
              We're sorry, but this content is currently unavailable. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        user={user}
        userBalance={0}
        balanceLoading={false}
        onLogin={() => {}}
        onRegister={() => {}}
        onLogout={() => {}}
        onUserUpdate={() => {}}
      />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              {policyContent.title}
            </h1>
            <p className="text-muted-foreground text-lg">
              {policyContent.subtitle}
            </p>
          </div>

          <div className="space-y-6">
            {policyContent.content.map((section: PolicySection) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    {section.emoji} {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>{section.content}</p>
                  {section.items && section.items.length > 0 && (
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      {section.items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.note && renderNoteCard(section.note, section.noteType)}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Last updated: {policyContent.updated_at ? 
                new Date(policyContent.updated_at).toLocaleDateString() : 
                new Date().toLocaleDateString()
              }
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This policy is effective immediately and supersedes all previous versions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};