// src/App.tsx
import { useEffect } from "react";
import {
  BrowserRouter,
  useRoutes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/authContext";
import routes from "./routes";
import { ROUTES } from "./config";

// URL для Interactive Brokers Gateway - из переменных окружения или конфигурации
const IB_GATEWAY_URL = import.meta.env.VITE_IB_GATEWAY_URL || "https://localhost:5000/";

// Компонент для рендеринга маршрутов
const AppRoutes = () => {
  const element = useRoutes(routes);
  return element;
};

// Компонент для проверки аутентификации и редиректа к IB Gateway
const AuthCheck = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Не выполняем редирект во время загрузки
    if (isLoading) return;

    // Проверка аутентификации в IB Gateway
    const checkAndRedirect = async () => {
      // Если пользователь не аутентифицирован и не находится на странице логина
      if (!isAuthenticated && location.pathname !== ROUTES.LOGIN) {
        console.log("Перенаправление на IB Gateway для аутентификации");
        
        // Сохраняем текущий URL для возврата после аутентификации
        const returnUrl = `${window.location.origin}${location.pathname}${location.search}`;
        sessionStorage.setItem('returnUrl', returnUrl);
        
        // Перенаправляем на IB Gateway
        window.location.href = IB_GATEWAY_URL;
        return;
      }

      // Если пользователь аутентифицирован и находится на странице логина, перенаправляем на дашборд
      if (isAuthenticated && location.pathname === ROUTES.LOGIN) {
        console.log("Перенаправление на дашборд");
        navigate(ROUTES.DASHBOARD, { replace: true });
      }
    };

    checkAndRedirect();
  }, [isAuthenticated, isLoading, location.pathname, location.search, navigate]);

  // Показываем лоадер, пока идет проверка авторизации
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        <p className="ml-4">Проверка авторизации...</p>
      </div>
    );
  }

  return null;
};

// Основной компонент приложения
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
