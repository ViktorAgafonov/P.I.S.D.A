import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Calendar, Shield, AlertTriangle } from 'lucide-react';

export function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          Информация о профиле недоступна
        </p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Никогда';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const getRoleColor = (role) => {
    const colors = {
      guest: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      user: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      editor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return colors[role] || colors.guest;
  };

  const getStatusColor = (status) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Мой профиль
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Информация о вашем аккаунте и правах доступа
        </p>
      </div>

      {/* Основная информация */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Основная информация
          </h3>
        </div>
        
        <div className="px-6 py-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Имя пользователя */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <User className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Имя пользователя
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white font-mono">
                  {user.username}
                </dd>
              </div>
            </div>

            {/* Email - удалено из проекта */}

            {/* Дата создания */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Дата регистрации
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {formatDate(user.createdAt)}
                </dd>
              </div>
            </div>

            {/* Последний вход */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Последний вход
                </dt>
                <dd className="text-sm text-gray-900 dark:text-white">
                  {formatDate(user.lastLogin)}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Роли и права */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Роли и права доступа
          </h3>
        </div>
        
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Текущая роль */}
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Текущая роль
              </dt>
              <dd>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.effectiveRole)}`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user.effectiveRole}
                </span>
              </dd>
            </div>

            {/* Статус аккаунта */}
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Статус аккаунта
              </dt>
              <dd>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                  {user.status === 'active' ? (
                    <User className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 mr-1" />
                  )}
                  {user.status === 'active' ? 'Активен' : 'Заблокирован'}
                </span>
              </dd>
            </div>

            {/* Оригинальная роль (если заблокирован) */}
            {user.status === 'banned' && user.originalRole && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Оригинальная роль
                </dt>
                <dd>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.originalRole)}`}>
                    <Shield className="w-3 h-3 mr-1" />
                    {user.originalRole}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Роль будет восстановлена после разблокировки
                  </p>
                </dd>
              </div>
            )}
          </div>

          {/* Предупреждение о блокировке */}
          {user.status === 'banned' && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Аккаунт заблокирован
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Ваш аккаунт временно заблокирован. Доступ ограничен до гостевого уровня.
                    {user.bannedAt && (
                      <span className="block mt-1">
                        Дата блокировки: {formatDate(user.bannedAt)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Дополнительная информация */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          О ролях пользователей
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li><strong>Гость:</strong> Базовый доступ к публичным разделам</li>
          <li><strong>Пользователь:</strong> Доступ к пользовательским сервисам</li>
          <li><strong>Редактор:</strong> Управление контентом и документами</li>
          <li><strong>Администратор:</strong> Полный доступ к системе</li>
        </ul>
      </div>
    </div>
  );
} 