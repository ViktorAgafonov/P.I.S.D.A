import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Plus, 
  Settings, 
  Eye, 
  Download, 
  Printer,
  Grid,
  List
} from 'lucide-react';
import { FormsList } from './components/FormsList';
import { FormEditor } from './components/FormEditor';
import { FormPreview } from './components/FormPreview';

export function PrintFormsTool() {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const navigation = [
    {
      name: 'Формы',
      href: '/print-forms',
      icon: List,
      exact: true,
      requiredRole: 'editor'
    },
    {
      name: 'Создать форму',
      href: '/print-forms/create',
      icon: Plus,
      requiredRole: 'editor'
    },
    {
      name: 'Настройки',
      href: '/print-forms/settings',
      icon: Settings,
      requiredRole: 'admin'
    }
  ];

  const availableNavigation = navigation.filter(item => hasRole(item.requiredRole));

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Печатные формы
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Управление печатными формами и экспорт данных в документы
        </p>
      </div>

      {/* Навигация */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {availableNavigation.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <item.icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${
                    isActive
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Контент */}
      <div className="py-6">
        <Routes>
          <Route index element={<FormsList />} />
          <Route path="create" element={<FormEditor />} />
          <Route path="edit/:id" element={<FormEditor />} />
          <Route path="preview/:id" element={<FormPreview />} />
          <Route path="settings" element={<SettingsPage />} />
          
          {/* 404 для неизвестных роутов */}
          <Route path="*" element={
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Страница не найдена
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Запрашиваемая страница не существует или у вас нет прав доступа.
              </p>
              <Link
                to="/print-forms"
                className="btn-primary"
              >
                Вернуться к формам
              </Link>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}

// Компонент настроек (заглушка)
function SettingsPage() {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Настройки печатных форм
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Настройки будут доступны в следующих версиях.
      </p>
    </div>
  );
} 