'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from './api';
import { connectSocket, disconnectSocket } from './socket';

interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  trophies: number;
  level: number;
  coins: number;
  stats: {
    battlesPlayed: number;
    battlesWon: number;
    totalPacksOpened: number;
    totalCardsCollected: number;
  };
  dailyPackOpenedAt?: string | null;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ firstLoginBonus?: { coins: number; message: string } | null }>;
  register: (username: string, email: string, password: string) => Promise<{ welcomeBonus?: any[] }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err) {
      console.error('Failed to refresh user:', err);
      // Only clear user state if the token was removed (indicating a 401 Unauthorized from api.ts)
      if (!localStorage.getItem('token')) {
        localStorage.removeItem('user');
        setUser(null);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const cachedUser = localStorage.getItem('user');
    
    if (token) {
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          // ignore
        }
      }
      refreshUser().finally(() => {
        setLoading(false);
        connectSocket(token);
      });
    } else {
      setLoading(false);
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.token);
    return { firstLoginBonus: data.firstLoginBonus ?? null };
  };

  const register = async (username: string, email: string, password: string) => {
    const data = await authApi.register({ username, email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    connectSocket(data.token);
    return { welcomeBonus: data.welcomeBonus };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
