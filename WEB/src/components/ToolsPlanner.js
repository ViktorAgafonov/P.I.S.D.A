import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  FileText, 
  Database, 
  Image, 
  BarChart3, 
  Calendar, 
  Mail, 
  Settings,
  Users,
  Wrench,
  Clock,
  ChevronRight
} from 'lucide-react';

export function ToolsPlanner() {
  const { hasRole } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('documents');

  // Планируемые инструменты по категориям
  const plannedTools = {
    documents: {
      name: 'Документооборот',
      icon: FileText,
      color: 'blue',
      tools: [
        {
          name: 'Управление документами',
          description: 'Загрузка, хранение и организация документов',
          priority: 'high',
          features: ['Загрузка файлов', 'Папки и теги', 'Поиск', 'Превью'],
          requiredRole: 'editor'
        },
        {
          name: 'Редактор печатных форм',
          description: 'Создание и настройка печатных форм doc/xlsx',
          priority: 'high',
          features: ['Шаблоны', 'Автозаполнение', 'Печать из браузера'],
          requiredRole: 'editor'
        }
      ]
    },
    data: {
      name: 'Работа с данными',
      icon: Database,
      color: 'green',
      tools: [
        {
          name: 'Менеджер таблиц',
          description: 'Создание и управление таблицами данных',
          priority: 'medium',
          features: ['Создание таблиц', 'Импорт/экспорт', 'Сортировка'],
          requiredRole: 'editor'
        }
      ]
    }
  };

  if (!hasRole('admin')) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Планирование инструментов
        </h3>
        <div className="text-center py-8">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Планирование инструментов доступно только администраторам
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Планирование инструментов
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Roadmap развития функциональности системы будет добавлен позднее.
      </p>
    </div>
  );
} 