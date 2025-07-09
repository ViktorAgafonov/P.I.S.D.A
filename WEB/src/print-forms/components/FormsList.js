import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  Edit, 
  Eye, 
  Download, 
  Printer, 
  Trash2,
  Calendar,
  User,
  Search,
  Filter
} from 'lucide-react';
import { printFormsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export function FormsList() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Получение списка печатных форм
  const { data: formsData, isLoading, error } = useQuery(
    'print-forms',
    () => printFormsAPI.getForms(),
    {
      select: (response) => response.data.forms
    }
  );

  // Мутация для удаления формы
  const deleteFormMutation = useMutation(
    (formId) => printFormsAPI.deleteForm(formId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('print-forms');
        toast.success('Печатная форма удалена');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка удаления формы');
      }
    }
  );

  const handleDeleteForm = (formId, formName) => {
    if (window.confirm(`Вы уверены, что хотите удалить форму "${formName}"?`)) {
      deleteFormMutation.mutate(formId);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Неизвестно';
    return new Date(dateString).toLocaleString('ru-RU');
  };

  // Фильтрация форм
  const filteredForms = formsData?.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         form.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || form.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

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
          Ошибка загрузки печатных форм: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Печатные формы
          </h2>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Управление шаблонами для экспорта и печати документов
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              Всего: {filteredForms.length} / {formsData?.length || 0}
            </span>
          </div>
          
          <Link
            to="/print-forms/create"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Создать форму</span>
          </Link>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск по названию или описанию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Фильтр по статусу */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"
            >
              <option value="all">Все формы</option>
              <option value="active">Активные</option>
              <option value="draft">Черновики</option>
              <option value="archived">Архивные</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список форм */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {filteredForms.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredForms.map((form) => (
              <div key={form.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Иконка */}
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>

                    {/* Информация о форме */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                          {form.name}
                        </h3>
                        <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                          Активна
                        </span>
                      </div>

                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {form.description || 'Описание отсутствует'}
                      </p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Создана: {formatDate(form.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{form.createdBy}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/print-forms/preview/${form.id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Предварительный просмотр"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    
                    <Link
                      to={`/print-forms/edit/${form.id}`}
                      className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    
                    <button
                      onClick={() => {/* Экспорт */}}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                      title="Экспорт документа"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {/* Печать */}}
                      className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      title="Печать"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteForm(form.id, form.name)}
                      disabled={deleteFormMutation.isLoading}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' ? 'Печатные формы не найдены' : 'Нет печатных форм'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                to="/print-forms/create"
                className="mt-4 btn-primary inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Создать первую форму</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 