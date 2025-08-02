import { supabase as workingSupabase, updateUserBalance } from '@/lib/supabase';
import { emitBalanceUpdate } from '@/lib/balanceEvents';

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

    // Get current balance and update it using unified client
    console.log("Fetching existing balance for user:", userId);
    const { data: balanceData, error: balanceError } = await workingSupabase
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single();

    console.log("Existing balance query result:", { balanceData, balanceError });

    const currentBalance = parseFloat(balanceData?.balance || '0');
    const newBalance = currentBalance + amount;
    
    console.log("Balance calculation:", { currentBalance, amount, newBalance });
    
    // Update or create balance record using unified function
    const { data: updateData, error: updateError } = await updateUserBalance(userId, newBalance);
    
    if (updateError) {
      console.error('Error updating balance:', updateError);
      throw new Error(`Failed to update user balance: ${updateError.message}`);
    }
    
    console.log("Balance update successful:", updateData);

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

    // Emit balance update event using unified system
    console.log("=== EMITTING BALANCE UPDATE EVENT ===");
    emitBalanceUpdate({
      userId,
      newBalance,
      previousBalance: currentBalance,
      source: 'approval'
    });
    
    console.log("=== ALL BALANCE REFRESH EVENTS DISPATCHED ===");
    
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