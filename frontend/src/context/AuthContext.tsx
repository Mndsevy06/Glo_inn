import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, Role } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; role?: Role }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  role: Role | null;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('pg_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  // Sync token to localStorage whenever it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('pg_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pg_user');
    }
  }, [user]);

  // Fetch global config on mount
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/config`)
      .then(res => res.json())
      .then(data => {
        if (data && data.taux_echange) {
          localStorage.setItem('pressing-gloria-rate', data.taux_echange.toString());
        }
      })
      .catch(console.error);
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; role?: Role }> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        
        // Sync user settings
        if (data.user.theme) {
          localStorage.setItem('pressing-gloria-theme', data.user.theme);
          if (data.user.theme === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }
        if (data.user.currency) {
          localStorage.setItem('pressing-gloria-currency', data.user.currency);
        }

        return { success: true, role: data.user.role as Role };
      }
      return { success: false };
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return { success: false };
    }
  }, []);

  const register = useCallback(async (data: any): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (response.ok) {
        setUser(resData.user);
        setToken(resData.token);
        
        // Sync user settings if provided
        if (resData.user.theme) {
          localStorage.setItem('pressing-gloria-theme', resData.user.theme);
          if (resData.user.theme === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }
        if (resData.user.currency) {
          localStorage.setItem('pressing-gloria-currency', resData.user.currency);
        }

        return { success: true, message: resData.message };
      }
      return { success: false, message: resData.message || 'Erreur lors de l\'inscription' };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      return { success: false, message: 'Erreur réseau' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      token
    }}>
      {children}
    </AuthContext.Provider>
  );
}
