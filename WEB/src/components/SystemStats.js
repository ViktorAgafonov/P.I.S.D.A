import React from 'react';
import { useQuery } from 'react-query';
import { authAPI, toolsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Shield, 
  Activity, 
  Wrench, 
  TrendingUp,
  Database 
} from 'lucide-react';

export function SystemStats() {
  const { hasRole } = useAuth();

  // Загружаем данные только если есть права
  const { data: usersData } = useQuery(
    'users-stats',
    () => authAPI.getUsers(),
    {
      enabled: hasRole('admin'),
      select: (response) => response.data.users,
    }
  );

  const { data: toolsData } = useQuery(
    'tools-stats',
    () => toolsAPI.getTools(),
    {
      select: (response) => response.data,
    }
  );

  const { data: rolesData } = useQuery(
    'roles-stats',
    () => authAPI.getRoles(),
    {
      select: (response) => response.data.roles,
    }
  );

  // Если нет прав администратора, показываем базовую статистику
  if (!hasRole('admin')) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Статистика системы
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Доступные инструменты */}
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {toolsData?.length || 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Доступных инструментов
            </div>
          </div>

          {/* Системные роли */}
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {rolesData ? Object.keys(rolesData).length : 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Ролей в системе
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Для просмотра подробной статистики требуются права администратора
          </p>
        </div>
      </div>
    );
  }

  // Расчет статистики для администраторов
  const totalUsers = usersData?.length || 0;
  const activeUsers = usersData?.filter(u => u.status === 'active').length || 0;
  const bannedUsers = usersData?.filter(u => u.status === 'banned').length || 0;
  
  const roleStats = usersData?.reduce((acc, user) => {
    acc[user.effectiveRole] = (acc[user.effectiveRole] || 0) + 1;
    return acc;
  }, {}) || {};

  const totalTools = toolsData?.length || 0;
  const totalRoles = rolesData ? Object.keys(rolesData).length : 0;

  const stats = [
    {
      name: 'Всего пользователей',
      value: totalUsers,
      icon: Users,
      color: 'blue',
      description: `${activeUsers} активных, ${bannedUsers} заблокированных`,
    },
    {
      name: 'Администраторы',
      value: roleStats.admin || 0,
      icon: Shield,
      color: 'purple',
      description: 'Пользователей с правами админа',
    },
    {
      name: 'Редакторы',
      value: roleStats.editor || 0,
      icon: Activity,
      color: 'green',
      description: 'Пользователей с правами редактора',
    },
    {
      name: 'Обычные пользователи',
      value: roleStats.user || 0,
      icon: Users,
      color: 'yellow',
      description: 'Пользователей с базовыми правами',
    },
    {
      name: 'Инструменты',
      value: totalTools,
      icon: Wrench,
      color: 'indigo',
      description: 'Установленных инструментов в системе',
    },
    {
      name: 'Роли',
      value: totalRoles,
      icon: Database,
      color: 'gray',
      description: 'Системных ролей',
    },
  ];

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
      purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
      green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
      yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
      indigo: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400',
      gray: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Статистика системы
        </h3>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            Активна
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const IconComponent = stat.icon;
          const colorClasses = getColorClasses(stat.color);
          
          return (
            <div key={stat.name} className="text-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${colorClasses}`}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                {stat.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {stat.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Дополнительная информация */}
      {totalUsers > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between items-center">
              <span>Процент активных пользователей:</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {Math.round((activeUsers / totalUsers) * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 