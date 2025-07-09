import React from 'react';
import { useQuery } from 'react-query';
import { authAPI } from '../../services/api';
import { Shield, Users, Lock, Key, Settings, CheckCircle } from 'lucide-react';

export function RoleManager() {
  // Получение информации о ролях
  const { data: rolesData, isLoading, error } = useQuery(
    'roles',
    () => authAPI.getRoles(),
    {
      select: (response) => response.data.roles,
    }
  );

  const roleIcons = {
    guest: Users,
    user: Key, 
    editor: Settings,
    admin: Shield,
  };

  const rolePermissions = {
    guest: [
      'Просмотр публичных разделов',
      'Доступ к базовой информации',
      'Регистрация аккаунта'
    ],
    user: [
      'Все права гостя',
      'Доступ к пользовательским сервисам',
      'Просмотр собственного профиля',
      'Использование инструментов для пользователей'
    ],
    editor: [
      'Все права пользователя',
      'Управление контентом',
      'Редактирование документов',
      'Загрузка и управление файлами',
      'Настройка печатных форм'
    ],
    admin: [
      'Все права редактора',
      'Управление пользователями',
      'Блокировка/разблокировка аккаунтов',
      'Настройка системы',
      'Доступ к файловому менеджеру',
      'Полный административный доступ'
    ]
  };

  const getRoleColor = (role) => {
    const colors = {
      guest: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
      user: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
      editor: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
      admin: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20',
    };
    return colors[role] || colors.guest;
  };

  const getRoleTextColor = (role) => {
    const colors = {
      guest: 'text-gray-600 dark:text-gray-400',
      user: 'text-blue-600 dark:text-blue-400',
      editor: 'text-green-600 dark:text-green-400',
      admin: 'text-purple-600 dark:text-purple-400',
    };
    return colors[role] || colors.guest;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">
          Ошибка загрузки ролей: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Управление ролями
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Информация о ролях пользователей и их правах доступа в системе
        </p>
      </div>

      {/* Иерархия ролей */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          Иерархия ролей
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Гость</span>
              <div className="text-xs text-gray-500 dark:text-gray-500">Уровень 0</div>
            </div>
            
            <div className="text-gray-400">→</div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center mb-2">
                <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-blue-600 dark:text-blue-400">Пользователь</span>
              <div className="text-xs text-gray-500 dark:text-gray-500">Уровень 1</div>
            </div>
            
            <div className="text-gray-400">→</div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center mb-2">
                <Settings className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-green-600 dark:text-green-400">Редактор</span>
              <div className="text-xs text-gray-500 dark:text-gray-500">Уровень 2</div>
            </div>
            
            <div className="text-gray-400">→</div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center mb-2">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-purple-600 dark:text-purple-400">Администратор</span>
              <div className="text-xs text-gray-500 dark:text-gray-500">Уровень 3</div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-4">
          Каждая роль наследует права предыдущих ролей. Роль более высокого уровня имеет все права ролей нижних уровней.
        </p>
      </div>

      {/* Карточки ролей */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rolesData && Object.entries(rolesData).map(([roleName, roleInfo]) => {
          const IconComponent = roleIcons[roleName] || Shield;
          const permissions = rolePermissions[roleName] || [];
          
          return (
            <div 
              key={roleName}
              className={`border-2 rounded-lg p-6 ${getRoleColor(roleName)}`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRoleColor(roleName)}`}>
                  <IconComponent className={`w-6 h-6 ${getRoleTextColor(roleName)}`} />
                </div>
                <div>
                  <h3 className={`text-xl font-semibold ${getRoleTextColor(roleName)}`}>
                    {roleInfo.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {roleInfo.description}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Уровень доступа
                  </span>
                  <span className={`text-sm font-bold ${getRoleTextColor(roleName)}`}>
                    {roleInfo.level}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Права доступа:
                </h4>
                <ul className="space-y-2">
                  {permissions.map((permission, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {permission}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Информация о системе БАН */}
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-2">
              Система блокировки (БАН)
            </h3>
            <div className="text-sm text-orange-800 dark:text-orange-200 space-y-2">
              <p>
                При блокировке пользователя его эффективная роль снижается до уровня "Гость", 
                но оригинальная роль сохраняется в системе.
              </p>
              <p>
                После разблокировки пользователь автоматически получает обратно свою оригинальную роль.
              </p>
              <p>
                Администраторы не могут заблокировать сами себя.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Рекомендации по безопасности */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Рекомендации по безопасности
        </h3>
        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Регулярно проверяйте список пользователей и их роли</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Назначайте минимально необходимые права доступа</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Блокируйте неактивные аккаунты</span>
          </li>
          <li className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Периодически аудируйте права администраторов</span>
          </li>
        </ul>
      </div>
    </div>
  );
} 