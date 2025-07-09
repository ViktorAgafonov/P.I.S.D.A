import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Eye, 
  FileText,
  Settings,
  RefreshCw
} from 'lucide-react';
import { printFormsAPI } from '../../services/api';
import toast from 'react-hot-toast';

export function FormPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState({});
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Получение формы
  const { data: formData, isLoading, error } = useQuery(
    ['print-form', id],
    () => printFormsAPI.getForm(id),
    {
      select: (response) => response.data.form
    }
  );

  // Мутация для экспорта
  const exportMutation = useMutation(
    (data) => printFormsAPI.exportDocument(id, data),
    {
      onSuccess: (response) => {
        toast.success('Документ экспортирован');
        // Здесь можно добавить логику скачивания файла
        console.log('Export result:', response);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка экспорта');
      }
    }
  );

  // Мутация для печати
  const printMutation = useMutation(
    (data) => printFormsAPI.printDocument(id, data),
    {
      onSuccess: (response) => {
        toast.success('Документ отправлен на печать');
        console.log('Print result:', response);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка печати');
      }
    }
  );

  const handleInputChange = (fieldName, value) => {
    setPreviewData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const generatePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      // Здесь будет вызов API для генерации предварительного просмотра
      await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация задержки
      toast.success('Предварительный просмотр обновлен');
    } catch (error) {
      toast.error('Ошибка генерации предварительного просмотра');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleExport = () => {
    exportMutation.mutate(previewData);
  };

  const handlePrint = () => {
    printMutation.mutate(previewData);
  };

  const renderField = (field) => {
    const value = previewData[field.name] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Введите ${field.label?.toLowerCase() || field.name}`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            rows={3}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Введите ${field.label?.toLowerCase() || field.name}`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Введите ${field.label?.toLowerCase() || field.name}`}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        );
    }
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
          Ошибка загрузки формы: {error.message}
        </p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Форма не найдена</p>
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
              Предварительный просмотр
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {formData.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={generatePreview}
            disabled={isGeneratingPreview}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isGeneratingPreview ? 'animate-spin' : ''}`} />
            <span>Обновить</span>
          </button>
          
          <button
            onClick={handleExport}
            disabled={exportMutation.isLoading}
            className="btn-primary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{exportMutation.isLoading ? 'Экспорт...' : 'Экспорт'}</span>
          </button>
          
          <button
            onClick={handlePrint}
            disabled={printMutation.isLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>{printMutation.isLoading ? 'Печать...' : 'Печать'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Форма данных */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Данные формы
            </h2>
          </div>

          {formData.fields && formData.fields.length > 0 ? (
            <div className="space-y-4">
              {formData.fields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {field.label || field.name}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                В форме нет полей для заполнения
              </p>
            </div>
          )}
        </div>

        {/* Предварительный просмотр */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Предварительный просмотр
            </h2>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 min-h-[400px]">
            {formData.template ? (
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: formData.template.replace(/\{(\w+)\}/g, (match, fieldName) => {
                    return previewData[fieldName] || match;
                  })
                }}
              />
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  HTML шаблон не настроен
                </p>
                <button
                  onClick={() => navigate(`/print-forms/edit/${id}`)}
                  className="mt-4 btn-secondary"
                >
                  Настроить шаблон
                </button>
              </div>
            )}
          </div>

          {/* Информация о настройках */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Настройки печати
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-200">
              <div>Размер: {formData.settings?.pageSize || 'A4'}</div>
              <div>Ориентация: {formData.settings?.orientation === 'portrait' ? 'Книжная' : 'Альбомная'}</div>
              <div>Отступы: {formData.settings?.margins?.top || 20}мм</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 