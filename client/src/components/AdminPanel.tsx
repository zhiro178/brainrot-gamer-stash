import { useState, useEffect } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Settings, Users, FileText, Megaphone, Plus, Wallet, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logAdminAction, getAdminLogs, exportAdminLogs } from "@/lib/adminLogging";
import { createClient } from "@supabase/supabase-js";
import { simpleSupabase as workingSupabase } from "@/lib/simple-supabase";
import { AdminPolicyEditor } from "@/components/AdminPolicyEditor";

const supabaseUrl = "https://uahxenisnppufpswupnz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhaHhlbmlzbnBwdWZwc3d1cG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NzE5MzgsImV4cCI6MjA2NzE0NzkzOH0.2Ojgzc6byziUMnB8AaA0LnuHgbqlsKIur2apF-jrc3Q";
const supabase = createClient(supabaseUrl, supabaseKey);

export const AdminPanel = () => {
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  const [isPolicyEditorDialogOpen, setIsPolicyEditorDialogOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info',
    active: true,
    expires_at: ''
  });
  const [purgingAllTickets, setPurgingAllTickets] = useState(false);
  const { toast } = useToast();

  const createAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast({
        title: "Error",
        description: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    const announcement = {
      id: Date.now().toString(),
      ...newAnnouncement,
      created_at: new Date().toISOString(),
      created_by: 'admin',
      expires_at: newAnnouncement.expires_at || undefined
    };

    // Save to localStorage
    const existing = localStorage.getItem('admin_announcements');
    const announcements = existing ? JSON.parse(existing) : [];
    const updated = [announcement, ...announcements];
    localStorage.setItem('admin_announcements', JSON.stringify(updated));

    logAdminAction('CREATE_ANNOUNCEMENT', `Created announcement: ${newAnnouncement.title}`, 'admin');

    setNewAnnouncement({
      title: '',
      content: '',
      type: 'info',
      active: true,
      expires_at: ''
    });

    setIsAnnouncementDialogOpen(false);

    toast({
      title: "Announcement Created",
      description: "New announcement has been created successfully",
    });
  };

  // Load users from localStorage (real data from registrations)
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserBalance, setSelectedUserBalance] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userBalances, setUserBalances] = useState<{[key: string]: number}>({});
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        console.log('Loading all registered users...');
        let allUsers: any[] = [];
        
        // Method 1: Get users from user_balances table first (these are guaranteed to be real users)
        try {
          const { data: balanceUsers, error } = await supabase
            .from('user_balances')
            .select('user_id, balance, created_at')
            .order('created_at', { ascending: false });
          
          if (!error && balanceUsers) {
            console.log('Got users from balances table:', balanceUsers.length);
            allUsers = balanceUsers.map((b: any) => ({
              id: b.user_id,
              email: `user_${b.user_id.slice(0, 8)}@unknown.com`,
              created_at: b.created_at,
              email_confirmed_at: null,
              last_sign_in_at: null,
              source: 'balances',
              balance: parseFloat(b.balance || '0')
            }));
          }
        } catch (balanceError) {
          console.log('Could not fetch from user_balances:', balanceError);
        }

        // Method 2: Try to get users from Supabase auth admin endpoint
        try {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          if (authUsers?.users) {
            console.log('Got users from auth admin:', authUsers.users.length);
            const authUsersList = authUsers.users.map((user: any) => ({
              id: user.id,
              email: user.email,
              created_at: user.created_at,
              email_confirmed_at: user.email_confirmed_at,
              last_sign_in_at: user.last_sign_in_at,
              source: 'auth_admin'
            }));
            
            // Merge with balance users (auth users take precedence for email and verification info)
            const balanceUserIds = new Set(allUsers.map((u: any) => u.id));
            for (const authUser of authUsersList) {
              const existingIndex = allUsers.findIndex(u => u.id === authUser.id);
              if (existingIndex >= 0) {
                // Update existing user with auth info
                allUsers[existingIndex] = {
                  ...allUsers[existingIndex],
                  email: authUser.email,
                  email_confirmed_at: authUser.email_confirmed_at,
                  last_sign_in_at: authUser.last_sign_in_at,
                  source: 'auth_admin'
                };
              } else {
                // Add new auth user
                allUsers.push(authUser);
              }
            }
          }
        } catch (authError) {
          console.log('Auth admin not accessible:', authError);
        }
        
        // Method 3: Try to get users from user_profiles table
        try {
          const { data: profileUsers, error } = await supabase
            .from('user_profiles')
            .select('user_id, username, display_name, created_at, email')
            .order('created_at', { ascending: false });
          
          if (!error && profileUsers) {
            console.log('Got users from profiles table:', profileUsers.length);
            const profileUsersList = profileUsers.map((profile: any) => ({
              id: profile.user_id,
              email: profile.email || `${profile.username}@unknown.com`,
              username: profile.username,
              display_name: profile.display_name,
              created_at: profile.created_at,
              email_confirmed_at: null,
              last_sign_in_at: null,
              source: 'profiles'
            }));
            
            // Merge with existing users (existing users take precedence)
            const existingUserIds = new Set(allUsers.map(u => u.id));
            const newProfileUsers = profileUsersList.filter((u: any) => !existingUserIds.has(u.id));
            allUsers = [...allUsers, ...newProfileUsers];
          }
        } catch (profileError) {
          console.log('Could not fetch from user_profiles:', profileError);
        }
        
        // Method 4: Get users from localStorage (fallback for users who logged in before)
        try {
          const savedUsers = localStorage.getItem('admin_users');
          if (savedUsers) {
            const localUsers = JSON.parse(savedUsers);
            console.log('Got users from localStorage:', localUsers.length);
            
            // Merge with existing users (existing users take precedence)
            const existingUserIds = new Set(allUsers.map(u => u.id));
            const newLocalUsers = localUsers
              .filter((u: any) => !existingUserIds.has(u.id))
              .map((u: any) => ({ ...u, source: 'localStorage' }));
            allUsers = [...allUsers, ...newLocalUsers];
          }
        } catch (localError) {
          console.log('Could not load from localStorage:', localError);
        }
        
        // Sort by created_at (newest first), then by balance (highest first)
        allUsers.sort((a, b) => {
          const aDate = new Date(a.created_at || 0);
          const bDate = new Date(b.created_at || 0);
          if (bDate.getTime() !== aDate.getTime()) {
            return bDate.getTime() - aDate.getTime();
          }
          return (b.balance || 0) - (a.balance || 0);
        });
        
        console.log('Total users found:', allUsers.length);
        setUsers(allUsers);
        
        // Load current balances for each user (refresh from database)
        const balances: {[key: string]: number} = {};
        console.log('Loading fresh balances from database...');
        
        const { data: allBalances, error: balancesError } = await supabase
          .from('user_balances')
          .select('user_id, balance');
        
        if (!balancesError && allBalances) {
          // Create a map of user_id -> balance
          for (const balanceRecord of allBalances) {
            balances[balanceRecord.user_id] = parseFloat(balanceRecord.balance || '0');
          }
          console.log('Loaded balances for', Object.keys(balances).length, 'users');
        }
        
        // Ensure all users have a balance entry (default to 0)
        for (const user of allUsers) {
          if (!(user.id in balances)) {
            balances[user.id] = 0;
          }
        }
        
        setUserBalances(balances);
        console.log('Balance loading complete');
      } catch (error) {
        console.error('Error loading users:', error);
        toast({
          title: "Error Loading Users",
          description: "Could not load user list. Please try refreshing.",
          variant: "destructive",
        });
      }
    };
    
    loadUsers();
  }, [isUsersDialogOpen]);

  const addUserBalance = async (userId: string, userEmail: string, amount: number) => {
    try {
      const currentBalance = userBalances[userId] || 0;
      const newBalance = currentBalance + amount;
      
      // Try to update balance in Supabase
      try {
        // First check if balance record exists
        const { data: existingBalance } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('user_id', userId);

        let balanceUpdateError;
        
        if (existingBalance && existingBalance.length > 0) {
          // Update existing balance
          const { error } = await supabase
            .from('user_balances')
            .update({
              balance: newBalance.toString()
            })
            .eq('user_id', userId);
          
          balanceUpdateError = error;
        } else {
          // Create new balance record
          const { error } = await supabase
            .from('user_balances')
            .insert({
              user_id: userId,
              balance: newBalance.toString()
            });
          
          balanceUpdateError = error;
        }
        
        if (balanceUpdateError) {
          console.error('Supabase balance error:', balanceUpdateError);
          // Fall back to localStorage if Supabase fails
          const savedBalances = localStorage.getItem('user_balances');
          const balances = savedBalances ? JSON.parse(savedBalances) : {};
          balances[userId] = newBalance;
          localStorage.setItem('user_balances', JSON.stringify(balances));
        }
      } catch (supabaseError) {
        console.error('Supabase connection error:', supabaseError);
        // Fall back to localStorage
        const savedBalances = localStorage.getItem('user_balances');
        const balances = savedBalances ? JSON.parse(savedBalances) : {};
        balances[userId] = newBalance;
        localStorage.setItem('user_balances', JSON.stringify(balances));
      }
      
      // Update local state
      setUserBalances(prev => ({...prev, [userId]: newBalance}));
      
      logAdminAction('ADD_BALANCE', `Added $${amount} to ${userEmail} (New balance: $${newBalance})`, 'admin', userEmail);
      toast({
        title: "Balance Added ✅",
        description: `Added $${amount} to ${userEmail}. New balance: $${newBalance.toFixed(2)}`,
      });
      setSelectedUserBalance('');
      setSelectedUserId('');
    } catch (error) {
      console.error('Error adding balance:', error);
      toast({
        title: "Error Adding Balance",
        description: "Failed to add balance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeUserBalance = async (userId: string, userEmail: string, amount: number) => {
    try {
      const currentBalance = userBalances[userId] || 0;
      
      if (amount > currentBalance) {
        toast({
          title: "Insufficient Balance",
          description: `Cannot remove $${amount}. User only has $${currentBalance.toFixed(2)}`,
          variant: "destructive",
        });
        return;
      }
      
      const newBalance = Math.max(0, currentBalance - amount);
      
      // Try to update balance in Supabase
      try {
        // First check if balance record exists
        const { data: existingBalance } = await supabase
          .from('user_balances')
          .select('balance')
          .eq('user_id', userId);

        let balanceUpdateError;
        
        if (existingBalance && existingBalance.length > 0) {
          // Update existing balance
          const { error } = await supabase
            .from('user_balances')
            .update({
              balance: newBalance.toString()
            })
            .eq('user_id', userId);
          
          balanceUpdateError = error;
        } else {
          // Create new balance record
          const { error } = await supabase
            .from('user_balances')
            .insert({
              user_id: userId,
              balance: newBalance.toString()
            });
          
          balanceUpdateError = error;
        }
        
        if (balanceUpdateError) {
          console.error('Supabase balance error:', balanceUpdateError);
          // Fall back to localStorage if Supabase fails
          const savedBalances = localStorage.getItem('user_balances');
          const balances = savedBalances ? JSON.parse(savedBalances) : {};
          balances[userId] = newBalance;
          localStorage.setItem('user_balances', JSON.stringify(balances));
        }
      } catch (supabaseError) {
        console.error('Supabase connection error:', supabaseError);
        // Fall back to localStorage
        const savedBalances = localStorage.getItem('user_balances');
        const balances = savedBalances ? JSON.parse(savedBalances) : {};
        balances[userId] = newBalance;
        localStorage.setItem('user_balances', JSON.stringify(balances));
      }
      
      // Update local state
      setUserBalances(prev => ({...prev, [userId]: newBalance}));
      
      logAdminAction('REMOVE_BALANCE', `Removed $${amount} from ${userEmail} (New balance: $${newBalance})`, 'admin', userEmail);
      toast({
        title: "Balance Removed ✅",
        description: `Removed $${amount} from ${userEmail}. New balance: $${newBalance.toFixed(2)}`,
      });
      setSelectedUserBalance('');
      setSelectedUserId('');
    } catch (error) {
      console.error('Error removing balance:', error);
      toast({
        title: "Error Removing Balance",
        description: "Failed to remove balance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearUserBalance = async (userId: string, userEmail: string) => {
    try {
      // Check if balance record exists first
      const { data: existingBalance } = await supabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', userId);

      let clearError;
      
      if (existingBalance && existingBalance.length > 0) {
        // Update existing balance to 0
        const { error } = await supabase
          .from('user_balances')
          .update({
            balance: '0'
          })
          .eq('user_id', userId);
        
        clearError = error;
      } else {
        // Create new balance record with 0 balance
        const { error } = await supabase
          .from('user_balances')
          .insert({
            user_id: userId,
            balance: '0'
          });
        
        clearError = error;
      }
      
      if (clearError) throw clearError;
      
      // Update local state
      setUserBalances(prev => ({...prev, [userId]: 0}));
      
      logAdminAction('CLEAR_BALANCE', `Cleared balance for ${userEmail}`, 'admin', userEmail);
      toast({
        title: "Balance Cleared ✅",
        description: `Balance cleared for ${userEmail}`,
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error clearing balance:', error);
      toast({
        title: "Error Clearing Balance",
        description: "Failed to clear balance. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    try {
      // Remove from localStorage
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('admin_users', JSON.stringify(updatedUsers));
      
      // Clear balance in Supabase
      await supabase
        .from('user_balances')
        .delete()
        .eq('user_id', userId);
      
      // Remove from local balance state
      setUserBalances(prev => {
        const newBalances = {...prev};
        delete newBalances[userId];
        return newBalances;
      });
      
      logAdminAction('DELETE_USER', `Deleted user account: ${userEmail}`, 'admin', userEmail);
      toast({
        title: "User Deleted ✅",
        description: `${userEmail} has been deleted`,
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error Deleting User",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const adminLogs = getAdminLogs();

  // Functions to open dialogs from dropdown
  const openUsersDialog = () => {
    setIsUsersDialogOpen(true);
  };

  const openLogsDialog = () => {
    setIsLogsDialogOpen(true);
  };

  const openAnnouncementDialog = () => {
    setIsAnnouncementDialogOpen(true);
  };

  const openPolicyEditorDialog = () => {
    setIsPolicyEditorDialogOpen(true);
  };

  const purgeAllResolvedTickets = async () => {
    if (purgingAllTickets) return;
    
    setPurgingAllTickets(true);
    try {
      console.log("Purging all resolved/closed tickets...");
      
      // Get all resolved/closed tickets across all categories
      const { data: allTickets, error: fetchError } = await supabase
        .from('support_tickets')
        .select('*')
        .in('status', ['resolved', 'closed']);
      
      if (fetchError) {
        console.error('Error fetching tickets for purging:', fetchError);
        toast({
          title: "Error",
          description: "Failed to fetch tickets for purging.",
          variant: "destructive",
        });
        return;
      }
      
      if (!allTickets || allTickets.length === 0) {
        toast({
          title: "No Tickets to Purge",
          description: "No resolved/closed tickets found to purge.",
        });
        return;
      }

      // Purge all resolved/closed tickets by marking them as purged
      let successCount = 0;
      let errorCount = 0;

      for (const ticket of allTickets) {
        try {
          const { error: updateError } = await workingSupabase
            .from('support_tickets')
            .update({ 
              status: 'purged',
              message: '[PURGED] - Ticket history removed by admin',
              subject: '[PURGED] - Ticket history removed'
            })
            .eq('id', ticket.id);
          
          if (updateError) {
            throw new Error(updateError.message || 'Failed to purge ticket');
          }
          
          successCount++;
        } catch (error) {
          console.error(`Error purging ticket ${ticket.id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Tickets Purged Successfully",
          description: `${successCount} tickets have been purged from user view. ${errorCount > 0 ? `${errorCount} failed to purge.` : ''}`,
        });
        
        // Log the admin action
        logAdminAction('PURGE_ALL_TICKETS', `Purged ${successCount} resolved/closed tickets from all categories`, 'admin');
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Error Purging Tickets",
          description: "Failed to purge any tickets. Please try again.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error purging all tickets:', error);
      toast({
        title: "Error",
        description: "Failed to purge tickets. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurgingAllTickets(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Users Dialog */}
      <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
        <DialogTrigger asChild>
          <div id="users-trigger" style={{ display: 'none' }} />
        </DialogTrigger>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              User Management ({users.length} users)
              <Button 
                onClick={() => {
                  setIsUsersDialogOpen(false);
                  setTimeout(() => setIsUsersDialogOpen(true), 100);
                }}
                variant="outline" 
                size="sm"
              >
                🔄 Refresh
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {users.map((user, index) => {
              const isAdmin = user.email === 'zhirocomputer@gmail.com' || user.email === 'ajay123phone@gmail.com';
              const isVerified = user.email_confirmed_at !== null;
              
              return (
                <Card key={user.id || index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{user.email}</span>
                            {isAdmin && (
                              <Badge className="bg-gaming-accent text-black">Admin</Badge>
                            )}
                            {isVerified ? (
                              <Badge className="bg-gaming-success text-black">Verified</Badge>
                            ) : (
                              <Badge variant="destructive">Unverified</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                          </p>
                          {user.last_sign_in_at && (
                            <p className="text-xs text-muted-foreground">
                              Last login: {new Date(user.last_sign_in_at).toLocaleDateString()}
                            </p>
                          )}
                          {user.source && (
                            <p className="text-xs text-muted-foreground">
                              Source: {user.source}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <Wallet className="h-4 w-4 text-gaming-success" />
                            <span className="text-sm font-semibold text-gaming-success">
                              Balance: ${(userBalances[user.id] || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Admin Actions */}
                    <div className="flex items-center space-x-2 mt-3">
                      <div className="flex items-center space-x-2 flex-1">
                        <Input
                          placeholder="Amount ($)"
                          value={selectedUserId === user.id ? selectedUserBalance : ''}
                          onChange={(e) => {
                            setSelectedUserId(user.id);
                            setSelectedUserBalance(e.target.value);
                          }}
                          className="w-28 h-8 text-xs"
                          type="number"
                          min="0"
                          step="0.01"
                        />
                        <Button
                          onClick={() => {
                            if (selectedUserBalance && parseFloat(selectedUserBalance) > 0) {
                              addUserBalance(user.id, user.email, parseFloat(selectedUserBalance));
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-green-600 border-green-600 hover:bg-green-50"
                          disabled={!selectedUserBalance || parseFloat(selectedUserBalance) <= 0}
                        >
                          + Add
                        </Button>
                        <Button
                          onClick={() => {
                            if (selectedUserBalance && parseFloat(selectedUserBalance) > 0) {
                              removeUserBalance(user.id, user.email, parseFloat(selectedUserBalance));
                            }
                          }}
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-red-600 border-red-600 hover:bg-red-50"
                          disabled={!selectedUserBalance || parseFloat(selectedUserBalance) <= 0 || (userBalances[user.id] || 0) < parseFloat(selectedUserBalance || '0')}
                        >
                          - Remove
                        </Button>
                      </div>
                      
                      {!isAdmin && (
                        <div className="flex space-x-1">
                          <Button
                            onClick={() => clearUserBalance(user.id, user.email)}
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-orange-600 border-orange-600 hover:bg-orange-50"
                          >
                            Clear All
                          </Button>
                          <Button
                            onClick={() => deleteUser(user.id, user.email)}
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-destructive border-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {users.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users registered yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin Logs Dialog */}
      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogTrigger asChild>
          <div id="logs-trigger" style={{ display: 'none' }} />
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Admin Activity Logs ({adminLogs.length})
              <Button onClick={exportAdminLogs} variant="outline" size="sm">
                📥 Export
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {adminLogs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No admin activity logged yet</p>
            ) : (
              adminLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{log.action}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{log.details}</p>
                    <p className="text-xs text-muted-foreground">By: {log.admin_email}</p>
                    {log.target_user && (
                      <p className="text-xs text-muted-foreground">Target: {log.target_user}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Announcements Dialog */}
      <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
        <DialogTrigger asChild>
          <div id="announcement-trigger" style={{ display: 'none' }} />
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <Plus className="h-4 w-4 mr-2 inline" />
              Create Announcement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  placeholder="Announcement title"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newAnnouncement.type} onValueChange={(value) => setNewAnnouncement({...newAnnouncement, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info ℹ️</SelectItem>
                    <SelectItem value="sale">Sale 💰</SelectItem>
                    <SelectItem value="warning">Warning ⚠️</SelectItem>
                    <SelectItem value="success">Success ✅</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                placeholder="Announcement content"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expires (optional)</Label>
                <Input
                  type="datetime-local"
                  value={newAnnouncement.expires_at}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, expires_at: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  checked={newAnnouncement.active}
                  onCheckedChange={(checked) => setNewAnnouncement({...newAnnouncement, active: checked})}
                />
                <Label>Active</Label>
              </div>
            </div>
            <Button onClick={createAnnouncement} className="w-full">
              Create Announcement
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Policy Editor Dialog */}
      <Dialog open={isPolicyEditorDialogOpen} onOpenChange={setIsPolicyEditorDialogOpen}>
        <DialogTrigger asChild>
          <div id="policy-editor-trigger" style={{ display: 'none' }} />
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Policy Editor</DialogTitle>
          </DialogHeader>
          <AdminPolicyEditor />
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-gaming-accent text-black hover:bg-gaming-accent/80 border-gaming-accent"
          >
            <Shield className="h-4 w-4 mr-2" />
            Admin
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56 bg-gradient-card border-primary/20">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium text-primary">Admin Panel</p>
            <p className="text-xs text-muted-foreground">Management tools available</p>
          </div>
          
          <DropdownMenuItem className="flex items-center cursor-pointer" onClick={openUsersDialog}>
            <Users className="h-4 w-4 mr-2" />
            User Management
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center cursor-pointer" onClick={openLogsDialog}>
            <FileText className="h-4 w-4 mr-2" />
            Activity Logs
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center cursor-pointer" onClick={openAnnouncementDialog}>
            <Megaphone className="h-4 w-4 mr-2" />
            Create Announcement
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center cursor-pointer" onClick={openPolicyEditorDialog}>
            <BookOpen className="h-4 w-4 mr-2" />
            Edit Policies
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="flex items-center cursor-pointer text-destructive hover:text-destructive" 
            onClick={purgeAllResolvedTickets}
            disabled={purgingAllTickets}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {purgingAllTickets ? 'Purging...' : 'Purge All Resolved Tickets'}
          </DropdownMenuItem>
          
                      <div className="px-2 py-1.5 border-t border-primary/20">
              <p className="text-xs text-muted-foreground">
                Click items above to access management tools
              </p>
            </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};