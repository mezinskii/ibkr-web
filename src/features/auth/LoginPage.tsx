// src/features/auth/LoginPage.tsx
import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './authContext';
import { AUTH_CONFIG, ROUTES } from '../../config';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setErrorMessage('Пожалуйста, введите логин и пароль');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    
    try {
      const success = await login(username, password);
      
      if (success) {
        navigate(AUTH_CONFIG.LOGIN_REDIRECT_PATH);
      } else {
        setErrorMessage('Неверные учетные данные или ошибка сервера');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Произошла ошибка при авторизации. Пожалуйста, попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Вход в Interactive Brokers
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="username" className="sr-only">
                Имя пользователя
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting || isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting || isLoading}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{errorMessage}</h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="btn-primary w-full flex justify-center disabled:opacity-50"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? 'Загрузка...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;