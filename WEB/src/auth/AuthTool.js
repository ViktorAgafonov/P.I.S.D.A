import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, UserCheck, Settings, Wrench, Grid } from 'lucide-react';
import UserManagement from './components/UserManagement';
import Profile from './components/Profile';
import { ToolsManager } from '../components/ToolsManager';


export function AuthTool() {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Профиль',
      href: '/auth',
      icon: UserCheck,
      exact: true,
      requiredRole: 'user'
    },
    {
      name: 'Пользователи',
      href: '/auth/users',
      icon: Users,
      requiredRole: 'admin'
    },
    {
      name: 'Инструменты',
      href: '/auth/tools',
      icon: Wrench,
      requiredRole: 'admin'
    },

  ];

  const availableNavigation = navigation.filter(item => hasRole(item.requiredRole));

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Управление авторизацией
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Управление профилем, пользователями и инструментами системы
        </p>
      </div>

      {/* Навигация */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {availableNavigation.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <item.icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${
                    isActive
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Контент */}
      <div className="py-6">
        <Routes>
          <Route index element={<Profile />} />
          
          {hasRole('admin') && (
            <>
              <Route path="users" element={<UserManagement />} />
              <Route path="roles" element={<Navigate to="/auth/users" replace />} />
              <Route path="tools" element={<ToolsManager />} />

            </>
          )}
          
          {/* 404 для неизвестных роутов */}
          <Route path="*" element={
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Страница не найдена
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Запрашиваемая страница не существует или у вас нет прав доступа.
              </p>
              <Link
                to="/auth"
                className="btn-primary"
              >
                Вернуться к профилю
              </Link>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
} 