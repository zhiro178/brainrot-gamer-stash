import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  rarity: string;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  addToCart: (item: Omit<CartItem, 'quantity'>) => boolean;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  isItemInCart: (itemId: number) => boolean;
  getItemQuantity: (itemId: number) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('shopping_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('shopping_cart', JSON.stringify(items));
  }, [items]);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>): boolean => {
    // Check if adding would exceed max items (10)
    if (itemCount >= 10) {
      return false;
    }

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === newItem.id);
      
      if (existingItem) {
        // If item exists and adding one more would exceed 10 total items, don't add
        if (itemCount >= 10) {
          return prevItems;
        }
        // Increase quantity
        return prevItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
        return [...prevItems, { ...newItem, quantity: 1 }];
      }
    });
    return true;
  };

  const removeFromCart = (itemId: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );
      
      // Check if total items would exceed 10
      const newTotal = newItems.reduce((total, item) => total + item.quantity, 0);
      if (newTotal > 10) {
        return prevItems; // Don't update if it would exceed limit
      }
      
      return newItems;
    });
  };

  const clearCart = () => {
    setItems([]);
  };

  const isItemInCart = (itemId: number): boolean => {
    return items.some(item => item.id === itemId);
  };

  const getItemQuantity = (itemId: number): number => {
    const item = items.find(item => item.id === itemId);
    return item ? item.quantity : 0;
  };

  const value: CartContextType = {
    items,
    itemCount,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isItemInCart,
    getItemQuantity,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}