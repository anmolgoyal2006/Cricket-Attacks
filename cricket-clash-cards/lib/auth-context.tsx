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
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
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
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
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
    setUser(data.user);
    connectSocket(data.token);
  };

  const register = async (username: string, email: string, password: string) => {
    const data = await authApi.register({ username, email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    connectSocket(data.token);
  };

  const logout = () => {
    localStorage.removeItem('token');
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
