import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Users, 
  Settings, 
  FileText, 
  Upload, 
  Shield, 
  Plus,
  Wrench
} from 'lucide-react';

export function QuickActions() {
  const { user, hasRole } = useAuth();

  const actions = [
    // Основные действия - топ 4 самых используемых
    {
      name: 'Мой профиль',
      description: 'Просмотр и редактирование профиля',
      icon: User,
      link: '/auth',
      color: 'blue',
      requiredRole: 'user',
    },
    {
      name: 'Загрузить файл',
      description: 'Загрузка документов и файлов',
      icon: Upload,
      link: '/documents/upload',
      color: 'green',
      requiredRole: 'editor',
      comingSoon: true,
    },
    {
      name: 'Управление пользователями',
      description: 'Управление пользователями и их ролями',
      icon: Users,
      link: '/auth/users',
      color: 'red',
      requiredRole: 'admin',
    },
    {
      name: 'Управление инструментами',
      description: 'Настройка активности и прав доступа',
      icon: Wrench,
      link: '/auth/tools',
      color: 'indigo',
      requiredRole: 'admin',
    },
  ];

  const availableActions = actions.filter(action => 
    hasRole(action.requiredRole)
  );

  const getColorClasses = (color, comingSoon = false) => {
    if (comingSoon) {
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        hover: 'hover:bg-gray-150 dark:hover:bg-gray-750',
        icon: 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
        text: 'text-gray-500 dark:text-gray-400',
      };
    }

    const colorMap = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/40',
        icon: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
        text: 'text-blue-600 dark:text-blue-400',
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        hover: 'hover:bg-green-100 dark:hover:bg-green-900/40',
        icon: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
        text: 'text-green-600 dark:text-green-400',
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/40',
        icon: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
        text: 'text-purple-600 dark:text-purple-400',
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        hover: 'hover:bg-red-100 dark:hover:bg-red-900/40',
        icon: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
        text: 'text-red-600 dark:text-red-400',
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/40',
        icon: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
        text: 'text-yellow-600 dark:text-yellow-400',
      },
      gray: {
        bg: 'bg-gray-50 dark:bg-gray-800',
        hover: 'hover:bg-gray-100 dark:hover:bg-gray-700',
        icon: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
        text: 'text-gray-600 dark:text-gray-400',
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/40',
        icon: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400',
        text: 'text-indigo-600 dark:text-indigo-400',
      },
    };

    return colorMap[color] || colorMap.gray;
  };

  if (!user) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Быстрые действия
        </h3>
        <div className="text-center py-8">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Войдите в систему для доступа к быстрым действиям
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Быстрые действия
      </h3>
      
      {availableActions.length === 0 ? (
        <div className="text-center py-8">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Нет доступных действий для вашей роли
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {availableActions.map((action) => {
            const colors = getColorClasses(action.color, action.comingSoon);
            const IconComponent = action.icon;
            
            const content = (
              <div className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${colors.bg} ${!action.comingSoon ? colors.hover : ''} transition-colors group ${action.comingSoon ? 'cursor-not-allowed' : 'cursor-pointer'} min-h-[100px]`}>
                <div className="flex items-start space-x-3 h-full">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className={`text-sm font-medium leading-tight ${action.comingSoon ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      <div className="break-words">
                        {action.name}
                        {action.comingSoon && (
                          <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                            Скоро
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed break-words">
                      {action.description}
                    </div>
                  </div>
                </div>
              </div>
            );

            return action.comingSoon ? (
              <div key={action.name}>
                {content}
              </div>
            ) : (
              <Link 
                key={action.name} 
                to={action.link}
                className="block"
              >
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
} 