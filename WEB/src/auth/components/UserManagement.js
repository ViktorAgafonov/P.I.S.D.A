import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { Search, Plus, User, Edit, Trash2, Calendar, MapPin, Building, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
    const { user, hasRole } = useAuth();
    const queryClient = useQueryClient();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [isCreating, setIsCreating] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    
    // Состояние для нового пользователя
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        role: 'user',
        profile: {
            lastName: '',
            firstName: '',
            middleName: '',
            birthYear: '',
            employmentDate: '',
            department: '',
            section: '',
            position: '',
            employeeStatus: 'active'
        }
    });

    // Получение списка пользователей
    const { data: usersData, isLoading } = useQuery(
        'users',
        () => authAPI.getUsers(),
        {
            enabled: hasRole('admin'),
            onError: (error) => {
                toast.error(error.response?.data?.error || 'Ошибка загрузки пользователей');
            }
        }
    );

    // Создание пользователя
    const createUserMutation = useMutation(
        (userData) => authAPI.register(userData),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('users');
                setIsCreating(false);
                resetNewUser();
                toast.success('Пользователь успешно создан');
            },
            onError: (error) => {
                toast.error(error.response?.data?.error || 'Ошибка создания пользователя');
            }
        }
    );

    // Обновление пользователя
    const updateUserMutation = useMutation(
        ({ userId, userData }) => authAPI.updateUser(userId, userData),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('users');
                setEditingUser(null);
                toast.success('Пользователь успешно обновлен');
            },
            onError: (error) => {
                toast.error(error.response?.data?.error || 'Ошибка обновления пользователя');
            }
        }
    );

    // Удаление пользователя
    const deleteUserMutation = useMutation(
        (userId) => authAPI.deleteUser(userId),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('users');
                toast.success('Пользователь успешно удален');
            },
            onError: (error) => {
                toast.error(error.response?.data?.error || 'Ошибка удаления пользователя');
            }
        }
    );

    const resetNewUser = () => {
        setNewUser({
            username: '',
            password: '',
            role: 'user',
            profile: {
                lastName: '',
                firstName: '',
                middleName: '',
                birthYear: '',
                employmentDate: '',
                department: '',
                section: '',
                position: '',
                employeeStatus: 'active'
            }
        });
    };

    const handleCreateUser = (e) => {
        e.preventDefault();
        
        // Валидация
        if (!newUser.username || !newUser.password) {
            toast.error('Имя пользователя и пароль обязательны');
            return;
        }

        if (newUser.password.length < 6) {
            toast.error('Пароль должен содержать минимум 6 символов');
            return;
        }

        // Подготовка данных
        const userData = {
            ...newUser,
            profile: {
                ...newUser.profile,
                birthYear: newUser.profile.birthYear ? parseInt(newUser.profile.birthYear) : null,
                employmentDate: newUser.profile.employmentDate || new Date().toISOString().split('T')[0]
            }
        };

        createUserMutation.mutate(userData);
    };

    const handleUpdateUser = (userId, updatedData) => {
        updateUserMutation.mutate({ userId, userData: updatedData });
    };

    const handleDeleteUser = (userId, username) => {
        if (userId === user.id) {
            toast.error('Нельзя удалить самого себя');
            return;
        }

        if (username === 'admin') {
            toast.error('Нельзя удалить системного администратора');
            return;
        }

        if (window.confirm(`Вы уверены, что хотите удалить пользователя "${username}"?`)) {
            deleteUserMutation.mutate(userId);
        }
    };

    const handleRoleChange = (userId, newRole) => {
        handleUpdateUser(userId, { role: newRole });
    };

    const handleStatusChange = (userId, newStatus) => {
        handleUpdateUser(userId, { 
            profile: { employeeStatus: newStatus }
        });
    };

    // Фильтрация пользователей
    const filteredUsers = usersData?.users?.filter(u => {
        const fullName = `${u.profile?.lastName || ''} ${u.profile?.firstName || ''} ${u.profile?.middleName || ''}`.toLowerCase();
        const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            fullName.includes(searchTerm.toLowerCase()) ||
                            (u.profile?.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (u.profile?.position || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || u.profile?.employeeStatus === statusFilter;
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        
        return matchesSearch && matchesStatus && matchesRole;
    }) || [];

    const getStatusBadge = (status) => {
        const badges = {
            active: { class: 'bg-green-100 text-green-800', text: 'Активен' },
            dismissed: { class: 'bg-red-100 text-red-800', text: 'Уволен' },
            vacation: { class: 'bg-blue-100 text-blue-800', text: 'В отпуске' },
            sick_leave: { class: 'bg-yellow-100 text-yellow-800', text: 'На больничном' }
        };
        
        const badge = badges[status] || badges.active;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                {badge.text}
            </span>
        );
    };

    const getRoleBadge = (role) => {
        const badges = {
            admin: { class: 'bg-purple-100 text-purple-800', text: 'Администратор' },
            editor: { class: 'bg-orange-100 text-orange-800', text: 'Редактор' },
            user: { class: 'bg-gray-100 text-gray-800', text: 'Пользователь' }
        };
        
        const badge = badges[role] || badges.user;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                {badge.text}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    if (!hasRole('admin')) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Недостаточно прав для просмотра этой страницы</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Заголовок и статистика */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Управление пользователями</h2>
                    <p className="text-gray-600">Всего пользователей: {filteredUsers.length}</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Создать пользователя
                </button>
            </div>

            {/* Фильтры */}
            <div className="bg-white p-4 rounded-lg border space-y-4">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-64">
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Поиск по имени, ФИО, отделу, должности..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">Все статусы</option>
                        <option value="active">Активные</option>
                        <option value="dismissed">Уволенные</option>
                        <option value="vacation">В отпуске</option>
                        <option value="sick_leave">На больничном</option>
                    </select>
                    
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">Все роли</option>
                        <option value="admin">Администратор</option>
                        <option value="editor">Редактор</option>
                        <option value="user">Пользователь</option>
                    </select>
                </div>
            </div>

            {/* Форма создания пользователя */}
            {isCreating && (
                <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Создание нового пользователя</h3>
                    
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Учетные данные */}
                            <div className="col-span-2">
                                <h4 className="text-md font-medium text-gray-700 mb-2">Учетные данные</h4>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Имя пользователя *
                                </label>
                                <input
                                    type="text"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Пароль *
                                </label>
                                <input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    minLength={6}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Роль
                                </label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Статус сотрудника
                                </label>
                                <select
                                    value={newUser.profile.employeeStatus}
                                    onChange={(e) => setNewUser({
                                        ...newUser, 
                                        profile: {...newUser.profile, employeeStatus: e.target.value}
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="active">Активен</option>
                                    <option value="vacation">В отпуске</option>
                                    <option value="sick_leave">На больничном</option>
                                    <option value="dismissed">Уволен</option>
                                </select>
                            </div>

                            {/* Личные данные */}
                            <div className="col-span-2 mt-4">
                                <h4 className="text-md font-medium text-gray-700 mb-2">Личные данные</h4>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Фамилия
                                </label>
                                <input
                                    type="text"
                                    value={newUser.profile.lastName}
                                    onChange={(e) => setNewUser({
                                        ...newUser, 
                                        profile: {...newUser.profile, lastName: e.target.value}
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Имя
                                </label>
                                <input
                                    type="text"
                                    value={newUser.profile.firstName}
                                    onChange={(e) => setNewUser({
                                        ...newUser, 
                                        profile: {...newUser.profile, firstName: e.target.value}
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Отчество
                                </label>
                                <input
                                    type="text"
                                    value={newUser.profile.middleName}
                                    onChange={(e) => setNewUser({
                                        ...newUser, 
                                        profile: {...newUser.profile, middleName: e.target.value}
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Год рождения
                                </label>
                                <input
                                    type="number"
                                    min="1900"
                                    max="2010"
                                    value={newUser.profile.birthYear}
                                    onChange={(e) => setNewUser({
                                        ...newUser, 
                                        profile: {...newUser.profile, birthYear: e.target.value}
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Дата трудоустройства
                                </label>
                                <input
                                    type="date"
                                    value={newUser.profile.employmentDate}
                                    onChange={(e) => setNewUser({
                                        ...newUser, 
                                        profile: {...newUser.profile, employmentDate: e.target.value}
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Отдел
                                </label>
                                <input
                                    type="text"
                                    value={newUser.profile.department}
                                    onChange={(e) => setNewUser({
                                        ...newUser, 
                                        profile: {...newUser.profile, department: e.target.value}
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Участок
                                </label>
                                <input
                                    type="text"
                                    value={newUser.profile.section}
                                    onChange={(e) => setNewUser({
                                        ...newUser, 
                                        profile: {...newUser.profile, section: e.target.value}
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Должность
                                </label>
                                <input
                                    type="text"
                                    value={newUser.profile.position}
                                    onChange={(e) => setNewUser({
                                        ...newUser, 
                                        profile: {...newUser.profile, position: e.target.value}
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-2 pt-4">
                            <button
                                type="submit"
                                disabled={createUserMutation.isLoading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                {createUserMutation.isLoading ? 'Создание...' : 'Создать'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreating(false);
                                    resetNewUser();
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Список пользователей */}
            <div className="bg-white rounded-lg border overflow-hidden">
                {isLoading ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">Загрузка пользователей...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Пользователи не найдены</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Пользователь</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">ФИО</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Отдел / Участок</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Должность</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Роль</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Статус</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center">
                                                <User className="h-8 w-8 text-gray-400 mr-3" />
                                                <div>
                                                    <div className="font-medium text-gray-900">{u.username}</div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {u.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="py-3 px-4">
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {u.profile?.lastName} {u.profile?.firstName} {u.profile?.middleName}
                                                </div>
                                                {u.profile?.birthYear && (
                                                    <div className="text-sm text-gray-500">
                                                        {u.profile.birthYear} г.р.
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        
                                        <td className="py-3 px-4">
                                            <div>
                                                {u.profile?.department && (
                                                    <div className="flex items-center text-sm text-gray-700">
                                                        <Building className="h-4 w-4 mr-1" />
                                                        {u.profile.department}
                                                    </div>
                                                )}
                                                {u.profile?.section && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <MapPin className="h-4 w-4 mr-1" />
                                                        {u.profile.section}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        
                                        <td className="py-3 px-4">
                                            <div className="text-sm text-gray-700">
                                                {u.profile?.position || 'Не указано'}
                                            </div>
                                            {u.profile?.employmentDate && (
                                                <div className="flex items-center text-xs text-gray-500">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    с {formatDate(u.profile.employmentDate)}
                                                </div>
                                            )}
                                        </td>
                                        
                                        <td className="py-3 px-4">
                                            <select
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                disabled={u.username === 'admin' || u.id === user.id}
                                                className="text-sm px-2 py-1 rounded border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="user">Пользователь</option>
                                                <option value="editor">Редактор</option>
                                                <option value="admin">Администратор</option>
                                            </select>
                                        </td>
                                        
                                        <td className="py-3 px-4">
                                            <select
                                                value={u.profile?.employeeStatus || 'active'}
                                                onChange={(e) => handleStatusChange(u.id, e.target.value)}
                                                disabled={u.username === 'admin'}
                                                className="text-sm px-2 py-1 rounded border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <option value="active">Активен</option>
                                                <option value="vacation">В отпуске</option>
                                                <option value="sick_leave">На больничном</option>
                                                <option value="dismissed">Уволен</option>
                                            </select>
                                        </td>
                                        
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingUser(u)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Редактировать"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                
                                                <button
                                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                                    disabled={u.id === user.id || u.username === 'admin'}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Удалить"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement; 