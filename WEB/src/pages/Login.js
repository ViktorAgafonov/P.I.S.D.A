import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, User, Lock, Mail } from 'lucide-react';

export function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register: registerUser, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Если пользователь уже авторизован, перенаправляем
  useEffect(() => {
    if (user && !isLoading) {
      console.log('🔍 Пользователь уже авторизован, перенаправление на:', from);
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, from]);

  // Форма входа
  const loginForm = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Форма регистрации
  const registerForm = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onLogin = async (data) => {
    const result = await login(data);
    if (result.success) {
      console.log('🔍 Перенаправление после логина на:', from);
      navigate(from, { replace: true });
    } else if (result.authDisabled) {
      // Если авторизация отключена, показываем специальное сообщение
      console.log('🔍 Авторизация отключена для роли пользователя');
    }
  };

  const onRegister = async (data) => {
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', {
        message: 'Пароли не совпадают'
      });
      return;
    }

    const { confirmPassword, ...registerData } = data;
    const result = await registerUser(registerData);
    
    if (result.success) {
      setIsRegistering(false);
      loginForm.setValue('username', data.username);
    }
  };

  const currentForm = isRegistering ? registerForm : loginForm;
  const currentSubmit = isRegistering ? onRegister : onLogin;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Заголовок */}
        <div>
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-2xl">P</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isRegistering ? 'Создание аккаунта' : 'Вход в систему'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            P.I.S.D.A. - Система Документооборота
          </p>
        </div>

        {/* Форма */}
        <form className="mt-8 space-y-6" onSubmit={currentForm.handleSubmit(currentSubmit)}>
          <div className="space-y-4">
            {/* Имя пользователя */}
            <div>
              <label htmlFor="username" className="sr-only">
                Имя пользователя
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...currentForm.register('username', {
                    required: 'Имя пользователя обязательно',
                    minLength: {
                      value: 3,
                      message: 'Минимум 3 символа'
                    }
                  })}
                  type="text"
                  className="input-field pl-10"
                  placeholder="Имя пользователя"
                />
              </div>
              {currentForm.formState.errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {currentForm.formState.errors.username.message}
                </p>
              )}
            </div>

            {/* Email (только для регистрации) */}
            {isRegistering && (
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerForm.register('email', {
                      required: 'Email обязателен',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Некорректный email'
                      }
                    })}
                    type="email"
                    className="input-field pl-10"
                    placeholder="Email"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            )}

            {/* Пароль */}
            <div>
              <label htmlFor="password" className="sr-only">
                Пароль
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...currentForm.register('password', {
                    required: 'Пароль обязателен',
                    minLength: {
                      value: 6,
                      message: 'Минимум 6 символов'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder="Пароль"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {currentForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {currentForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Подтверждение пароля (только для регистрации) */}
            {isRegistering && (
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Подтверждение пароля
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerForm.register('confirmPassword', {
                      required: 'Подтвердите пароль'
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pl-10"
                    placeholder="Подтверждение пароля"
                  />
                </div>
                {registerForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Кнопка отправки */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                isRegistering ? 'Зарегистрироваться' : 'Войти'
              )}
            </button>
          </div>

          {/* Переключение между входом и регистрацией */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {isRegistering 
                ? 'Уже есть аккаунт? Войти' 
                : 'Нет аккаунта? Зарегистрироваться'
              }
            </button>
          </div>

          {/* Гостевой доступ */}
          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Продолжить как гость
            </Link>
          </div>
        </form>

        {/* Информация по умолчанию */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Тестовый доступ
          </h3>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Администратор: <strong>admin</strong> / <strong>admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
} 