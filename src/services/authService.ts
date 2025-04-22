// src/services/authService.ts
import { API_BASE_URL } from "../config";

export type AuthStatus = {
  authenticated: boolean;
  competing: boolean;
  connected: boolean;
  message?: string;
  fail?: string;
  error?: boolean;
};

export type ChallengeResponse = {
  challengeId: string;
  authenticated: boolean;
  message?: string;
  failed?: boolean;
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
      console.log("AuthService: Запрос статуса авторизации...");
      const response = await fetch(`${API_BASE_URL}/iserver/auth/status`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      console.log("AuthService: Получен ответ со статусом:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("AuthService: Данные о статусе:", data);

      // Если не получили явного подтверждения авторизации, считаем что пользователь не авторизован
      if (data.authenticated !== true) {
        console.log("AuthService: Статус аутентификации не подтвержден явно");
        return {
          ...data,
          authenticated: false,
        };
      }

      return data;
    } catch (error) {
      console.error(
        "AuthService: Ошибка при получении статуса авторизации:",
        error
      );
      // Явно возвращаем статус не авторизован при ошибке
      return {
        error: true,
        authenticated: false,
        competing: false,
        connected: false,
        message: "Ошибка при проверке статуса авторизации",
      };
    }
  },

  /**
   * SSO валидация - должна быть вызвана после успешного входа
   */
  ssoValidate: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/sso/validate`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error("AuthService: Ошибка при SSO валидации:", error);
      return false;
    }
  },

  /**
   * Подтверждение второго фактора аутентификации
   */
  submitChallengeResponse: async (
    challengeId: string,
    response: string
  ): Promise<boolean> => {
    try {
      const resp = await fetch(`${API_BASE_URL}/iserver/account/challenge`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          challengeId,
          response,
        }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP error! Status: ${resp.status}`);
      }

      const data = await resp.json();
      return data.authenticated || false;
    } catch (error) {
      console.error("AuthService: Ошибка при отправке ответа на вызов:", error);
      return false;
    }
  },

  /**
   * Валидация сессии (вызывается раз в некоторое время, чтобы сессия не истекла)
   */
  validateSession: async (): Promise<boolean> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/iserver/account/keepalive`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return !!data.success;
    } catch (error) {
      console.error("AuthService: Ошибка при валидации сессии:", error);
      return false;
    }
  },

  /**
   * Reauthentication - требуется вызвать после входа в систему
   */
  reauthenticate: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/iserver/reauthenticate`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.authenticated || false;
    } catch (error) {
      console.error("AuthService: Ошибка при повторной аутентификации:", error);
      return false;
    }
  },
};
