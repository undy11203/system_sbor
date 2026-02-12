import React, { createContext, useState, useCallback, useEffect } from 'react';
import type { User, UserRole, LoginCredentials } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void; // для тестирования
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Моковые пользователи для демо
const MOCK_USERS: Record<string, User> = {
  'student@university.ru': {
    id: '1',
    email: 'student@university.ru',
    fullName: 'Иванов Иван Иванович',
    role: 'student',
    group: 'ИВТ-101',
  },
  'teacher@university.ru': {
    id: '2',
    email: 'teacher@university.ru',
    fullName: 'Петров Петр Петрович',
    role: 'teacher',
    department: 'Кафедра ИВТ',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Проверяем localStorage при загрузке
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    
    // Имитация задержки API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockUser = MOCK_USERS[credentials.email];
    
    if (mockUser && credentials.password === 'password') {
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } else {
      throw new Error('Неверный email или пароль');
    }
    
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
  }, []);

  // Функция для переключения ролей (только для разработки)
  const switchRole = useCallback((role: UserRole) => {
    const mockUser = role === 'student' ? MOCK_USERS['student@university.ru'] : MOCK_USERS['teacher@university.ru'];
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};