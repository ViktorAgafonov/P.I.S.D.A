const UserModel = require('./models/user');
const { generateToken } = require('./middleware');
const fs = require('fs-extra');
const path = require('path');

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

// Проверка доступа к инструменту авторизации
const checkAuthToolAccess = async (userRole = 'guest') => {
  try {
    // Администраторы всегда имеют доступ к инструменту авторизации
    if (userRole === 'admin') {
      return { allowed: true };
    }

    const toolsConfig = await loadToolsConfig();
    const authTool = toolsConfig.tools?.auth;

    // Если инструмент авторизации не настроен, разрешаем доступ
    if (!authTool) {
      return { allowed: true };
    }

    // Проверяем, активен ли инструмент
    if (authTool.active === false) {
      return { 
        allowed: false, 
        error: 'Инструмент авторизации отключен администратором',
        tool: 'auth',
        status: 'disabled'
      };
    }

    // Проверяем, есть ли у роли пользователя доступ к инструменту
    if (authTool.permissions && !authTool.permissions.includes(userRole)) {
      return { 
        allowed: false, 
        error: 'Доступ к инструменту авторизации запрещен для вашей роли',
        tool: 'auth',
        role: userRole
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Ошибка проверки доступа к инструменту авторизации:', error);
    // В случае ошибки разрешаем доступ для безопасности
    return { allowed: true };
  }
};

class AuthController {
  // Вход в систему
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Требуются имя пользователя и пароль' 
        });
      }

      // Поиск пользователя
      const user = await UserModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({ 
          error: 'Неверное имя пользователя или пароль' 
        });
      }

      // Проверка пароля
      const isValidPassword = await UserModel.validatePassword(user, password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          error: 'Неверное имя пользователя или пароль' 
        });
      }

      // Получаем эффективную роль
      const effectiveRole = UserModel.getEffectiveRole(user);

      // Проверяем доступ к инструменту авторизации
      const accessCheck = await checkAuthToolAccess(effectiveRole);
      if (!accessCheck.allowed) {
        return res.status(403).json(accessCheck);
      }

      // Обновляем время последнего входа
      await UserModel.updateLastLogin(user.id);

      // Генерируем токен
      const token = generateToken(user);

      res.json({
        message: 'Успешный вход в систему',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          effectiveRole,
          status: user.status,
          createdAt: user.createdAt,
          lastLogin: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Ошибка входа:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Регистрация нового пользователя
  async register(req, res) {
    try {
      const { username, password, role = 'user' } = req.body;

      console.log('🔍 Регистрация пользователя:', { username, role, hasUser: !!req.user, userRole: req.user?.effectiveRole });

      // Валидация данных
      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Требуются имя пользователя и пароль' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Пароль должен содержать минимум 6 символов' 
        });
      }

      // Проверка роли (только админ может создавать пользователей с высокими ролями)
      const allowedRoles = ['user'];
      const currentUserRole = req.user?.effectiveRole || 'guest';
      
      if (currentUserRole === 'admin') {
        allowedRoles.push('editor', 'admin');
      }

      console.log('🔍 Проверка ролей:', { 
        requestedRole: role, 
        allowedRoles, 
        currentUserRole,
        hasUser: !!req.user,
        userData: req.user ? { id: req.user.id, username: req.user.username, role: req.user.role, effectiveRole: req.user.effectiveRole } : null
      });

      if (!allowedRoles.includes(role)) {
        console.log('❌ Отказано в создании пользователя с ролью:', role);
        return res.status(403).json({ 
          error: 'Недостаточно прав для создания пользователя с такой ролью. Доступные роли: ' + allowedRoles.join(', ') 
        });
      }

      // Проверяем доступ к инструменту авторизации для создаваемой роли
      const accessCheck = await checkAuthToolAccess(role);
      if (!accessCheck.allowed) {
        return res.status(403).json({
          error: 'Нельзя создать пользователя с ролью, для которой отключен доступ к авторизации',
          ...accessCheck
        });
      }

      // Создание пользователя
      const newUser = await UserModel.createUser({
        username,
        password,
        role
      });

      res.status(201).json({
        message: 'Пользователь успешно создан',
        user: newUser
      });

    } catch (error) {
      console.error('Ошибка регистрации:', error);
      if (error.message.includes('уже существует')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Получение профиля текущего пользователя
  async getProfile(req, res) {
    try {
      if (!req.user || req.user.role === 'guest') {
        return res.status(401).json({ error: 'Требуется аутентификация' });
      }

      const { password, ...userProfile } = req.user;
      
      res.json({
        user: {
          ...userProfile,
          effectiveRole: UserModel.getEffectiveRole(req.user)
        }
      });

    } catch (error) {
      console.error('Ошибка получения профиля:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Получение списка всех пользователей (только для админов)
  async getUsers(req, res) {
    try {
      const users = await UserModel.getAllUsers();
      
      // Убираем пароли из ответа
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return {
          ...safeUser,
          effectiveRole: UserModel.getEffectiveRole(user)
        };
      });

      res.json({ users: safeUsers });

    } catch (error) {
      console.error('Ошибка получения пользователей:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Обновление пользователя
  async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const updates = req.body;

      // Запрещаем изменение системных полей
      delete updates.id;
      delete updates.createdAt;
      delete updates.lastLogin;

      const updatedUser = await UserModel.updateUser(userId, updates);

      res.json({
        message: 'Пользователь успешно обновлен',
        user: {
          ...updatedUser,
          effectiveRole: UserModel.getEffectiveRole(updatedUser)
        }
      });

    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      if (error.message.includes('не найден')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Блокировка пользователя
  async banUser(req, res) {
    try {
      const { userId } = req.params;

      // Нельзя заблокировать самого себя
      if (req.user.id === userId) {
        return res.status(400).json({ 
          error: 'Нельзя заблокировать самого себя' 
        });
      }

      const bannedUser = await UserModel.banUser(userId);

      res.json({
        message: 'Пользователь заблокирован',
        user: {
          ...bannedUser,
          effectiveRole: UserModel.getEffectiveRole(bannedUser)
        }
      });

    } catch (error) {
      console.error('Ошибка блокировки пользователя:', error);
      if (error.message.includes('не найден')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Разблокировка пользователя
  async unbanUser(req, res) {
    try {
      const { userId } = req.params;

      const unbannedUser = await UserModel.unbanUser(userId);

      res.json({
        message: 'Пользователь разблокирован',
        user: {
          ...unbannedUser,
          effectiveRole: UserModel.getEffectiveRole(unbannedUser)
        }
      });

    } catch (error) {
      console.error('Ошибка разблокировки пользователя:', error);
      if (error.message.includes('не найден')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Удаление пользователя
  async deleteUser(req, res) {
    try {
      const { userId } = req.params;

      // Нельзя удалить самого себя
      if (req.user.id === userId) {
        return res.status(400).json({ 
          error: 'Нельзя удалить самого себя' 
        });
      }

      // Проверяем, что пользователь существует
      const userToDelete = await UserModel.findById(userId);
      if (!userToDelete) {
        return res.status(404).json({ 
          error: 'Пользователь не найден' 
        });
      }

      // Удаляем пользователя
      await UserModel.deleteUser(userId);

      res.json({
        message: 'Пользователь успешно удален'
      });

    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      if (error.message.includes('не найден')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Получение информации о ролях
  async getRoles(req, res) {
    try {
      const roles = {
        guest: {
          name: 'guest',
          title: 'Гость',
          description: 'Базовый доступ к публичным инструментам',
          level: 0
        },
        user: {
          name: 'user',
          title: 'Пользователь',
          description: 'Доступ к пользовательским сервисам',
          level: 1
        },
        editor: {
          name: 'editor',
          title: 'Редактор',
          description: 'Управление контентом и документами',
          level: 2
        },
        admin: {
          name: 'admin',
          title: 'Администратор',
          description: 'Полный доступ к системе',
          level: 3
        }
      };

      res.json({ roles });

    } catch (error) {
      console.error('Ошибка получения ролей:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }

  // Проверка токена
  async verifyToken(req, res) {
    try {
      if (!req.user || req.user.role === 'guest') {
        return res.status(401).json({ valid: false });
      }

      res.json({ 
        valid: true,
        user: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role,
          effectiveRole: req.user.effectiveRole,
          status: req.user.status,
          createdAt: req.user.createdAt,
          lastLogin: req.user.lastLogin
        }
      });

    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  }
}

module.exports = new AuthController(); 