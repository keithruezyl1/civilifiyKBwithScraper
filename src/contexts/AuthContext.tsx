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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user_info');

      if (storedToken && storedUser) {
        try {
          // Verify token is still valid
          const userInfo = await getCurrentUser(storedToken);
          setToken(storedToken);
          setUser(userInfo);
        } catch (error) {
          // Token is invalid, clear all user data
          clearAllUserData();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

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
