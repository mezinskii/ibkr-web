// src/routes.tsx
import React from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import { ROUTES } from './config';

// Components
import LoginPage from './features/auth/LoginPage';
import ProtectedRoute from './features/auth/ProtectedRoute';

// Заглушки для страниц (эти компоненты нужно будет создать)
const Dashboard = () => <div>Dashboard Page</div>;
const Portfolio = () => <div>Portfolio Page</div>;
const Trading = () => <div>Trading Page</div>;
const Account = () => <div>Account Page</div>;
const Settings = () => <div>Settings Page</div>;
const NotFound = () => <div>404 - Page Not Found</div>;

const routes: RouteObject[] = [
  // Публичный маршрут - страница логина
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  
  // Защищенные маршруты
  {
    path: '/',
    element: <ProtectedRoute />, // ProtectedRoute проверяет аутентификацию
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
      {
        path: ROUTES.DASHBOARD,
        element: <Dashboard />,
      },
      {
        path: ROUTES.PORTFOLIO,
        element: <Portfolio />,
      },
      {
        path: ROUTES.TRADING,
        element: <Trading />,
      },
      {
        path: ROUTES.ACCOUNT,
        element: <Account />,
      },
      {
        path: ROUTES.SETTINGS,
        element: <Settings />,
      },
    ],
  },
  
  // Страница 404
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;