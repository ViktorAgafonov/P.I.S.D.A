import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export function ProtectedRoute({ children, requiredRole = 'user', fallbackPath = '/login' }) {
  const { isLoading, hasRole, user } = useAuth();
  const location = useLocation();

  // Показываем загрузку пока проверяется аутентификация
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Если пользователь не имеет необходимой роли
  if (!hasRole(requiredRole)) {
    // Если требуется только гостевой доступ - показываем контент
    if (requiredRole === 'guest') {
      return children;
    }

    // Если пользователь не авторизован - перенаправляем на логин
    if (!user) {
      return <Navigate to={fallbackPath} state={{ from: location }} replace />;
    }

    // Если пользователь авторизован, но нет прав - показываем сообщение
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Недостаточно прав
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            У вас нет прав доступа к данному разделу.
            {user.status === 'banned' && (
              <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                Ваш аккаунт заблокирован.
              </span>
            )}
          </p>
          
          <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <div>Ваша роль: <span className="font-medium">{user.role}</span></div>
            <div>Требуется: <span className="font-medium">{requiredRole}</span></div>
          </div>
          
          <div className="mt-6 space-x-4">
            <button
              onClick={() => window.history.back()}
              className="btn-secondary"
            >
              Назад
            </button>
            
            <a href="/" className="btn-primary">
              На главную
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Если все проверки пройдены - показываем защищенный контент
  return children;
} 