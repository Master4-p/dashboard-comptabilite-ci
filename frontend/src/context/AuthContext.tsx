import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthContextType {
  user: { name: string; email: string } | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS = [
  { email: 'admin@relaisit.ci', password: 'admin123', name: 'Administrateur' },
  { email: 'compta@relaisit.ci', password: 'compta2026', name: 'Comptable' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('relaisit_auth');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    const found = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const userData = { name: found.name, email: found.email };
      setUser(userData);
      localStorage.setItem('relaisit_auth', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('relaisit_auth');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
