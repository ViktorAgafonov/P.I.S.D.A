import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { AuthTool } from './auth/AuthTool';
import { PrintFormsTool } from './print-forms/PrintFormsTool';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          {/* Публичные роуты */}
          <Route path="/login" element={<Login />} />
          
          {/* Защищенные роуты с Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            
            {/* Инструмент авторизации */}
            <Route 
              path="/auth/*" 
              element={
                <ProtectedRoute requiredRole="user">
                  <AuthTool />
                </ProtectedRoute>
              } 
            />
            
            {/* Инструмент печатных форм */}
            <Route 
              path="/print-forms/*" 
              element={
                <ProtectedRoute requiredRole="editor">
                  <PrintFormsTool />
                </ProtectedRoute>
              } 
            />
            
            {/* Здесь будут добавляться другие инструменты */}
          </Route>
        </Routes>

      </div>
    </AuthProvider>
  );
}

export default App; 