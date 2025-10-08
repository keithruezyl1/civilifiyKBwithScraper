import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getCurrentUser } from '../services/authApi';
import { clearAllUserData, clearAuthData } from '../utils/storageUtils';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Since authentication was removed, provide a default user for compatibility
  const [user, setUser] = useState<User | null>({
    id: 1,
    name: 'User',
    personId: 'P1',
    username: 'user',
    role: 'user'
  });
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // No authentication initialization needed since auth was removed

  const login = (newToken: string, userInfo: User) => {
    setToken(newToken);
    setUser(userInfo);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // Clear all user data from localStorage and sessionStorage
    clearAllUserData();
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
