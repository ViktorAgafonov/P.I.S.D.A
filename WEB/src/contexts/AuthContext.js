import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

// Начальное состояние
const initialState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: true,
  isAuthenticated: false,
};

// Типы действий
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer для управления состоянием
const authReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
      
    case actionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
      
    case actionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
      
    case actionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
      
    default:
      return state;
  }
};

// Создаем контекст
const AuthContext = createContext();

// Провайдер контекста
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Проверка токена при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          const response = await authAPI.verifyToken();
          if (response.data.valid) {
            dispatch({
              type: actionTypes.LOGIN_SUCCESS,
              payload: {
                user: response.data.user,
                token,
              },
            });
          } else {
            localStorage.removeItem('auth_token');
            dispatch({ type: actionTypes.LOGOUT });
          }
        } catch (error) {
          console.error('Ошибка проверки токена:', error);
          localStorage.removeItem('auth_token');
          dispatch({ type: actionTypes.LOGOUT });
        }
      } else {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    };

    checkAuth();
  }, []);

  // Функция входа
  const login = async (credentials) => {
    try {
      dispatch({ type: actionTypes.SET_LOADING, payload: true });
      
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;

      localStorage.setItem('auth_token', token);
      
      dispatch({
        type: actionTypes.LOGIN_SUCCESS,
        payload: { user, token },
      });

      toast.success('Добро пожаловать!');
      return { success: true };
      
    } catch (error) {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      
      // Специальная обработка ошибок доступа к инструменту авторизации
      if (error.response?.data?.tool === 'auth') {
        const errorData = error.response.data;
        let message = errorData.error;
        
        if (errorData.status === 'disabled') {
          message = 'Система авторизации временно недоступна. Обратитесь к администратору.';
        }
        
        toast.error(message);
        return { success: false, error: message, authDisabled: true };
      }
      
      const message = error.response?.data?.error || 'Ошибка входа в систему';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Функция регистрации
  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      toast.success('Регистрация успешна! Теперь войдите в систему.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка регистрации';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Функция выхода
  const logout = () => {
    localStorage.removeItem('auth_token');
    dispatch({ type: actionTypes.LOGOUT });
    toast.success('Вы вышли из системы');
  };

  // Обновление данных пользователя
  const updateUser = (userData) => {
    dispatch({
      type: actionTypes.UPDATE_USER,
      payload: userData,
    });
  };

  // Проверка роли пользователя
  const hasRole = (requiredRole) => {
    if (!state.user) return requiredRole === 'guest';
    
    const roleHierarchy = {
      guest: 0,
      user: 1,
      editor: 2,
      admin: 3,
    };

    const userLevel = roleHierarchy[state.user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  // Проверка конкретной роли
  const hasExactRole = (role) => {
    return state.user?.role === role;
  };

  // Значения контекста
  const contextValue = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    hasExactRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Хук для использования контекста
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 