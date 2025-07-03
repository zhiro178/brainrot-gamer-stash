import { createContext, useContext, useState, ReactNode } from 'react';

interface AdminContextType {
  isAdminMode: boolean;
  toggleAdminMode: () => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminMode, setIsAdminMode] = useState(false); // Changed back to false by default
  const [isAdmin, setIsAdmin] = useState(false);

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
  };

  return (
    <AdminContext.Provider value={{ isAdminMode, toggleAdminMode, isAdmin, setIsAdmin }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};