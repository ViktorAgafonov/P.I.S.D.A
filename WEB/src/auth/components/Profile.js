import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMutation, useQueryClient } from 'react-query';
import { authAPI } from '../../services/api';
import { 
    User, 
    Calendar, 
    MapPin, 
    Building, 
    Briefcase, 
    Edit, 
    Save, 
    X,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState({});

    // Мутация для обновления профиля
    const updateProfileMutation = useMutation(
        (profileData) => authAPI.updateProfile(profileData),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('authUser');
                setIsEditing(false);
                toast.success('Профиль успешно обновлен');
            },
            onError: (error) => {
                toast.error(error.response?.data?.error || 'Ошибка обновления профиля');
            }
        }
    );

    const handleEditStart = () => {
        setEditedProfile(user.profile || {});
        setIsEditing(true);
    };

    const handleEditCancel = () => {
        setEditedProfile({});
        setIsEditing(false);
    };

    const handleEditSave = () => {
        updateProfileMutation.mutate({ profile: editedProfile });
    };

    const handleInputChange = (field, value) => {
        setEditedProfile(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: { 
                class: 'bg-green-100 text-green-800 border-green-200', 
                text: 'Активен',
                icon: CheckCircle
            },
            dismissed: { 
                class: 'bg-red-100 text-red-800 border-red-200', 
                text: 'Уволен',
                icon: AlertCircle
            },
            vacation: { 
                class: 'bg-blue-100 text-blue-800 border-blue-200', 
                text: 'В отпуске',
                icon: Calendar
            },
            sick_leave: { 
                class: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
                text: 'На больничном',
                icon: AlertCircle
            }
        };
        
        const badge = badges[status] || badges.active;
        const IconComponent = badge.icon;
        
        return (
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${badge.class}`}>
                <IconComponent className="h-4 w-4 mr-2" />
                {badge.text}
            </div>
        );
    };

    const getRoleBadge = (role) => {
        const badges = {
            admin: { class: 'bg-purple-100 text-purple-800 border-purple-200', text: 'Администратор' },
            editor: { class: 'bg-orange-100 text-orange-800 border-orange-200', text: 'Редактор' },
            user: { class: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Пользователь' }
        };
        
        const badge = badges[role] || badges.user;
        return (
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${badge.class}`}>
                {badge.text}
            </div>
        );
    };

    if (!user) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Загрузка профиля...</p>
            </div>
        );
    }

    const profile = user.profile || {};
    const fullName = `${profile.lastName || ''} ${profile.firstName || ''} ${profile.middleName || ''}`.trim();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Заголовок */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Мой профиль</h2>
                {!isEditing ? (
                    <button
                        onClick={handleEditStart}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Редактировать
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleEditSave}
                            disabled={updateProfileMutation.isLoading}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {updateProfileMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                        <button
                            onClick={handleEditCancel}
                            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Отмена
                        </button>
                    </div>
                )}
            </div>

            {/* Основная информация */}
            <div className="bg-white rounded-lg border p-6">
                <div className="flex items-start space-x-6">
                    {/* Аватар */}
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">
                            {fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase() : user.username[0].toUpperCase()}
                        </span>
                    </div>

                    {/* Основные данные */}
                    <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {fullName || user.username}
                            </h3>
                            {getRoleBadge(user.role)}
                            {getStatusBadge(profile.employeeStatus || 'active')}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center text-gray-600">
                                <User className="h-4 w-4 mr-2" />
                                <span>Логин: {user.username}</span>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>ID: {user.id}</span>
                            </div>

                            {profile.department && (
                                <div className="flex items-center text-gray-600">
                                    <Building className="h-4 w-4 mr-2" />
                                    <span>{profile.department}</span>
                                </div>
                            )}

                            {profile.section && (
                                <div className="flex items-center text-gray-600">
                                    <MapPin className="h-4 w-4 mr-2" />
                                    <span>{profile.section}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Детальная информация */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Личные данные */}
                <div className="bg-white rounded-lg border p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Личные данные</h4>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Фамилия
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedProfile.lastName || ''}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <p className="text-gray-900">{profile.lastName || 'Не указано'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Имя
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedProfile.firstName || ''}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <p className="text-gray-900">{profile.firstName || 'Не указано'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Отчество
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedProfile.middleName || ''}
                                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <p className="text-gray-900">{profile.middleName || 'Не указано'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Год рождения
                            </label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    min="1900"
                                    max="2010"
                                    value={editedProfile.birthYear || ''}
                                    onChange={(e) => handleInputChange('birthYear', e.target.value ? parseInt(e.target.value) : null)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <p className="text-gray-900">{profile.birthYear || 'Не указано'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Рабочая информация */}
                <div className="bg-white rounded-lg border p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Рабочая информация</h4>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Отдел
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedProfile.department || ''}
                                    onChange={(e) => handleInputChange('department', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <p className="text-gray-900">{profile.department || 'Не указано'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Участок
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedProfile.section || ''}
                                    onChange={(e) => handleInputChange('section', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <p className="text-gray-900">{profile.section || 'Не указано'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Должность
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editedProfile.position || ''}
                                    onChange={(e) => handleInputChange('position', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <p className="text-gray-900">{profile.position || 'Не указано'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Дата трудоустройства
                            </label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={editedProfile.employmentDate || ''}
                                    onChange={(e) => handleInputChange('employmentDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            ) : (
                                <p className="text-gray-900">{formatDate(profile.employmentDate)}</p>
                            )}
                        </div>

                        {profile.dismissalDate && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Дата увольнения
                                </label>
                                <p className="text-gray-900">{formatDate(profile.dismissalDate)}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Системная информация */}
            <div className="bg-white rounded-lg border p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Системная информация</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Дата регистрации
                        </label>
                        <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Последний вход
                        </label>
                        <p className="text-gray-900">
                            {user.lastLogin ? formatDate(user.lastLogin) : 'Первый вход'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Статус аккаунта
                        </label>
                        <p className="text-gray-900">{user.status === 'active' ? 'Активен' : 'Заблокирован'}</p>
                    </div>
                </div>
            </div>

            {/* Предупреждения */}
            {user.warning && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                        <p className="text-yellow-800">{user.warning}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile; 