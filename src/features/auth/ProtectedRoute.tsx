// src/features/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './authContext';
import { ROUTES } from '../../config';

/**
 * Компонент для защиты маршрутов, требующих авторизации
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Отладочные логи
  console.log('ProtectedRoute состояние:', { 
    isAuthenticated, 
    isLoading, 
    currentPath: location.pathname 
  });

  // Показываем индикатор загрузки, пока проверяем статус авторизации
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        <p className="ml-4">Проверка авторизации...</p>
      </div>
    );
  }

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Пользователь не авторизован, перенаправление на логин');
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Если пользователь авторизован, показываем дочерние маршруты
  console.log('ProtectedRoute: Пользователь авторизован, показываем содержимое');
  return <Outlet />;
};

export default ProtectedRoute;