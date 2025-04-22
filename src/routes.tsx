// src/routes.tsx
import { Navigate, RouteObject } from "react-router-dom";
import { ROUTES } from "./config";

// Components
import ProtectedRoute from "./features/auth/ProtectedRoute";
import StrategyDashboard from "./features/strategies/StrategyDashboard";

// Заглушки для страниц (эти компоненты нужно будет создать)
const Portfolio = () => <div>Portfolio Page</div>;
const Trading = () => <div>Trading Page</div>;
const Account = () => <div>Account Page</div>;
const Settings = () => <div>Settings Page</div>;
const NotFound = () => <div>404 - Page Not Found</div>;

// Убираем компонент LoginPage, так как теперь используем внешнюю аутентификацию
// import LoginPage from './features/auth/LoginPage';

const routes: RouteObject[] = [
  // Публичный маршрут для перенаправления на внешнюю аутентификацию
  {
    path: ROUTES.LOGIN,
    element: <Navigate to="/" replace />, // Перенаправляем на корневой маршрут, где App.tsx решит что делать
  },

  // Защищенные маршруты
  {
    path: "/",
    element: <ProtectedRoute />, // ProtectedRoute проверяет аутентификацию
    children: [
      {
        index: true,
        element: <Navigate to={ROUTES.DASHBOARD} replace />,
      },
      {
        path: ROUTES.DASHBOARD,
        element: <StrategyDashboard />, // Используем наш новый компонент для стратегий
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
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
