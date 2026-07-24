import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Reads the persisted session from localStorage once, synchronously, so the initial
// render already has the restored session — no mount effect / loading flicker needed.
function readStoredSession(): { token: string | null; user: User | null } {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  if (!storedToken || !storedUser) return { token: null, user: null };
  try {
    return { token: storedToken, user: JSON.parse(storedUser) };
  } catch {
    // Corrupted/hand-edited storage — clear it instead of leaving the app blank
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredSession().token);
  const [user, setUser] = useState<User | null>(() => readStoredSession().user);
  const isLoading = false;

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook — components call useAuth() instead of useContext(AuthContext) directly.
// react-refresh wants non-component exports in their own file; kept here to avoid
// scattering this one-line hook across the codebase and touching its 10 importers.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
