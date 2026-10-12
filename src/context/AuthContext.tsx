import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Language } from '../types.js';
import { useI18n } from '../i18n/index.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: 'teacher' | 'student';
    teacherCode?: string;
    preferredLanguage?: Language;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (name: string, preferredLanguage: Language) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('tarix_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const { setLang } = useI18n();

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('tarix_token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          if (data.user.preferred_language) {
            setLang(data.user.preferred_language);
          }
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
      // Keep state if offline or network glitch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Kirishda xatolik yuz berdi' };
      }

      localStorage.setItem('tarix_token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.user.preferred_language) {
        setLang(data.user.preferred_language);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Server bilan bog\'lanishda xatolik' };
    }
  };

  const register = async (regData: {
    name: string;
    email: string;
    password: string;
    role: 'teacher' | 'student';
    teacherCode?: string;
    preferredLanguage?: Language;
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Ro\'yxatdan o\'tishda xatolik yuz berdi' };
      }

      localStorage.setItem('tarix_token', data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.user.preferred_language) {
        setLang(data.user.preferred_language);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Server bilan bog\'lanishda xatolik' };
    }
  };

  const logout = () => {
    localStorage.removeItem('tarix_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (name: string, preferredLanguage: Language) => {
    if (!token) return { success: false, error: 'Tizimga kirilmagan' };
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, preferredLanguage }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Yangilashda xatolik' };
      }

      setUser(data.user);
      setLang(data.user.preferred_language);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Xatolik' };
    }
  };

  const isAuthenticated = !!user;
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isTeacher,
        isStudent,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
