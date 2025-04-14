// src/App.tsx
import React, { useEffect } from "react";
import {
  BrowserRouter,
  useRoutes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/authContext";
import routes from "./routes";
import { ROUTES } from "./config";

// Компонент для рендеринга маршрутов
const AppRoutes = () => {
  const element = useRoutes(routes);
  return element;
};

// Компонент для проверки аутентификации и редиректа
const AuthCheck = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Не выполняем редирект во время загрузки
    if (isLoading) return;

    // Если пользователь не аутентифицирован и не находится на странице логина
    if (!isAuthenticated && location.pathname !== ROUTES.LOGIN) {
      console.log("Перенаправление на страницу логина");
      navigate(ROUTES.LOGIN, { replace: true });
    }

    // Если пользователь аутентифицирован и находится на странице логина
    if (isAuthenticated && location.pathname === ROUTES.LOGIN) {
      console.log("Перенаправление на дашборд");
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, isLoading, location.pathname]); // Удаляем navigate из зависимостей

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthCheck />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
