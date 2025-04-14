// Базовый URL для API запросов
export const API_BASE_URL = '/api';

// Настройки для авторизации
export const AUTH_CONFIG = {
  // Время в миллисекундах для проверки актуальности сессии
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000, // 5 минут
  // Путь для редиректа после успешного входа
  LOGIN_REDIRECT_PATH: '/dashboard',
  // Путь для редиректа после выхода
  LOGOUT_REDIRECT_PATH: '/login',
};

// Настройки роутинга
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PORTFOLIO: '/portfolio',
  TRADING: '/trading',
  ACCOUNT: '/account',
  SETTINGS: '/settings',
};