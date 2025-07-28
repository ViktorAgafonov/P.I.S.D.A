import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SystemInfo } from './SystemInfo';
import { QuickActions } from './QuickActions';
import { SystemStats } from './SystemStats';
import { ToolsPlanner } from './ToolsPlanner';
import Profile from '../auth/components/Profile';

// Виджет последней активности
function RecentActivityWidget() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Последняя активность
      </h3>
      <div className="space-y-3">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
          <span>Вход в систему</span>
          <span className="ml-auto text-xs">2 мин назад</span>
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
          <span>Просмотр профиля</span>
          <span className="ml-auto text-xs">5 мин назад</span>
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
          <span>Обновление настроек</span>
          <span className="ml-auto text-xs">10 мин назад</span>
        </div>
      </div>
    </div>
  );
}

// Дашборд для гостей
function GuestDashboard() {
  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Добро пожаловать в P.I.S.D.A.!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          У вас гостевой доступ к системе. Войдите в систему для получения дополнительных возможностей.
        </p>
      </div>

      {/* Сетка виджетов для гостей */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная информация */}
        <div className="lg:col-span-2">
          <SystemInfo />
        </div>
        
        {/* Быстрые действия */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

// Дашборд для пользователей
function UserDashboard() {
  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Личный кабинет пользователя
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          У вас пользовательский доступ к системе
        </p>
      </div>

      {/* Сетка виджетов для пользователей */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Левая колонка - основная информация */}
        <div className="lg:col-span-2 space-y-6">
          <SystemInfo />
          <SystemStats />
        </div>

        {/* Правая колонка - профиль и действия */}
        <div className="lg:col-span-2 space-y-6">
          <Profile />
          <QuickActions />
          <RecentActivityWidget />
        </div>
      </div>
    </div>
  );
}

// Дашборд для редакторов
function EditorDashboard() {
  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Панель редактора
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          У вас права редактора контента
        </p>
      </div>

      {/* Сетка виджетов для редакторов */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Верхняя строка */}
        <div className="lg:col-span-2">
          <SystemInfo />
        </div>
        <div className="lg:col-span-2">
          <Profile />
        </div>

        {/* Средняя строка */}
        <div className="lg:col-span-2">
          <SystemStats />
        </div>
        <div className="lg:col-span-2">
          <QuickActions />
        </div>

        {/* Нижняя строка */}
        <div className="lg:col-span-2">
          <ToolsPlanner />
        </div>
        <div className="lg:col-span-2">
          <RecentActivityWidget />
        </div>
      </div>
    </div>
  );
}

// Дашборд для администраторов
function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Административная панель
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          У вас административные права. Полный доступ к управлению системой.
        </p>
      </div>

      {/* Сетка виджетов для администраторов */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Верхняя строка */}
        <div className="lg:col-span-1">
          <SystemInfo />
        </div>
        <div className="lg:col-span-1">
          <Profile />
        </div>
        <div className="lg:col-span-2">
          <QuickActions />
        </div>

        {/* Средняя строка */}
        <div className="lg:col-span-2">
          <SystemStats />
        </div>
        <div className="lg:col-span-2">
          <ToolsPlanner />
        </div>

        {/* Нижняя строка */}
        <div className="lg:col-span-4">
          <RecentActivityWidget />
        </div>
      </div>
    </div>
  );
}

export function DashboardRenderer() {
  const { user, hasRole } = useAuth();

  // Определяем роль пользователя
  const userRole = user?.role || 'guest';

  // Возвращаем соответствующий дашборд для роли
  switch (userRole) {
    case 'admin':
      return <AdminDashboard />;
    case 'editor':
      return <EditorDashboard />;
    case 'user':
      return <UserDashboard />;
    case 'guest':
    default:
      return <GuestDashboard />;
  }
} 