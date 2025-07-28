import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toolsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Settings, 
  FileText, 
  Users, 
  Wrench, 
  CheckCircle, 
  XCircle,
  Save,
  RotateCcw,
  Shield,
  Key,
  User,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export function ToolsManager() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [localConfig, setLocalConfig] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Получение данных управления инструментами
  const { data: managementData, isLoading, error } = useQuery(
    'tools-management',
    () => toolsAPI.getToolsManagement(),
    {
      select: (response) => response.data,
      enabled: hasRole('admin'),
      onSuccess: (data) => {
        setLocalConfig(data);
      }
    }
  );

  // Мутация для сохранения настроек
  const saveConfigMutation = useMutation(
    (config) => toolsAPI.updateToolsManagement(config),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tools-management');
        queryClient.invalidateQueries('tools');
        setHasChanges(false);
        toast.success('Настройки инструментов сохранены');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка сохранения настроек');
      }
    }
  );

  const toolIcons = {
    auth: Settings,
    documents: FileText,
    users: Users,
    default: Wrench,
  };

  const roleLabels = {
    guest: 'Гость',
    user: 'Пользователь', 
    editor: 'Редактор',
    admin: 'Администратор'
  };

  const roleIcons = {
    guest: User,
    user: UserCheck,
    editor: Key,
    admin: Shield
  };

  const handleToolToggle = (toolName, isActive) => {
    if (!localConfig) return;

    // Защита от отключения инструмента авторизации
    if (toolName === 'auth' && !isActive) {
      toast.error('Инструмент авторизации нельзя отключить');
      return;
    }

    const updatedConfig = {
      ...localConfig,
      tools: localConfig.tools.map(tool => 
        tool.name === toolName ? { ...tool, active: isActive } : tool
      )
    };

    setLocalConfig(updatedConfig);
    setHasChanges(true);
  };

  const handlePermissionToggle = (toolName, role, hasPermission) => {
    if (!localConfig) return;

    const updatedConfig = {
      ...localConfig,
      tools: localConfig.tools.map(tool => {
        if (tool.name === toolName) {
          let newPermissions = [...tool.permissions];
          
          if (hasPermission) {
            // Добавляем роль если её нет
            if (!newPermissions.includes(role)) {
              newPermissions.push(role);
            }
          } else {
            // Убираем роль
            newPermissions = newPermissions.filter(p => p !== role);
          }
          
          return { ...tool, permissions: newPermissions };
        }
        return tool;
      })
    };

    setLocalConfig(updatedConfig);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!localConfig || !hasChanges) return;

    // Преобразуем данные для отправки на сервер
    const toolsConfig = {};
    localConfig.tools.forEach(tool => {
      toolsConfig[tool.name] = {
        active: tool.active,
        permissions: tool.permissions,
        title: tool.title,
        description: tool.description,
        order: tool.order
      };
    });

    saveConfigMutation.mutate({
      tools: toolsConfig,
      defaultPermissions: localConfig.defaultPermissions
    });
  };

  const handleReset = () => {
    setLocalConfig(managementData);
    setHasChanges(false);
    toast.success('Изменения отменены');
  };

  if (!hasRole('admin')) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Управление инструментами
        </h3>
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Управление инструментами доступно только администраторам
          </p>
        </div>
      </div>
    );
  }

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
          Ошибка загрузки управления инструментами: {error.message}
        </p>
      </div>
    );
  }

  const tools = localConfig?.tools || [];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Управление инструментами
          </h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Настройка активности инструментов и прав доступа для разных ролей
          </p>
        </div>

        {hasChanges && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              disabled={saveConfigMutation.isLoading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Отменить
            </button>
            
            <button
              onClick={handleSave}
              disabled={saveConfigMutation.isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveConfigMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        )}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-blue-600 dark:text-blue-400 text-2xl font-bold">
            {tools.length}
          </div>
          <div className="text-blue-600 dark:text-blue-400 text-sm">
            Всего инструментов
          </div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-green-600 dark:text-green-400 text-2xl font-bold">
            {tools.filter(t => t.active).length}
          </div>
          <div className="text-green-600 dark:text-green-400 text-sm">
            Активных
          </div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="text-red-600 dark:text-red-400 text-2xl font-bold">
            {tools.filter(t => !t.active).length}
          </div>
          <div className="text-red-600 dark:text-red-400 text-sm">
            Отключенных
          </div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="text-purple-600 dark:text-purple-400 text-2xl font-bold">
            3
          </div>
          <div className="text-purple-600 dark:text-purple-400 text-sm">
            Ролей системы
          </div>
        </div>
      </div>

      {/* Таблица инструментов */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Настройка инструментов
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Инструмент
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Активность
                </th>
                {Object.keys(roleLabels).map(role => {
                  // Скрываем заголовок "Гость" для инструмента авторизации
                  if (role === 'guest') {
                    return null;
                  }
                  
                  return (
                  <th key={role} scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center justify-center space-x-1">
                      {React.createElement(roleIcons[role], { className: "w-4 h-4" })}
                      <span>{roleLabels[role]}</span>
                    </div>
                  </th>
                  );
                })}
              </tr>
            </thead>
            
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tools.map((tool) => {
                const IconComponent = toolIcons[tool.name] || toolIcons.default;
                
                return (
                  <tr key={tool.name} className={`${!tool.active ? 'opacity-60' : ''} ${tool.name === 'auth' ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                          <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                            {tool.title}
                            {tool.name === 'auth' && (
                              <Shield className="w-4 h-4 ml-2 text-blue-600 dark:text-blue-400" title="Защищенный инструмент" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {tool.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleToolToggle(tool.name, !tool.active)}
                        disabled={tool.name === 'auth'}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          tool.active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        } ${tool.name === 'auth' ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                        title={tool.name === 'auth' ? 'Инструмент авторизации нельзя отключить' : ''}
                      >
                        {tool.active ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Активен
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Отключен
                          </>
                        )}
                        {tool.name === 'auth' && (
                          <Shield className="w-3 h-3 ml-1" />
                        )}
                      </button>
                    </td>
                    
                    {Object.keys(roleLabels).map(role => {
                      // Скрываем колонку "Гость" для всех инструментов
                      if (role === 'guest') {
                        return null;
                      }
                      
                      const hasPermission = tool.permissions.includes(role);
                      const isAdminAuth = tool.name === 'auth' && role === 'admin';
                      
                      return (
                        <td key={role} className="px-3 py-4 whitespace-nowrap text-center">
                          <input
                            type="checkbox"
                            checked={hasPermission}
                            onChange={(e) => handlePermissionToggle(tool.name, role, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={isAdminAuth}
                            title={isAdminAuth ? 'Нельзя отключить доступ администратора к модулю авторизации' : ''}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Информация */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Как работает управление инструментами
        </h3>
        <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p>
            <strong>Активность:</strong> Неактивные инструменты не отображаются в дашборде для пользователей, но доступны администраторам.
          </p>
          <p>
            <strong>Права доступа:</strong> Отметьте роли пользователей, которые должны видеть инструмент в дашборде.
          </p>
          <p>
            <strong>Иерархия ролей:</strong> Роли более высокого уровня автоматически получают доступ к инструментам нижних уровней.
          </p>
        </div>
      </div>
    </div>
  );
}
