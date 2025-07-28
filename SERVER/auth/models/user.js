const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, '../data/users.json');

class User {
    static async loadUsers() {
        try {
            if (!fs.existsSync(USERS_FILE)) {
                // Создаем файл с администратором по умолчанию
                const defaultAdmin = {
                    id: 1,
                    username: 'admin',
                    password: await bcrypt.hash('admin123', 10),
                    role: 'admin',
                    status: 'active',
                    // Расширенные поля профиля
                    profile: {
                        lastName: 'Администратор',
                        firstName: 'Системный',
                        middleName: '',
                        birthYear: 1980,
                        employmentDate: new Date().toISOString().split('T')[0],
                        dismissalDate: null,
                        department: 'IT отдел',
                        section: 'Администрирование',
                        position: 'Системный администратор',
                        employeeStatus: 'active' // active, dismissed, vacation, sick_leave
                    },
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                };
                
                const users = [defaultAdmin];
                fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
                return users;
            }
            
            const data = fs.readFileSync(USERS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    static async saveUsers(users) {
        try {
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving users:', error);
            return false;
        }
    }

    static async findById(id) {
        const users = await this.loadUsers();
        return users.find(user => user.id === id);
    }

    static async findByUsername(username) {
        const users = await this.loadUsers();
        return users.find(user => user.username === username);
    }

    static async createUser(userData) {
        const users = await this.loadUsers();
        
        // Проверяем уникальность имени пользователя
        const existingUser = users.find(user => user.username === userData.username);
        if (existingUser) {
            throw new Error('Пользователь с таким именем уже существует');
        }

        // Создаем нового пользователя
        const newUser = {
            id: Math.max(0, ...users.map(u => u.id)) + 1,
            username: userData.username,
            password: await bcrypt.hash(userData.password, 10),
            role: userData.role,
            status: userData.status || 'active',
            // Расширенные поля профиля
            profile: {
                lastName: userData.profile?.lastName || '',
                firstName: userData.profile?.firstName || '',
                middleName: userData.profile?.middleName || '',
                birthYear: userData.profile?.birthYear || null,
                employmentDate: userData.profile?.employmentDate || new Date().toISOString().split('T')[0],
                dismissalDate: userData.profile?.dismissalDate || null,
                department: userData.profile?.department || '',
                section: userData.profile?.section || '',
                position: userData.profile?.position || '',
                employeeStatus: userData.profile?.employeeStatus || 'active'
            },
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        users.push(newUser);
        await this.saveUsers(users);
        
        return newUser;
    }

    static async updateUser(id, updateData) {
        const users = await this.loadUsers();
        const userIndex = users.findIndex(user => user.id === id);
        
        if (userIndex === -1) {
            throw new Error('Пользователь не найден');
        }

        // Обновляем пользователя
        const user = users[userIndex];
        
        if (updateData.username) user.username = updateData.username;
        if (updateData.role) user.role = updateData.role;
        if (updateData.status) user.status = updateData.status;
        
        // Обновляем профиль
        if (updateData.profile) {
            user.profile = { ...user.profile, ...updateData.profile };
        }
        
        // Хешируем новый пароль если он передан
        if (updateData.password) {
            user.password = await bcrypt.hash(updateData.password, 10);
        }

        users[userIndex] = user;
        await this.saveUsers(users);
        
        return user;
    }

    static async deleteUser(id) {
        const users = await this.loadUsers();
        const userIndex = users.findIndex(user => user.id === id);
        
        if (userIndex === -1) {
            throw new Error('Пользователь не найден');
        }

        // Нельзя удалить системного администратора
        if (users[userIndex].username === 'admin') {
            throw new Error('Нельзя удалить системного администратора');
        }

        users.splice(userIndex, 1);
        await this.saveUsers(users);
        
        return true;
    }

    static async updateLastLogin(id) {
        const users = await this.loadUsers();
        const userIndex = users.findIndex(user => user.id === id);
        
        if (userIndex !== -1) {
            users[userIndex].lastLogin = new Date().toISOString();
            await this.saveUsers(users);
        }
    }

    // Проверка статуса сотрудника для авторизации
    static async checkEmployeeStatus(user) {
        // Если у пользователя нет профиля сотрудника, разрешаем вход (системные аккаунты)
        if (!user.profile || !user.profile.employeeStatus) {
            return { allowed: true };
        }

        const profile = user.profile;
        const now = new Date();

        // Проверяем статус сотрудника
        switch (profile.employeeStatus) {
            case 'dismissed':
                // Если есть дата увольнения и она прошла
                if (profile.dismissalDate) {
                    const dismissalDate = new Date(profile.dismissalDate);
                    if (now > dismissalDate) {
                        return { 
                            allowed: false, 
                            reason: 'Доступ запрещен: сотрудник уволен' 
                        };
                    }
                }
                break;
                
            case 'sick_leave':
                return { 
                    allowed: true, 
                    warning: 'Сотрудник находится на больничном' 
                };
                
            case 'vacation':
                return { 
                    allowed: true, 
                    warning: 'Сотрудник находится в отпуске' 
                };
                
            case 'active':
            default:
                return { allowed: true };
        }

        return { allowed: true };
    }
}

module.exports = User; 