// Balance event system for real-time updates across components

export interface BalanceUpdateEvent {
  userId: string;
  newBalance: number;
  previousBalance?: number;
  source: 'approval' | 'purchase' | 'admin' | 'manual';
}

// Event listener management
const balanceListeners = new Set<(event: BalanceUpdateEvent) => void>();

export const subscribeToBalanceUpdates = (callback: (event: BalanceUpdateEvent) => void) => {
  balanceListeners.add(callback);
  
  return () => {
    balanceListeners.delete(callback);
  };
};

export const emitBalanceUpdate = (event: BalanceUpdateEvent) => {
  console.log('Emitting balance update:', event);
  
  // Notify all listeners
  balanceListeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      console.error('Error in balance update listener:', error);
    }
  });
  
  // Also emit as browser event for legacy support
  window.dispatchEvent(new CustomEvent('balance-updated', { 
    detail: event 
  }));
  
  // Update localStorage cache
  localStorage.setItem(`user_balance_${event.userId}`, event.newBalance.toString());
  
  // Force navbar refresh by dispatching to navbar component
  window.dispatchEvent(new CustomEvent('navbar-refresh', {
    detail: { userId: event.userId, balance: event.newBalance }
  }));
};

// Debounced balance fetch to prevent rapid API calls
let balanceFetchTimeout: NodeJS.Timeout | null = null;

export const debouncedBalanceRefresh = (userId: string, delay = 1000) => {
  if (balanceFetchTimeout) {
    clearTimeout(balanceFetchTimeout);
  }
  
  balanceFetchTimeout = setTimeout(() => {
    window.dispatchEvent(new CustomEvent('force-balance-refresh', {
      detail: { userId }
    }));
  }, delay);
};