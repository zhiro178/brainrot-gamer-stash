import React, { useState, useEffect, useRef } from 'react';
import { simpleSupabase as workingSupabase } from '@/lib/simple-supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, User, ShieldCheck, Clock, CheckCircle, AlertCircle, CreditCard, Gift, DollarSign } from 'lucide-react';
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
  isAdmin: boolean;
  ticketStatus?: string;
}

export const ModernTicketChat = ({ ticketId, ticketSubject, currentUser, isAdmin, ticketStatus = 'open' }: ModernTicketChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Extract ticket info from subject
  const extractTicketInfo = (subject: string) => {
    const amountMatch = subject.match(/\$(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    // Determine type
    let type = 'Gift Card';
    let icon = Gift;
    if (subject.toLowerCase().includes('crypto')) {
      type = 'Crypto';
      icon = CreditCard;
    }
    
    return { amount, type, icon };
  };

  const ticketInfo = extractTicketInfo(ticketSubject);

  // Progress steps
  const getProgressSteps = () => {
    const steps = [
      { label: 'Submitted', status: 'completed', icon: CheckCircle },
      { label: 'Verifying', status: ticketStatus === 'open' ? 'current' : 'completed', icon: AlertCircle },
      { label: 'Funded', status: ticketStatus === 'resolved' ? 'completed' : 'pending', icon: DollarSign }
    ];
    return steps;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchMessages();
    
    const interval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await workingSupabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', parseInt(ticketId))
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { data, error } = await workingSupabase
        .from('ticket_messages')
        .insert({
          ticket_id: parseInt(ticketId),
          user_id: String(currentUser.id),
          message: newMessage.trim(),
          is_admin: isAdmin
        });

      if (error) throw error;
      
      setNewMessage("");
      await fetchMessages();
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'current': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-400 dark:text-gray-500';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 dark:bg-green-900/20';
      case 'current': return 'bg-blue-100 dark:bg-blue-900/20';
      default: return 'bg-gray-100 dark:bg-gray-800/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Summary Box */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <ticketInfo.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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
              className={`${ticketStatus === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'}`}
            >
              {ticketStatus === 'resolved' ? 'Completed' : 'Processing'}
            </Badge>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center justify-between">
          {getProgressSteps().map((step, index) => (
            <div key={step.label} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${getStatusBgColor(step.status)}`}>
                <step.icon className={`w-4 h-4 ${getStatusColor(step.status)}`} />
                <span className={`text-sm font-medium ${getStatusColor(step.status)}`}>
                  {step.label}
                </span>
              </div>
              {index < getProgressSteps().length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${step.status === 'completed' ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-300 dark:bg-gray-600'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-96">
        <ScrollArea className="h-full p-6">
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
            <div className="space-y-4">
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

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.user_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${message.user_id === currentUser.id ? 'ml-12' : 'mr-12'}`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.user_id === currentUser.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    }`}>
                      <p className="text-sm leading-relaxed font-medium">{message.message}</p>
                    </div>
                    
                    <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
                      message.user_id === currentUser.id ? 'justify-end' : 'justify-start'
                    }`}>
                      {message.is_admin ? (
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Support</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>You</span>
                        </div>
                      )}
                      <span>•</span>
                      <span>{formatTime(message.created_at)}</span>
                      {message.user_id === currentUser.id && (
                        <>
                          <span>•</span>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Message Input */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <form onSubmit={sendMessage} className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Type your message${isAdmin ? ' as support' : ''}...`}
            className="flex-1 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};