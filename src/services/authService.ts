// src/services/authService.ts
import { API_BASE_URL } from '../config';

export type AuthStatus = {
  authenticated: boolean;
  competing: boolean;
  connected: boolean;
  message?: string;
  fail?: string;
  error?: boolean;
};

/**
 * Сервис для работы с авторизацией в IBKR API
 */
export const authService = {
  /**
   * Получение текущего статуса авторизации
   */
  getAuthStatus: async (): Promise<AuthStatus> => {
    try {
      console.log('AuthService: Запрос статуса авторизации...');
      const response = await fetch(`${API_BASE_URL}/iserver/auth/status`, {
        method: 'GET',
        credentials: 'include',
      });
      
      console.log('AuthService: Получен ответ со статусом:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('AuthService: Данные о статусе:', data);
      
      // Если не получили явного подтверждения авторизации, считаем что пользователь не авторизован
      if (data.authenticated !== true) {
        console.log('AuthService: Статус аутентификации не подтвержден явно');
        return { 
          ...data,
          authenticated: false 
        };
      }
      
      return data;
    } catch (error) {
      console.error('AuthService: Ошибка при получении статуса авторизации:', error);
      // Явно возвращаем статус не авторизован при ошибке
      return { 
        error: true, 
        authenticated: false, 
        competing: false, 
        connected: false,
        message: 'Ошибка при проверке статуса авторизации'
      };
    }
  },

  /**
   * Вход в систему IBKR
   */
  login: async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/iserver/account/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.authenticated || false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  },

  /**
   * Выход из системы IBKR
   */
  logout: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/iserver/account/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  },

  /**
   * Валидация сессии (вызывается раз в некоторое время, чтобы сессия не истекла)
   */
  validateSession: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/iserver/account/keepalive`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      return !!data.success;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }
};