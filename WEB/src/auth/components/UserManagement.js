import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  Ban, 
  RotateCcw, 
  Shield, 
  Calendar, 
  Key, 
  Settings,
  CheckCircle,
  Search,
  Filter,
  ChevronDown,
  Plus,
  X,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

export function UserManagement() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user'
  });

  // Получение списка пользователей
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery(
    'users',
    () => authAPI.getUsers(),
    {
      select: (response) => {
        console.log('📥 Получены пользователи:', response.data.users);
        response.data.users.forEach((user, index) => {
          console.log(`👤 Пользователь ${index + 1}:`, {
            id: user.id,
            username: user.username,
            role: user.role,
            effectiveRole: user.effectiveRole,
            status: user.status,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
          });
        });
        return response.data.users;
      },
      enabled: user?.effectiveRole === 'admin'
    }
  );

  // Получение информации о ролях
  const { data: rolesData, isLoading: rolesLoading } = useQuery(
    'roles',
    () => authAPI.getRoles(),
    {
      select: (response) => response.data.roles,
    }
  );

  // Мутация для изменения роли пользователя
  const updateRoleMutation = useMutation(
    ({ userId, role }) => authAPI.updateUserRole(userId, role),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('Роль пользователя изменена');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка изменения роли');
      }
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

  // Мутация для удаления пользователя
  const deleteUserMutation = useMutation(
    (userId) => authAPI.deleteUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('Пользователь удален');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка удаления пользователя');
      }
    }
  );

  // Мутация для создания пользователя
  const createUserMutation = useMutation(
    (userData) => authAPI.register(userData),
    {
      onSuccess: (response) => {
        console.log('✅ Пользователь создан:', response.data);
        queryClient.invalidateQueries('users');
        toast.success('Пользователь создан успешно');
        setShowCreateForm(false);
        setNewUser({ username: '', password: '', role: 'user' });
      },
      onError: (error) => {
        console.error('❌ Ошибка создания пользователя:', error.response?.data);
        const errorMessage = error.response?.data?.error || 'Ошибка создания пользователя';
        toast.error(errorMessage);
      }
    }
  );

  const roleIcons = {
    guest: Users,
    user: Key,
    editor: Settings,
    admin: Shield,
  };

  const rolePermissions = {
    guest: ['Просмотр публичных разделов', 'Доступ к базовой информации', 'Регистрация аккаунта'],
    user: ['Все права гостя', 'Доступ к пользовательским сервисам', 'Просмотр собственного профиля'],
    editor: ['Все права пользователя', 'Управление контентом', 'Редактирование документов', 'Загрузка файлов'],
    admin: ['Все права редактора', 'Управление пользователями', 'Настройка системы', 'Полный административный доступ']
  };

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

  const handleRoleChange = (userId, newRole) => {
    const targetUser = usersData?.find(u => u.id === userId);
    
    // Нельзя понижать свою роль администратора
    if (userId === user.id && newRole !== 'admin') {
      toast.error('Нельзя понизить свою роль администратора');
      return;
    }
    
    // Нельзя понижать права системного администратора
    if (targetUser?.username === 'admin' && newRole !== 'admin') {
      toast.error('Нельзя понижать права системной учетной записи администратора');
      return;
    }
    
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleBanUser = (userId) => {
    const targetUser = usersData?.find(u => u.id === userId);
    
    if (userId === user.id) {
      toast.error('Нельзя заблокировать себя');
      return;
    }
    
    if (targetUser?.username === 'admin') {
      toast.error('Нельзя заблокировать системную учетную запись администратора');
      return;
    }
    
    banUserMutation.mutate(userId);
  };

  const handleUnbanUser = (userId) => {
    unbanUserMutation.mutate(userId);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      toast.error('Заполните все обязательные поля');
      return;
    }
    console.log('📤 Отправка данных для создания пользователя:', newUser);
    createUserMutation.mutate(newUser);
  };

  const handleInputChange = (field, value) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  // Фильтрация пользователей
  const filteredUsers = usersData?.filter(userData => {
    const matchesSearch = userData.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || userData.effectiveRole === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  if (usersLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">
          Ошибка загрузки пользователей: {usersError.message}
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
            Управление пользователями, их ролями и правами доступа
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Всего: {filteredUsers.length} / {usersData?.length || 0}
            </span>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Создать пользователя</span>
          </button>
        </div>
      </div>

      {/* Модальное окно создания пользователя */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Создать нового пользователя
              </h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Имя пользователя *
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="input-field"
                  placeholder="Введите имя пользователя"
                  required
                />
              </div>
              

              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Пароль *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="input-field"
                  placeholder="Минимум 6 символов"
                  minLength={6}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Роль
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="input-field"
                >
                  <option value="user">Пользователь</option>
                  {hasRole('admin') && (
                    <>
                      <option value="editor">Редактор</option>
                      <option value="admin">Администратор</option>
                    </>
                  )}
                </select>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isLoading}
                  className="btn-primary"
                >
                  {createUserMutation.isLoading ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Основная область - список пользователей */}
        <div className="lg:col-span-3 space-y-6">
          {/* Фильтры и поиск */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Поиск */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Поиск по имени пользователя..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Фильтр по роли */}
              <div className="sm:w-48">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    className="w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">Все роли</option>
                    <option value="admin">Администраторы</option>
                    <option value="editor">Редакторы</option>
                    <option value="user">Пользователи</option>
                    <option value="guest">Гости</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Список пользователей */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Пользователи
              </h3>
            </div>

            {filteredUsers.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((userData) => {
                  const IconComponent = roleIcons[userData.effectiveRole] || Shield;
                  
                  return (
                    <div key={userData.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Аватар */}
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {userData.username.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          {/* Информация о пользователе */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                                {userData.username}
                              </h4>
                              
                              {userData.username === 'admin' && (
                                <span className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs px-2 py-1 rounded-full whitespace-nowrap flex items-center space-x-1">
                                  <Shield className="w-3 h-3" />
                                  <span>Системный</span>
                                </span>
                              )}
                              
                              {userData.id === user.id && (
                                <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                                  Это вы
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                              <div className="flex items-center space-x-1 whitespace-nowrap">
                                <Calendar className="w-4 h-4" />
                                <span>Создан: {formatDate(userData.createdAt)}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              {/* Статус */}
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

                        {/* Управление ролью и действия */}
                        <div className="flex items-center space-x-4 ml-4">
                          {/* Выбор роли */}
                          <div className="flex flex-col items-end space-y-2">
                            <div className="relative">
                              <select
                                className={`pl-8 pr-8 py-1.5 rounded-lg text-sm font-medium border-0 focus:ring-2 focus:ring-blue-500 ${getRoleColor(userData.effectiveRole)} ${(userData.username === 'admin' || updateRoleMutation.isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={userData.effectiveRole}
                                onChange={(e) => handleRoleChange(userData.id, e.target.value)}
                                disabled={userData.username === 'admin' || updateRoleMutation.isLoading}
                                title={userData.username === 'admin' ? 'Системная учетная запись администратора защищена от изменений' : ''}
                              >
                                <option value="guest">Гость</option>
                                <option value="user">Пользователь</option>
                                <option value="editor">Редактор</option>
                                <option value="admin">Администратор</option>
                              </select>
                              <IconComponent className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4" />
                            </div>
                            {userData.username === 'admin' && (
                              <div className="flex items-center space-x-1">
                                <Shield className="w-3 h-3 text-amber-500" />
                                <span className="text-xs text-amber-600 dark:text-amber-400">
                                  Защищено
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Действия */}
                          <div className="flex items-center space-x-2">
                            {userData.status === 'active' ? (
                              <button
                                onClick={() => handleBanUser(userData.id)}
                                disabled={userData.id === user.id || userData.username === 'admin' || banUserMutation.isLoading}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={userData.username === 'admin' ? 'Системная учетная запись защищена' : userData.id === user.id ? 'Нельзя заблокировать себя' : 'Заблокировать пользователя'}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnbanUser(userData.id)}
                                disabled={unbanUserMutation.isLoading}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Разблокировать пользователя"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                            
                            {/* Кнопка удаления */}
                            <button
                              onClick={() => handleDeleteUser(userData.id)}
                              disabled={userData.id === user.id || userData.username === 'admin' || deleteUserMutation.isLoading}
                              className="p-2 text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={userData.username === 'admin' ? 'Системная учетная запись защищена' : userData.id === user.id ? 'Нельзя удалить себя' : 'Удалить пользователя'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || roleFilter !== 'all' ? 'Пользователи не найдены' : 'Нет пользователей'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Боковая панель - информация о ролях */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Роли и права
            </h3>
            
            <div className="space-y-4">
              {rolesData && Object.entries(rolesData).map(([roleName, roleInfo]) => {
                // Скрываем роль "Гость" из боковой панели
                if (roleName === 'guest') {
                  return null;
                }
                
                const IconComponent = roleIcons[roleName] || Shield;
                const permissions = rolePermissions[roleName] || [];
                
                return (
                  <div key={roleName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRoleColor(roleName)}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {roleInfo.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Уровень {roleInfo.level}
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-1">
                      {permissions.slice(0, 3).map((permission, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {permission}
                          </span>
                        </li>
                      ))}
                      {permissions.length > 3 && (
                        <li className="text-xs text-gray-500 dark:text-gray-500 ml-5">
                          +{permissions.length - 3} ещё...
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                💡 Каждая роль наследует права предыдущих ролей
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 