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
router.get('/roles', AuthController.getRoles);

// Роут регистрации (с опциональной аутентификацией для проверки прав)
router.post('/register', authenticateToken, AuthController.register);

// Роуты для аутентифицированных пользователей
router.get('/profile', authenticateToken, checkAuthToolAccess, requireMinRole('user'), AuthController.getProfile);
router.get('/verify', authenticateToken, checkAuthToolAccess, AuthController.verifyToken);

// Административные роуты
router.get('/users', authenticateToken, checkAuthToolAccess, requireMinRole('admin'), AuthController.getUsers);

// Управление пользователями (админы или владельцы аккаунта)
router.put('/users/:userId', authenticateToken, checkAuthToolAccess, requireOwnerOrAdmin(), AuthController.updateUser);

// Блокировка/разблокировка (только админы)
router.post('/users/:userId/ban', authenticateToken, checkAuthToolAccess, requireMinRole('admin'), AuthController.banUser);
router.post('/users/:userId/unban', authenticateToken, checkAuthToolAccess, requireMinRole('admin'), AuthController.unbanUser);

// Удаление пользователя (только админы)
router.delete('/users/:userId', authenticateToken, checkAuthToolAccess, requireMinRole('admin'), AuthController.deleteUser);

module.exports = router; 