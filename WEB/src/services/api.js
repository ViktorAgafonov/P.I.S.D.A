import axios from 'axios';

// Базовая конфигурация axios
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:3001/api' : '/api',
  timeout: 10000,
});

// Интерцептор для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ответов
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Если токен недействителен (401), удаляем его и перенаправляем на логин
    // 403 ошибки не должны приводить к разлогиниванию (это могут быть ограничения прав)
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API методы для авторизации
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyToken: () => api.get('/auth/verify'),
  getProfile: () => api.get('/auth/profile'),
  getRoles: () => api.get('/auth/roles'),
  
  // Управление пользователями (админ)
  getUsers: () => api.get('/auth/users'),
  updateUser: (userId, userData) => api.put(`/auth/users/${userId}`, userData),
  updateUserRole: (userId, role) => api.put(`/auth/users/${userId}`, { role }),
  banUser: (userId) => api.post(`/auth/users/${userId}/ban`),
  unbanUser: (userId) => api.post(`/auth/users/${userId}/unban`),
  deleteUser: (userId) => api.delete(`/auth/users/${userId}`),
};

// API методы для инструментов
export const toolsAPI = {
  getTools: () => api.get('/tools'),
  getToolConfig: (toolName) => api.get(`/${toolName}/config`),
  
  // Управление инструментами (админ)
  getToolsManagement: () => api.get('/tools/manage'),
  updateToolsManagement: (data) => api.post('/tools/manage', data),
};

// API методы для печатных форм
export const printFormsAPI = {
  // Основные операции с формами
  getForms: () => api.get('/print-forms/forms'),
  getForm: (id) => api.get(`/print-forms/forms/${id}`),
  createForm: (formData) => api.post('/print-forms/forms', formData),
  updateForm: (id, formData) => api.put(`/print-forms/forms/${id}`, formData),
  deleteForm: (id) => api.delete(`/print-forms/forms/${id}`),
  
  // Предварительный просмотр и экспорт
  previewForm: (id, data) => api.get(`/print-forms/forms/${id}/preview`, { data }),
  exportDocument: (id, data) => api.post(`/print-forms/forms/${id}/export`, data),
  printDocument: (id, data) => api.post(`/print-forms/forms/${id}/print`, data),
};



// API методы для файлов и хранилища
export const storageAPI = {
  uploadFile: (toolName, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post(`/${toolName}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },
  
  getFile: (toolName, fileName) => api.get(`/${toolName}/files/${fileName}`),
  deleteFile: (toolName, fileName) => api.delete(`/${toolName}/files/${fileName}`),
  getFileList: (toolName) => api.get(`/${toolName}/files`),
};

// Общие API методы
export const commonAPI = {
  healthCheck: () => api.get('/health'),
  
  // Метод для выполнения произвольных запросов к инструментам
  toolRequest: (toolName, endpoint, method = 'GET', data = null) => {
    const config = {
      method: method.toLowerCase(),
      url: `/${toolName}${endpoint}`,
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }
    
    return api(config);
  },
};

// Хелперы для работы с ошибками
export const handleApiError = (error) => {
  if (error.response) {
    // Сервер ответил с ошибкой
    return {
      message: error.response.data?.error || 'Ошибка сервера',
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Запрос был отправлен, но ответа не получено
    return {
      message: 'Сервер не отвечает',
      status: null,
      data: null,
    };
  } else {
    // Ошибка настройки запроса
    return {
      message: 'Ошибка настройки запроса',
      status: null,
      data: null,
    };
  }
};

export default api; 