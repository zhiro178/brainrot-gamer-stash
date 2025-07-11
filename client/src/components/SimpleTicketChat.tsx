import React, { useState, useEffect, useRef } from 'react';
import { simpleSupabase as workingSupabase } from '@/lib/simple-supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Send, User, UserCog, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { approveAndAddFunds, type ApproveAndAddFundsParams } from '@/lib/balanceUtils';

interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

interface SimpleTicketChatProps {
  ticketId: string;
  ticketSubject: string;
  currentUser: any;
  isAdmin?: boolean;
  ticketStatus?: string;
}

export const SimpleTicketChat = ({ ticketId, ticketSubject, currentUser, isAdmin = false, ticketStatus = 'open' }: SimpleTicketChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCache, setUserCache] = useState<{[key: string]: any}>({});
  const [isApproveFundsDialogOpen, setIsApproveFundsDialogOpen] = useState(false);
  const [approveAmount, setApproveAmount] = useState('');
  const [approveReason, setApproveReason] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Check if ticket is closed/resolved and messaging should be disabled
  const isTicketClosed = ticketStatus === 'resolved' || ticketStatus === 'closed';
  const canMessage = !isTicketClosed;

  console.log('SimpleTicketChat mounted with:', { 
    ticketId, 
    ticketSubject, 
    currentUser: currentUser?.id, 
    isAdmin,
    ticketStatus,
    canMessage
  });

  // Generate avatar from email
  const generateAvatar = (email: string, isAdmin: boolean = false) => {
    if (isAdmin) {
      return '🛡️';
    }
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const colorIndex = email.charCodeAt(0) % colors.length;
    const initials = email.charAt(0).toUpperCase();
    return {
      backgroundColor: colors[colorIndex],
      initials: initials
    };
  };

  // Fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await workingSupabase
        .from('user_profiles')
        .select('username, display_name, avatar_url')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        const profile = data[0];
        return {
          username: profile.username || `user_${userId.slice(-4)}`,
          displayName: profile.display_name || profile.username || `User ${userId.slice(-4)}`,
          avatarUrl: profile.avatar_url
        };
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    
    // Fallback for users without profiles
    return {
      username: `user_${userId.slice(-4)}`,
      displayName: `User ${userId.slice(-4)}`,
      avatarUrl: null
    };
  };

  // Get user display info (now uses preloaded cache)
  const getUserInfo = (userId: string, isAdmin: boolean) => {
    if (isAdmin) {
      return {
        name: 'Support Team',
        email: 'support@592stock.com',
        avatar: '🛡️',
        isEmoji: true,
        avatarUrl: null
      };
    }
    
    // Use cached data (preloaded when messages are fetched)
    if (userCache[userId]) {
      return userCache[userId];
    }

    // Fallback if somehow not cached
    return {
      name: userId === currentUser?.id ? 'You' : `User ${userId.slice(-4)}`,
      username: `user_${userId.slice(-4)}`,
      email: userId === currentUser?.id ? currentUser?.email : '',
      avatar: generateAvatar(`user_${userId.slice(-4)}`),
      avatarUrl: null,
      isEmoji: false
    };
  };

  useEffect(() => {
    if (!ticketId || !currentUser) {
      console.error('Missing required props:', { ticketId, currentUser });
      setError('Missing ticket ID or user information');
      setLoading(false);
      return;
    }

    fetchMessages();
    
    // Set up polling for new messages since our working client doesn't support real-time subscriptions
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 3000); // Poll every 3 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [ticketId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      console.log('Fetching messages for ticket:', ticketId, 'as user:', currentUser?.id);
      
      if (!ticketId) {
        throw new Error('No ticket ID provided');
      }

      const { data, error } = await workingSupabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', parseInt(ticketId))
        .order('created_at', { ascending: true });

      console.log('Messages fetch result:', { data, error, ticketId });

      if (error) {
        console.error('Working client error fetching messages:', error);
        throw error;
      }
      
      console.log('Fetched messages count:', data?.length || 0);
      setMessages(data || []);

      // Preload user profiles for all unique users in messages
      if (data && data.length > 0) {
        const uniqueUserIds = Array.from(new Set(data.map((msg: any) => msg.user_id)));
        await preloadUserProfiles(uniqueUserIds);
      }

      setError(null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to load messages');
      if (loading) {
        // Only show toast on initial load error, not polling errors
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

  // Preload user profiles for chat participants
  const preloadUserProfiles = async (userIds: string[]) => {
    try {
      const newCache: {[key: string]: any} = {};
      
      // Fetch profiles for each user individually (working client limitation)
      for (const userId of userIds) {
        try {
          const { data, error } = await workingSupabase
            .from('user_profiles')
            .select('user_id, username, display_name, avatar_url')
            .eq('user_id', userId);

          if (!error && data && data.length > 0) {
            const profile = data[0];
            newCache[profile.user_id] = {
              name: profile.user_id === currentUser?.id ? 'You' : (profile.display_name || profile.username || `User ${profile.user_id.slice(-4)}`),
              username: profile.username || `user_${profile.user_id.slice(-4)}`,
              email: profile.user_id === currentUser?.id ? currentUser?.email : '',
              avatar: profile.avatar_url ? null : generateAvatar(profile.username || profile.user_id),
              avatarUrl: profile.avatar_url,
              isEmoji: false
            };
          } else {
            // Fallback for users without profiles
            newCache[userId] = {
              name: userId === currentUser?.id ? 'You' : `User ${userId.slice(-4)}`,
              username: `user_${userId.slice(-4)}`,
              email: userId === currentUser?.id ? currentUser?.email : '',
              avatar: generateAvatar(`user_${userId.slice(-4)}`),
              avatarUrl: null,
              isEmoji: false
            };
          }
        } catch (profileError) {
          console.error(`Error fetching profile for user ${userId}:`, profileError);
          // Fallback for error cases
          newCache[userId] = {
            name: userId === currentUser?.id ? 'You' : `User ${userId.slice(-4)}`,
            username: `user_${userId.slice(-4)}`,
            email: userId === currentUser?.id ? currentUser?.email : '',
            avatar: generateAvatar(`user_${userId.slice(-4)}`),
            avatarUrl: null,
            isEmoji: false
          };
        }
      }

      setUserCache(newCache);
    } catch (error) {
      console.error('Error preloading user profiles:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !currentUser || !canMessage) return;

    setSending(true);
    try {
      console.log('Sending message with working client...', {
        ticketId: parseInt(ticketId),
        userId: currentUser.id,
        isAdmin,
        message: newMessage.trim()
      });
      
      const { error } = await workingSupabase
        .from('ticket_messages')
        .insert({
          ticket_id: parseInt(ticketId),
          user_id: currentUser.id,
          message: newMessage.trim(),
          is_admin: isAdmin
        });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }
      
      console.log('Message sent successfully');
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

  const handleApproveFunds = async () => {
    if (!approveAmount || !currentUser || !isAdmin) return;
    
    const amount = parseFloat(approveAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingApproval(true);
    
    try {
      // Get the ticket user ID (first non-admin message sender)
      const firstUserMessage = messages.find((msg: Message) => !msg.is_admin);
      const ticketUserId = firstUserMessage?.user_id;
      
      if (!ticketUserId) {
        throw new Error('Could not determine ticket user ID');
      }

      const result = await approveAndAddFunds({
        ticketId: ticketId,
        userId: ticketUserId,
        amount: amount,
        currentUser: currentUser,
        reason: approveReason || 'Funds approved by admin'
      });

      if (result.success) {
        toast({
          title: "Funds Approved",
          description: result.message,
        });
        
        // Reset form
        setApproveAmount('');
        setApproveReason('');
        setIsApproveFundsDialogOpen(false);
        
        // Refresh messages to show the new admin message
        setTimeout(() => {
          fetchMessages();
        }, 500);
      } else {
        throw new Error(result.error || 'Failed to approve funds');
      }
    } catch (error) {
      console.error('Error approving funds:', error);
      toast({
        title: "Error",
        description: `Failed to approve funds: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const extractAmountFromSubject = (subject: string) => {
    const match = subject.match(/\$(\d+(?:\.\d{2})?)/);
    return match ? match[1] : '';
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
          <p className="text-xs text-muted-foreground mt-2">Ticket ID: {ticketId}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto flex flex-col bg-gradient-card border-primary/20" style={{ height: '500px' }}>
      <CardHeader className="pb-3 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-gaming-accent/5">
        <CardTitle className="text-lg font-medium flex items-center gap-2 text-primary">
          <span>💬</span>
          <span className="truncate">{ticketSubject}</span>
          <Badge variant="outline" className="ml-auto shrink-0 border-primary/30 text-primary">
            #{String(ticketId).slice(-6)}
          </Badge>
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          {isAdmin ? '👨‍💼 Admin View' : '👤 Customer View'} • {messages.length} messages
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-background/50">
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-lg font-medium mb-2 text-primary">Start the conversation!</p>
                <p className="text-sm">Your messages will appear here</p>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.user_id === currentUser.id;
                const isAdminMessage = message.is_admin;
                const userInfo = getUserInfo(message.user_id, isAdminMessage);
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div className={`flex items-start gap-3 max-w-[75%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {userInfo.isEmoji ? (
                          <div className="w-8 h-8 rounded-full bg-gaming-accent/20 flex items-center justify-center text-lg">
                            {userInfo.avatar}
                          </div>
                        ) : userInfo.avatarUrl ? (
                          <img 
                            src={userInfo.avatarUrl} 
                            alt={userInfo.name}
                            className="w-8 h-8 rounded-full object-cover border border-primary/20"
                            onError={(e) => {
                              // Fallback to generated avatar if image fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling!.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        {!userInfo.isEmoji && (
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${userInfo.avatarUrl ? 'hidden' : ''}`}
                            style={{ backgroundColor: userInfo.avatar?.backgroundColor || '#666' }}
                          >
                            {userInfo.avatar?.initials || userInfo.name?.[0] || '?'}
                          </div>
                        )}
                      </div>
                      
                      {/* Message bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-lg ${
                          isAdminMessage
                            ? 'bg-gradient-to-br from-gaming-accent to-gaming-accent/80 text-black rounded-tl-md border border-gaming-accent/30'
                            : isCurrentUser
                              ? 'bg-gradient-to-br from-primary to-primary/80 text-white rounded-br-md border border-primary/30'
                              : 'bg-gradient-to-br from-background to-muted text-foreground rounded-bl-md border border-primary/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-medium ${
                            isAdminMessage 
                              ? 'text-gaming-accent-foreground' 
                              : isCurrentUser 
                                ? 'text-white/90' 
                                : 'text-muted-foreground'
                          }`}>
                            {userInfo.name}
                          </span>
                          {isAdminMessage && (
                            <span className="text-xs bg-gaming-accent-foreground/20 px-2 py-0.5 rounded-full">
                              Support
                            </span>
                          )}
                          <span className={`text-xs ml-auto ${
                            isAdminMessage 
                              ? 'text-gaming-accent-foreground/70' 
                              : isCurrentUser 
                                ? 'text-white/70' 
                                : 'text-muted-foreground/70'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                          isAdminMessage 
                            ? 'text-gaming-accent-foreground' 
                            : isCurrentUser 
                              ? 'text-white' 
                              : 'text-foreground'
                        }`}>
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-primary/20 bg-gradient-to-r from-background/95 to-muted/50 p-4">
          {!canMessage && (
            <div className="mb-3 p-3 bg-muted/50 border border-primary/20 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span className="text-lg">🔒</span>
                <span>
                  This ticket has been {ticketStatus === 'resolved' ? 'resolved' : 'closed'}. 
                  You can view the conversation but cannot send new messages.
                </span>
              </div>
            </div>
          )}
          
          {/* Admin Controls */}
          {isAdmin && canMessage && (
            <div className="mb-3 p-3 bg-gaming-accent/10 border border-gaming-accent/20 rounded-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gaming-accent" />
                  <span className="text-sm font-medium text-gaming-accent">Admin Controls</span>
                </div>
                <Dialog open={isApproveFundsDialogOpen} onOpenChange={setIsApproveFundsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-gaming-success hover:bg-gaming-success/80 text-black"
                      onClick={() => {
                        // Pre-fill amount if it can be extracted from subject
                        const suggestedAmount = extractAmountFromSubject(ticketSubject);
                        if (suggestedAmount) {
                          setApproveAmount(suggestedAmount);
                        }
                        setIsApproveFundsDialogOpen(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Add Funds
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-gaming-success" />
                        Approve & Add Funds
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="approve-amount" className="text-sm font-medium">
                          Amount to Add ($)
                        </Label>
                        <Input
                          id="approve-amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={approveAmount}
                          onChange={(e) => setApproveAmount(e.target.value)}
                          placeholder="Enter amount..."
                          className="mt-1"
                          disabled={isProcessingApproval}
                        />
                      </div>
                      <div>
                        <Label htmlFor="approve-reason" className="text-sm font-medium">
                          Reason (optional)
                        </Label>
                        <Input
                          id="approve-reason"
                          value={approveReason}
                          onChange={(e) => setApproveReason(e.target.value)}
                          placeholder="Funds approved by admin"
                          className="mt-1"
                          disabled={isProcessingApproval}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsApproveFundsDialogOpen(false)}
                          disabled={isProcessingApproval}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleApproveFunds}
                          disabled={isProcessingApproval || !approveAmount || parseFloat(approveAmount) <= 0}
                          className="bg-gaming-success hover:bg-gaming-success/80 text-black"
                        >
                          {isProcessingApproval ? (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 animate-spin" />
                              Processing...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Approve ${parseFloat(approveAmount || '0').toFixed(2)}
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                    ? "Reply to customer..." 
                    : "Type your message..."
              }
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={sending || !currentUser || !canMessage}
              className={`flex-1 border-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground rounded-xl px-4 py-2 text-sm transition-all duration-200 ${
                !canMessage 
                  ? 'bg-muted/50 cursor-not-allowed opacity-60' 
                  : 'bg-background hover:bg-background/80'
              }`}
              style={{ 
                color: 'var(--foreground)',
                backgroundColor: canMessage ? 'var(--background)' : 'var(--muted)'
              }}
            />
            <Button 
              onClick={sendMessage} 
              disabled={sending || !newMessage.trim() || !currentUser || !canMessage}
              className={`rounded-xl px-6 transition-all duration-200 ${
                !canMessage 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : 'bg-gradient-primary hover:shadow-glow text-primary-foreground'
              }`}
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {canMessage && (
            <div className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-2">
              {isAdmin ? (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gaming-accent rounded-full"></span>
                  💼 Replying as Support Team
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                  � Chat with support team
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};