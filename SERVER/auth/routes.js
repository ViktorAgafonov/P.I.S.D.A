const express = require('express');
const router = express.Router();
const AuthController = require('./controller');
const { 
  authenticateToken, 
  requireMinRole, 
  requireOwnerOrAdmin,
  checkAuthToolAccess
} = require('./middleware');

// Публичные роуты (доступны без токена)
router.post('/login', AuthController.login);

// Роут регистрации (с опциональной аутентификацией для проверки прав)
router.post('/register', authenticateToken, AuthController.register);

// Роуты для аутентифицированных пользователей
router.get('/profile', authenticateToken, checkAuthToolAccess, requireMinRole('user'), AuthController.getProfile);
router.put('/profile', authenticateToken, checkAuthToolAccess, requireMinRole('user'), AuthController.updateProfile);
router.get('/verify', authenticateToken, checkAuthToolAccess, AuthController.verifyToken);

// Административные роуты
router.get('/users', authenticateToken, checkAuthToolAccess, requireMinRole('admin'), AuthController.getUsers);

// Управление пользователями (админы)
router.put('/users/:userId', authenticateToken, checkAuthToolAccess, requireMinRole('admin'), AuthController.updateUser);

// Удаление пользователя (только админы)
router.delete('/users/:userId', authenticateToken, checkAuthToolAccess, requireMinRole('admin'), AuthController.deleteUser);

module.exports = router; 