import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Ban, RotateCcw, Edit, Shield, Mail, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export function UsersList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);

  // Получение списка пользователей
  const { data: usersData, isLoading, error } = useQuery(
    'users',
    () => authAPI.getUsers(),
    {
      select: (response) => response.data.users,
      enabled: user?.role === 'admin',
    }
  );

  // Мутация для блокировки пользователя
  const banUserMutation = useMutation(
    (userId) => authAPI.banUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('Пользователь заблокирован');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка блокировки');
      }
    }
  );

  // Мутация для разблокировки пользователя
  const unbanUserMutation = useMutation(
    (userId) => authAPI.unbanUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('Пользователь разблокирован');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка разблокировки');
      }
    }
  );

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

  const handleBanUser = (userId) => {
    if (userId === user.id) {
      toast.error('Нельзя заблокировать себя');
      return;
    }
    banUserMutation.mutate(userId);
  };

  const handleUnbanUser = (userId) => {
    unbanUserMutation.mutate(userId);
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
          Ошибка загрузки пользователей: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Управление пользователями
          </h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Список всех пользователей системы и управление их правами
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            Всего: {usersData?.length || 0}
          </span>
        </div>
      </div>

      {/* Список пользователей */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Пользователи
          </h3>
        </div>

        {usersData && usersData.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {usersData.map((userData) => (
              <div key={userData.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Аватар */}
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {userData.username.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Информация о пользователе */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {userData.username}
                        </h4>
                        
                        {userData.id === user.id && (
                          <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs px-2 py-1 rounded-full">
                            Это вы
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Mail className="w-4 h-4" />
                          <span>{userData.email}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Создан: {formatDate(userData.createdAt)}</span>
                        </div>
                        
                        {userData.lastLogin && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Последний вход: {formatDate(userData.lastLogin)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 mt-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userData.role)}`}>
                          <Shield size={12} className="mr-1" />
                          {userData.role}
                        </span>
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(userData.status)}`}>
                          {userData.status === 'active' ? 'Активен' : 'Заблокирован'}
                        </span>

                        {userData.status === 'banned' && userData.originalRole && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Оригинальная роль: {userData.originalRole}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex items-center space-x-3">
                    {userData.status === 'active' ? (
                      <button
                        onClick={() => handleBanUser(userData.id)}
                        disabled={userData.id === user.id || banUserMutation.isLoading}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed dark:border-red-800 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40"
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Заблокировать
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnbanUser(userData.id)}
                        disabled={unbanUserMutation.isLoading}
                        className="inline-flex items-center px-3 py-1.5 border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed dark:border-green-800 dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/40"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Разблокировать
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Нет пользователей
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Пользователи появятся после регистрации
            </p>
          </div>
        )}
      </div>

      {/* Статистика */}
      {usersData && usersData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {usersData.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Администраторы</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {usersData.filter(u => u.role === 'editor').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Редакторы</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {usersData.filter(u => u.role === 'user').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Пользователи</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {usersData.filter(u => u.status === 'banned').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Заблокированы</div>
          </div>
        </div>
      )}
    </div>
  );
} 