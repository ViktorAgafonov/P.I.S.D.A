import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  Plus, 
  Trash2,
  FileText,
  Settings,
  Code
} from 'lucide-react';
import { printFormsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export function FormEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: '',
    fields: [],
    settings: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 }
    }
  });

  const [activeTab, setActiveTab] = useState('basic');

  // Получение формы для редактирования
  const { data: existingForm, isLoading: isLoadingForm } = useQuery(
    ['print-form', id],
    () => printFormsAPI.getForm(id),
    {
      enabled: isEditing,
      select: (response) => response.data.form,
      onSuccess: (form) => {
        setFormData(form);
      }
    }
  );

  // Мутация для создания/обновления формы
  const saveFormMutation = useMutation(
    (data) => isEditing ? printFormsAPI.updateForm(id, data) : printFormsAPI.createForm(data),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries('print-forms');
        toast.success(isEditing ? 'Форма обновлена' : 'Форма создана');
        navigate('/print-forms');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка сохранения формы');
      }
    }
  );

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const handleMarginsChange = (side, value) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        margins: {
          ...prev.settings.margins,
          [side]: parseInt(value) || 0
        }
      }
    }));
  };

  const addField = () => {
    const newField = {
      id: Date.now().toString(),
      name: '',
      type: 'text',
      label: '',
      required: false,
      placeholder: ''
    };

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const updateField = (fieldId, updates) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Введите название формы');
      return;
    }

    saveFormMutation.mutate(formData);
  };

  const tabs = [
    { id: 'basic', name: 'Основное', icon: FileText },
    { id: 'fields', name: 'Поля', icon: Settings },
    { id: 'template', name: 'Шаблон', icon: Code }
  ];

  if (isLoadingForm) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/print-forms')}
            className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Редактирование формы' : 'Создание новой формы'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {isEditing ? 'Измените параметры печатной формы' : 'Создайте новую печатную форму'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/print-forms/preview/${id}`)}
            disabled={!isEditing}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Eye className="w-4 h-4" />
            <span>Предпросмотр</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={saveFormMutation.isLoading}
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saveFormMutation.isLoading ? 'Сохранение...' : 'Сохранить'}</span>
          </button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon
                className={`-ml-0.5 mr-2 h-5 w-5 ${
                  activeTab === tab.id
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Контент вкладок */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Основная информация
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Название формы *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Введите название формы"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Размер страницы
                </label>
                <select
                  value={formData.settings.pageSize}
                  onChange={(e) => handleSettingsChange('pageSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Описание назначения формы"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ориентация
                </label>
                <select
                  value={formData.settings.orientation}
                  onChange={(e) => handleSettingsChange('orientation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="portrait">Книжная</option>
                  <option value="landscape">Альбомная</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Отступы (мм)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(formData.settings.margins).map(([side, value]) => (
                  <div key={side}>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">
                      {side}
                    </label>
                    <input
                      type="number"
                      value={value}
                      onChange={(e) => handleMarginsChange(side, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fields' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Поля формы
              </h3>
              <button
                onClick={addField}
                className="btn-secondary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить поле</span>
              </button>
            </div>

            {formData.fields.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Нет полей в форме
                </p>
                <button
                  onClick={addField}
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить первое поле</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.fields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Название поля
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="field_name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Тип поля
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="text">Текст</option>
                          <option value="number">Число</option>
                          <option value="date">Дата</option>
                          <option value="textarea">Многострочный текст</option>
                          <option value="select">Выбор</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Подпись
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Подпись поля"
                        />
                      </div>

                      <div className="flex items-end space-x-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Обязательное
                          </label>
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={() => removeField(field.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Удалить поле"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'template' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              HTML шаблон
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Используйте HTML для создания шаблона. Доступные переменные: {'{field_name}'}
            </p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                HTML код
              </label>
              <textarea
                value={formData.template}
                onChange={(e) => handleInputChange('template', e.target.value)}
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                placeholder="<html><body><h1>{title}</h1><p>{description}</p></body></html>"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 