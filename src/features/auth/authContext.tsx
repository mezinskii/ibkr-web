// src/features/auth/authContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthStatus } from '../../services/authService';
import { AUTH_CONFIG } from '../../config';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  authStatus: AuthStatus | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Явно инициализируем состояние как не аутентифицированное
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);

  // Проверка статуса авторизации (с задержкой для предотвращения частых вызовов)
  const checkAuthStatus = async (): Promise<void> => {
    console.log('AuthContext: Проверка статуса авторизации...');
    
    // Не запускаем повторную проверку, если уже идет загрузка
    if (isLoading) {
      console.log('AuthContext: Пропуск проверки, так как уже идет загрузка');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const status = await authService.getAuthStatus();
      console.log('AuthContext: Получен статус:', status);
      
      setAuthStatus(status);
      
      // Явно проверяем, что статус.authenticated === true
      const isUserAuthenticated = status.authenticated === true;
      console.log('AuthContext: Пользователь авторизован?', isUserAuthenticated);
      
      setIsAuthenticated(isUserAuthenticated);
    } catch (error) {
      console.error('AuthContext: Ошибка при проверке статуса:', error);
      // Сбрасываем состояние авторизации при ошибке
      setIsAuthenticated(false);
      setAuthStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Вход в систему
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await authService.login(username, password);
      if (success) {
        await checkAuthStatus();
      }
      return success;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Выход из системы
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setAuthStatus(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Проверка статуса при первом рендере
  useEffect(() => {
    console.log('AuthContext: Первоначальная проверка статуса авторизации');
    let isActive = true; // Флаг для предотвращения обновления состояния после размонтирования
    
    const initialCheck = async () => {
      try {
        const status = await authService.getAuthStatus();
        
        // Проверяем, что компонент все еще смонтирован
        if (isActive) {
          setAuthStatus(status);
          setIsAuthenticated(status.authenticated === true);
          setIsLoading(false);
        }
      } catch (error) {
        if (isActive) {
          console.error('Initial auth check error:', error);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };
    
    initialCheck();
    
    // Функция очистки, которая вызывается при размонтировании компонента
    return () => {
      isActive = false;
    };
  }, []); // Пустой массив зависимостей - выполняется только один раз

  // Периодическая проверка сессии для поддержания активности
  useEffect(() => {
    if (!isAuthenticated) return;

    const keepSessionAlive = async () => {
      try {
        await authService.validateSession();
      } catch (error) {
        console.error('Session validation error:', error);
        // Если сессия невалидна, проверяем общий статус авторизации
        checkAuthStatus();
      }
    };

    const intervalId = setInterval(keepSessionAlive, AUTH_CONFIG.SESSION_CHECK_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  const value = {
    isAuthenticated,
    isLoading,
    authStatus,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};