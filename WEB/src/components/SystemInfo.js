import React from 'react';
import { useQuery } from 'react-query';
import { commonAPI } from '../services/api';
import { Server, Clock, Activity, CheckCircle, AlertCircle } from 'lucide-react';

export function SystemInfo() {
  const { data: healthData, isLoading } = useQuery(
    'health',
    () => commonAPI.healthCheck(),
    {
      select: (response) => response.data,
      refetchInterval: 30000, // Обновляем каждые 30 секунд
    }
  );

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 h-12 w-12"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const formatUptime = (timestamp) => {
    const startTime = new Date(timestamp);
    const now = new Date();
    const uptime = now - startTime;
    
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }
    return `${minutes}м`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Системная информация
        </h3>
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            Онлайн
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Статус сервера */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              P.I.S.D.A. Server
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {healthData?.status || 'OK'}
            </div>
          </div>
        </div>

        {/* Время работы */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Время работы
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {healthData?.timestamp ? formatUptime(healthData.timestamp) : 'Неизвестно'}
            </div>
          </div>
        </div>

        {/* Активность */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Активность
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Система активна
            </div>
          </div>
        </div>
      </div>

      {/* Дополнительная информация */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {healthData?.message || 'Система работает нормально'}
        </div>
      </div>
    </div>
  );
} 