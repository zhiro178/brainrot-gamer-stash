import React, { useState, useEffect, useRef } from 'react';
import { robustSupabase as workingSupabase } from '@/lib/robust-supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, User, UserCog, ShieldCheck, CheckCircle, AlertCircle, DollarSign, Gift, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

interface ModernTicketChatProps {
  ticketId: string;
  ticketSubject: string;
  currentUser: any;
  isAdmin?: boolean;
  ticketStatus?: string;
}

export const ModernTicketChat = ({ ticketId, ticketSubject, currentUser, isAdmin = false, ticketStatus = 'open' }: ModernTicketChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Check if ticket is closed/resolved and messaging should be disabled
  const isTicketClosed = ticketStatus === 'resolved' || ticketStatus === 'closed';
  const canMessage = !isTicketClosed;

  // Extract ticket info for summary
  const extractTicketInfo = (subject: string) => {
    const amountMatch = subject.match(/\$(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    let type = 'Gift Card';
    let icon = Gift;
    if (subject.toLowerCase().includes('crypto')) {
      type = 'Crypto';
      icon = CreditCard;
    }
    
    return { amount, type, icon };
  };

  const ticketInfo = extractTicketInfo(ticketSubject);

  useEffect(() => {
    if (!ticketId || !currentUser) {
      setError('Missing ticket ID or user information');
      setLoading(false);
      return;
    }

    fetchMessages();
    
    // Set up polling for new messages
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [ticketId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      if (!ticketId) {
        throw new Error('No ticket ID provided');
      }

      const { data, error } = await workingSupabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', parseInt(ticketId))
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }
      
      setMessages(data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to load messages');
      if (loading) {
        toast({
          title: "Chat Error",
          description: `Failed to load chat messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !currentUser || !canMessage) return;

    setSending(true);
    try {      
      const { error } = await workingSupabase
        .from('ticket_messages')
        .insert({
          ticket_id: parseInt(ticketId),
          user_id: currentUser.id,
          message: newMessage.trim(),
          is_admin: isAdmin
        });

      if (error) {
        throw error;
      }
      
      setNewMessage('');
      
      // Refresh messages immediately after sending
      setTimeout(() => {
        fetchMessages();
      }, 500);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Show error state
  if (error && !loading) {
    return (
      <Card className="h-96 flex flex-col">
        <CardContent className="p-8 text-center flex-1 flex flex-col justify-center">
          <div className="text-destructive mb-4">❌ Chat Error</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => {
            setError(null);
            setLoading(true);
            fetchMessages();
          }} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-96 flex flex-col">
        <CardContent className="p-8 text-center flex-1 flex flex-col justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = ticketInfo.icon;

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Modern Summary Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {ticketInfo.type} Top-up Request
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ticket #{ticketId.slice(-6)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ${ticketInfo.amount.toFixed(2)}
            </div>
            <Badge 
              variant="secondary" 
              className={ticketStatus === 'resolved' ? 
                'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
              }
            >
              {ticketStatus === 'resolved' ? 'Completed' : 'Processing'}
            </Badge>
          </div>
        </div>

        {/* Modern Progress Tracker */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Submitted</span>
          </div>
          <div className="w-8 h-0.5 bg-green-300 dark:bg-green-700" />
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${
            ticketStatus === 'open' ? 
            'bg-blue-100 dark:bg-blue-900/20' : 
            'bg-green-100 dark:bg-green-900/20'
          }`}>
            <AlertCircle className={`w-4 h-4 ${
              ticketStatus === 'open' ? 
              'text-blue-600 dark:text-blue-400' : 
              'text-green-600 dark:text-green-400'
            }`} />
            <span className={`text-sm font-medium ${
              ticketStatus === 'open' ? 
              'text-blue-600 dark:text-blue-400' : 
              'text-green-600 dark:text-green-400'
            }`}>Verifying</span>
          </div>
          <div className={`w-8 h-0.5 ${
            ticketStatus === 'resolved' ? 
            'bg-green-300 dark:bg-green-700' : 
            'bg-gray-300 dark:bg-gray-600'
          }`} />
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${
            ticketStatus === 'resolved' ? 
            'bg-green-100 dark:bg-green-900/20' : 
            'bg-gray-100 dark:bg-gray-800/20'
          }`}>
            <DollarSign className={`w-4 h-4 ${
              ticketStatus === 'resolved' ? 
              'text-green-600 dark:text-green-400' : 
              'text-gray-400 dark:text-gray-500'
            }`} />
            <span className={`text-sm font-medium ${
              ticketStatus === 'resolved' ? 
              'text-green-600 dark:text-green-400' : 
              'text-gray-400 dark:text-gray-500'
            }`}>Funded</span>
          </div>
        </div>
      </div>
      
      {/* Chat Messages */}
      <div className="h-96">
        <ScrollArea className="h-full p-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Start the conversation</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isAdmin ? 'Send a message to help the customer' : 'Ask any questions about your request'}
                </p>
              </div>
            ) : (
              <>
                {/* Welcome message for gift card requests */}
                {ticketInfo.type === 'Gift Card' && messages.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                          ✅ <strong>Thank you!</strong> We've received your ${ticketInfo.amount.toFixed(2)} gift card. 
                          We'll verify it and credit your account within 24 hours. Message us here if you need help.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((message) => {
                  const isCurrentUser = message.user_id === currentUser.id;
                  const isAdminMessage = message.is_admin;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${isCurrentUser ? 'ml-12' : 'mr-12'}`}>
                        <div className={`rounded-2xl px-4 py-3 ${
                          isCurrentUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                        }`}>
                          <p className="text-sm leading-relaxed font-medium">{message.message}</p>
                        </div>
                        
                        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
                          isCurrentUser ? 'justify-end' : 'justify-start'
                        }`}>
                          {isAdminMessage ? (
                            <div className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              <span>Support</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{isCurrentUser ? 'You' : 'User'}</span>
                            </div>
                          )}
                          <span>•</span>
                          <span>{formatTime(message.created_at)}</span>
                          {isCurrentUser && (
                            <>
                              <span>•</span>
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {!canMessage && (
          <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="text-lg">🔒</span>
              <span>
                This ticket has been {ticketStatus === 'resolved' ? 'resolved' : 'closed'}. 
                You can view the conversation but cannot send new messages.
              </span>
            </div>
          </div>
        )}
        
        <div className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={
              !canMessage 
                ? "This conversation is closed..." 
                : isAdmin 
                  ? "Reply as support..." 
                  : "Type your message..."
            }
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={sending || !currentUser || !canMessage}
            className="flex-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <Button 
            onClick={sendMessage} 
            disabled={sending || !newMessage.trim() || !currentUser || !canMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};