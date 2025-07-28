const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'pisda-default-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Загрузка конфигурации инструментов для проверки доступа к auth
const loadToolsConfig = () => {
    try {
        const configPath = path.join(__dirname, '../tools-config.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('Error loading tools config:', error);
        return { tools: {} };
    }
};

// Проверка доступа к инструменту авторизации
const checkAuthToolAccess = (userRole) => {
    const config = loadToolsConfig();
    const authTool = config.tools?.auth;
    
    if (!authTool) return { allowed: false, reason: 'Конфигурация auth не найдена' };
    if (!authTool.active) return { allowed: false, reason: 'Инструмент авторизации отключен администратором' };
    
    const permissions = authTool.permissions || [];
    if (!permissions.includes(userRole)) {
        return { 
            allowed: false, 
            reason: 'Инструмент авторизации отключен администратором для вашей роли'
        };
    }
    
    return { allowed: true };
};

class AuthController {
    // Логин пользователя
    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ 
                    error: 'Имя пользователя и пароль обязательны' 
                });
            }

            // Находим пользователя
            const user = await User.findByUsername(username);
            if (!user) {
                return res.status(401).json({ 
                    error: 'Неверное имя пользователя или пароль' 
                });
            }

            // Проверяем пароль
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ 
                    error: 'Неверное имя пользователя или пароль' 
                });
            }

            // Проверяем статус сотрудника
            const employeeCheck = await User.checkEmployeeStatus(user);
            if (!employeeCheck.allowed) {
                return res.status(403).json({ 
                    error: employeeCheck.reason,
                    authDisabled: true
                });
            }

            // Проверяем доступ к инструменту авторизации
            const authAccess = checkAuthToolAccess(user.role);
            if (!authAccess.allowed) {
                return res.status(403).json({ 
                    error: authAccess.reason,
                    authDisabled: true
                });
            }

            // Обновляем время последнего входа
            await User.updateLastLogin(user.id);

            // Создаем JWT токен
            const token = jwt.sign(
                { 
                    userId: user.id, 
                    username: user.username, 
                    role: user.role 
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            // Возвращаем данные пользователя без пароля
            const { password: _, ...userResponse } = user;
            
            res.json({
                token,
                user: {
                    ...userResponse,
                    warning: employeeCheck.warning || null
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Регистрация нового пользователя
    async register(req, res) {
        try {
            const { username, password, role, profile } = req.body;

            if (!username || !password) {
                return res.status(400).json({ 
                    error: 'Имя пользователя и пароль обязательны' 
                });
            }

            // Проверяем права на создание пользователей (только admin может создавать)
            if (req.user && req.user.role !== 'admin') {
                return res.status(403).json({ 
                    error: 'Недостаточно прав для создания пользователей' 
                });
            }

            // Проверяем доступ к инструменту авторизации
            const authAccess = checkAuthToolAccess(role || 'user');
            if (!authAccess.allowed) {
                return res.status(403).json({ 
                    error: authAccess.reason,
                    authDisabled: true
                });
            }

            // Создаем пользователя
            const newUser = await User.createUser({
                username,
                password,
                role: role || 'user',
                profile: profile || {}
            });

            // Возвращаем данные без пароля
            const { password: _, ...userResponse } = newUser;
            
            res.status(201).json({
                message: 'Пользователь успешно создан',
                user: userResponse
            });

        } catch (error) {
            console.error('Registration error:', error);
            if (error.message.includes('уже существует')) {
                return res.status(409).json({ error: error.message });
            }
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Проверка токена
    async verifyToken(req, res) {
        try {
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }

            // Проверяем статус сотрудника
            const employeeCheck = await User.checkEmployeeStatus(user);
            if (!employeeCheck.allowed) {
                return res.status(403).json({ 
                    error: employeeCheck.reason,
                    authDisabled: true
                });
            }

            // Проверяем доступ к инструменту авторизации
            const authAccess = checkAuthToolAccess(user.role);
            if (!authAccess.allowed) {
                return res.status(403).json({ 
                    error: authAccess.reason,
                    authDisabled: true
                });
            }

            const { password: _, ...userResponse } = user;
            
            res.json({
                user: {
                    ...userResponse,
                    warning: employeeCheck.warning || null
                }
            });

        } catch (error) {
            console.error('Token verification error:', error);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Получение профиля текущего пользователя
    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }

            const { password: _, ...userResponse } = user;
            res.json({ user: userResponse });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Обновление профиля
    async updateProfile(req, res) {
        try {
            const { profile } = req.body;
            const userId = req.user.userId;

            const updatedUser = await User.updateUser(userId, { profile });
            const { password: _, ...userResponse } = updatedUser;

            res.json({
                message: 'Профиль успешно обновлен',
                user: userResponse
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Получение списка пользователей (только для админа)
    async getUsers(req, res) {
        try {
            const users = await User.loadUsers();
            
            // Убираем пароли из ответа
            const usersResponse = users.map(user => {
                const { password: _, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });

            res.json({ users: usersResponse });

        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Обновление пользователя (только для админа)
    async updateUser(req, res) {
        try {
            const { userId } = req.params;
            const updateData = req.body;

            const updatedUser = await User.updateUser(parseInt(userId), updateData);
            const { password: _, ...userResponse } = updatedUser;

            res.json({
                message: 'Пользователь успешно обновлен',
                user: userResponse
            });

        } catch (error) {
            console.error('Update user error:', error);
            if (error.message.includes('не найден')) {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Удаление пользователя (только для админа)
    async deleteUser(req, res) {
        try {
            const { userId } = req.params;

            await User.deleteUser(parseInt(userId));

            res.json({ message: 'Пользователь успешно удален' });

        } catch (error) {
            console.error('Delete user error:', error);
            if (error.message.includes('не найден') || error.message.includes('администратора')) {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // Создание учетной записи из данных сотрудника
    async createUserFromEmployee(req, res) {
        try {
            const { employeeId, username, password, role } = req.body;

            // Здесь будет интеграция с модулем сотрудников
            // Пока создаем заглушку
            res.status(501).json({ 
                error: 'Функция будет реализована после создания модуля сотрудников' 
            });

        } catch (error) {
            console.error('Create user from employee error:', error);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }
}

module.exports = new AuthController(); 