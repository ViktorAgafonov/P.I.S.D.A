const jwt = require('jsonwebtoken');
const UserModel = require('./models/user');
const fs = require('fs-extra');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'pisda-default-secret-key-change-in-production';

// Путь к конфигурации инструментов
const toolsConfigPath = path.join(__dirname, '..', 'tools-config.json');

// Загрузка конфигурации инструментов
const loadToolsConfig = async () => {
  try {
    if (await fs.pathExists(toolsConfigPath)) {
      return await fs.readJson(toolsConfigPath);
    }
    return { tools: {}, defaultPermissions: {} };
  } catch (error) {
    console.error('Ошибка загрузки конфигурации инструментов:', error);
    return { tools: {}, defaultPermissions: {} };
  }
};

// Middleware для проверки JWT токена
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('🔍 authenticateToken:', { 
    hasAuthHeader: !!authHeader, 
    hasToken: !!token, 
    path: req.path,
    method: req.method 
  });

  if (!token) {
    // Если нет токена, устанавливаем гостевую роль
    req.user = { role: 'guest' };
    console.log('👤 Установлена гостевая роль (нет токена)');
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔍 JWT декодирован:', { userId: decoded.userId, username: decoded.username, role: decoded.role });
    
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      console.log('❌ Пользователь не найден в БД:', decoded.userId);
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    // Просто используем роль пользователя напрямую
    req.user = {
      ...user,
      role: user.role
    };
    
    console.log('👤 Пользователь аутентифицирован:', { 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      status: user.status 
    });
    
    next();
  } catch (error) {
    console.log('❌ Ошибка JWT:', error.message);
    return res.status(403).json({ error: 'Недействительный токен' });
  }
};

// Middleware для проверки ролей
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    const userRole = req.user.role || 'guest';
    
    // Проверяем имеет ли пользователь необходимую роль
    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Недостаточно прав доступа',
        required: requiredRoles,
        current: userRole
      });
    }

    next();
  };
};

// Hierarchy ролей (каждая роль включает права предыдущих)
const ROLE_HIERARCHY = {
  'guest': 0,
  'user': 1,
  'editor': 2,
  'admin': 3
};

// Middleware для проверки минимального уровня роли
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    const userRole = req.user.role || 'guest';
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] || 0;
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        error: 'Недостаточно прав доступа',
        required: minRole,
        current: userRole
      });
    }

    next();
  };
};

// Middleware для проверки что пользователь не забанен
const requireActive = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Требуется аутентификация' });
  }

  if (req.user.status === 'banned') {
    return res.status(403).json({ 
      error: 'Аккаунт заблокирован',
      bannedAt: req.user.bannedAt
    });
  }

  next();
};

// Middleware для проверки что пользователь владелец ресурса или админ
const requireOwnerOrAdmin = (getUserIdFromRequest) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    const userRole = req.user.role || 'guest';
    
    // Админы могут делать всё
    if (userRole === 'admin') {
      return next();
    }

    // Проверяем что пользователь владелец ресурса
    const resourceUserId = typeof getUserIdFromRequest === 'function' 
      ? getUserIdFromRequest(req) 
      : req.params.userId || req.user.id;

    if (req.user.id !== resourceUserId) {
      return res.status(403).json({ 
        error: 'Доступ запрещен: требуются права владельца или администратора'
      });
    }

    next();
  };
};

// Генерация JWT токена
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Проверка доступа к инструменту
const checkToolAccess = (toolName, requiredPermission = 'guest') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }

    const userRole = (req.user && req.user.role) || 'guest';
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredPermission] || 0;
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        error: `Недостаточно прав для доступа к инструменту "${toolName}"`,
        required: requiredPermission,
        current: userRole
      });
    }

    next();
  };
};

// Проверка доступа к инструменту авторизации
const checkAuthToolAccess = async (req, res, next) => {
  try {
    const userRole = (req.user && req.user.role) || 'guest';
    
    // Администраторы всегда имеют доступ к инструменту авторизации
    if (userRole === 'admin') {
      return next();
    }

    const toolsConfig = await loadToolsConfig();
    const authTool = toolsConfig.tools?.auth;

    // Если инструмент авторизации не настроен, разрешаем доступ
    if (!authTool) {
      return next();
    }

    // Проверяем, активен ли инструмент
    if (authTool.active === false) {
      return res.status(403).json({ 
        error: 'Инструмент авторизации отключен администратором',
        tool: 'auth',
        status: 'disabled'
      });
    }

    // Проверяем, есть ли у роли пользователя доступ к инструменту
    if (authTool.permissions && !authTool.permissions.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Доступ к инструменту авторизации запрещен для вашей роли',
        tool: 'auth',
        role: userRole
      });
    }

    next();
  } catch (error) {
    console.error('Ошибка проверки доступа к инструменту авторизации:', error);
    // В случае ошибки разрешаем доступ для безопасности
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireMinRole,
  requireActive,
  requireOwnerOrAdmin,
  generateToken,
  checkToolAccess,
  checkAuthToolAccess,
  ROLE_HIERARCHY
}; 