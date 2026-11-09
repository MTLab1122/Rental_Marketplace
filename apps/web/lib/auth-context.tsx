'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TenantType } from '@rental-peshawar/shared-types';

interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  roles: string[];
  tenantType?: TenantType;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  tenantType: TenantType;
  setTenantType: (type: TenantType) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tenantType, setTenantTypeState] = useState<TenantType>(TenantType.STUDENT);

  useEffect(() => {
    // Read cached tenant preference and auth session
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('peshawar_token');
      const savedUser = localStorage.getItem('peshawar_user');
      const savedType = localStorage.getItem('peshawar_tenant_type') as TenantType;

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          if (parsed.tenantType) {
            setTenantTypeState(parsed.tenantType);
          }
        } catch {
          // ignore parsing error
        }
      }

      if (savedType) {
        setTenantTypeState(savedType);
      }
    }
  }, []);

  const setTenantType = (type: TenantType) => {
    setTenantTypeState(type);
    if (typeof window !== 'undefined') {
      localStorage.setItem('peshawar_tenant_type', type);
    }
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    if (newUser.tenantType) {
      setTenantTypeState(newUser.tenantType);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('peshawar_token', newToken);
      localStorage.setItem('peshawar_user', JSON.stringify(newUser));
      if (newUser.tenantType) {
        localStorage.setItem('peshawar_tenant_type', newUser.tenantType);
      }
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('peshawar_token');
      localStorage.removeItem('peshawar_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tenantType,
        setTenantType,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
