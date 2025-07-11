import { simpleSupabase as workingSupabase } from '@/lib/simple-supabase';

export interface ApproveAndAddFundsParams {
  ticketId: string;
  userId: string;
  amount: number;
  currentUser: any;
  reason?: string;
}

export interface ApproveAndAddFundsResult {
  success: boolean;
  message: string;
  newBalance?: number;
  error?: string;
}

export const approveAndAddFunds = async ({
  ticketId,
  userId,
  amount,
  currentUser,
  reason = 'Funds approved by admin'
}: ApproveAndAddFundsParams): Promise<ApproveAndAddFundsResult> => {
  try {
    console.log("Starting fund approval for:", { ticketId, userId, amount });
    
    // Validate input
    if (!ticketId || !userId || !amount || amount <= 0) {
      throw new Error('Invalid parameters for fund approval');
    }

    // Update ticket status to resolved
    const { error: ticketError } = await workingSupabase
      .from('support_tickets')
      .update({ status: 'resolved' })
      .eq('id', ticketId);
      
    if (ticketError) {
      console.error('Error updating ticket:', ticketError);
      throw new Error(`Failed to update ticket: ${ticketError.message}`);
    }
    
    console.log("Ticket updated to resolved");

    // Get or create user balance
    console.log("Fetching existing balance for user:", userId);
    const fetchResult = await new Promise((resolve) => {
      workingSupabase
        .from('user_balances')
        .select('balance')
        .eq('user_id', userId)
        .then(resolve);
    });

    const existingBalance = (fetchResult as any).data;
    const balanceError = (fetchResult as any).error;

    console.log("Existing balance query result:", { existingBalance, balanceError });

    if (balanceError) {
      console.error('Error fetching balance:', balanceError);
      throw new Error(`Failed to fetch user balance: ${balanceError.message}`);
    }

    const currentBalance = parseFloat(existingBalance?.[0]?.balance || '0');
    const newBalance = currentBalance + amount;
    
    console.log("Balance calculation:", { currentBalance, amount, newBalance });
    
    let operationResult, balanceUpdateError;
    
    // If balance record exists, update it
    if (existingBalance && existingBalance.length > 0) {
      console.log("Updating existing balance record with new balance:", newBalance.toFixed(2));
      
      try {
        // Use the simple-supabase update API correctly
        const updateResult = await new Promise((resolve) => {
          workingSupabase
            .from('user_balances')
            .update({
              balance: newBalance.toFixed(2)
            })
            .eq('user_id', userId)
            .then(resolve);
        });
        
        operationResult = (updateResult as any).data;
        balanceUpdateError = (updateResult as any).error;
        console.log("Balance update result:", { operationResult, balanceUpdateError });
        
        // Verify the update worked by fetching the balance again
        const verifyResult = await new Promise((resolve) => {
          workingSupabase
            .from('user_balances')
            .select('balance')
            .eq('user_id', userId)
            .then(resolve);
        });
        
        const verifyBalance = (verifyResult as any).data;
        const verifyError = (verifyResult as any).error;
        
        console.log("Verification of updated balance:", { verifyBalance, verifyError });
        
        if (verifyError) {
          console.error('Error verifying balance update:', verifyError);
        } else if (verifyBalance && verifyBalance[0]) {
          const actualBalance = parseFloat(verifyBalance[0].balance);
          console.log("Actual balance after update:", actualBalance, "Expected:", newBalance);
          if (Math.abs(actualBalance - newBalance) > 0.01) {
            console.warn("Balance mismatch detected!");
          }
        }
      } catch (error) {
        console.error('Exception during balance update:', error);
        balanceUpdateError = { message: error instanceof Error ? error.message : String(error) };
      }
    } else {
      // If no balance record exists, create one
      console.log("Creating new balance record with balance:", newBalance.toFixed(2));
      
      try {
        const insertResult = await workingSupabase
          .from('user_balances')
          .insert({
            user_id: userId,
            balance: newBalance.toFixed(2)
          });
        
        operationResult = insertResult.data;
        balanceUpdateError = insertResult.error;
        console.log("Balance insert result:", { operationResult, balanceUpdateError });
        
        // Verify the insert worked
        const verifyResult = await new Promise((resolve) => {
          workingSupabase
            .from('user_balances')
            .select('balance')
            .eq('user_id', userId)
            .then(resolve);
        });
        
        const verifyBalance = (verifyResult as any).data;
        const verifyError = (verifyResult as any).error;
        
        console.log("Verification of inserted balance:", { verifyBalance, verifyError });
      } catch (error) {
        console.error('Exception during balance insert:', error);
        balanceUpdateError = { message: error instanceof Error ? error.message : String(error) };
      }
    }
    
    if (balanceUpdateError) {
      console.error('Error updating balance:', balanceUpdateError);
      throw new Error(`Failed to update balance: ${balanceUpdateError.message}`);
    }

    // Add admin confirmation message
    console.log("Adding admin confirmation message");
    const { data: messageResult, error: messageError } = await workingSupabase
      .from('ticket_messages')
      .insert({
        ticket_id: parseInt(ticketId),
        user_id: currentUser.id,
        message: `✅ ${reason}! $${amount.toFixed(2)} added to your account. New balance: $${newBalance.toFixed(2)}`,
        is_admin: true
      });
      
    console.log("Admin message result:", { messageResult, messageError });
    
    if (messageError) {
      console.error('Error creating admin message:', messageError);
      // Don't throw error here, balance update is more important
    }

    // Dispatch balance refresh events
    console.log("Triggering balance refresh events");
    
    window.dispatchEvent(new CustomEvent('balance-updated', { 
      detail: { userId } 
    }));
    
    window.dispatchEvent(new CustomEvent('user-balance-updated', { 
      detail: { 
        userId, 
        newBalance: newBalance.toFixed(2),
        addedAmount: amount.toFixed(2)
      } 
    }));
    
    // Additional event for navbar refresh
    window.dispatchEvent(new CustomEvent('refresh-navbar-balance', { 
      detail: { userId } 
    }));
    
    console.log("All balance refresh events dispatched");
    
    return {
      success: true,
      message: `Successfully added $${amount.toFixed(2)} to user balance. New balance: $${newBalance.toFixed(2)}`,
      newBalance: newBalance
    };
    
  } catch (error) {
    console.error('Error in approveAndAddFunds:', error);
    return {
      success: false,
      message: `Failed to approve and add funds: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const refreshUserBalance = async (userId: string) => {
  try {
    // Trigger a balance refresh event that other components can listen to
    window.dispatchEvent(new CustomEvent('balance-updated', { 
      detail: { userId } 
    }));
    
    console.log('Balance refresh event dispatched for user:', userId);
  } catch (error) {
    console.error('Error dispatching balance refresh:', error);
  }
};