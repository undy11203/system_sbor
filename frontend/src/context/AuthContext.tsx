import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  email: string | null;
  role: string | null;
  login: (token: string, email: string, role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [email, setEmail] = useState<string | null>(localStorage.getItem('email'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));

  const login = (token: string, email: string, role: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('email', email);
    localStorage.setItem('role', role);
    setToken(token);
    setEmail(email);
    setRole(role);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    setToken(null);
    setEmail(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, email, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
