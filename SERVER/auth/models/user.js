const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class UserModel {
  constructor() {
    this.usersFile = path.join(__dirname, '..', 'data', 'users.json');
    this.ensureDataDir();
    this.createDefaultAdmin();
  }

  async ensureDataDir() {
    const dataDir = path.dirname(this.usersFile);
    await fs.ensureDir(dataDir);
    
    // Создаем файл пользователей если не существует
    if (!await fs.pathExists(this.usersFile)) {
      await fs.writeJson(this.usersFile, [], { spaces: 2 });
    }
  }

  async createDefaultAdmin() {
    const users = await this.getAllUsers();
    const adminExists = users.some(user => user.role === 'admin');
    
    if (!adminExists) {
      const defaultAdmin = {
        id: uuidv4(),
        username: 'admin',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
      
      users.push(defaultAdmin);
      await fs.writeJson(this.usersFile, users, { spaces: 2 });
      console.log('✅ Создан администратор по умолчанию: admin/admin123');
    }
  }

  async getAllUsers() {
    try {
      return await fs.readJson(this.usersFile);
    } catch (error) {
      console.error('Ошибка чтения файла пользователей:', error);
      return [];
    }
  }

  async saveUsers(users) {
    try {
      await fs.writeJson(this.usersFile, users, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Ошибка сохранения пользователей:', error);
      return false;
    }
  }

  async findByUsername(username) {
    const users = await this.getAllUsers();
    return users.find(user => user.username === username);
  }



  async findById(id) {
    const users = await this.getAllUsers();
    return users.find(user => user.id === id);
  }

  async createUser(userData) {
    const users = await this.getAllUsers();
    
    // Проверка уникальности
    const existingUser = users.find(user => 
      user.username === userData.username
    );
    
    if (existingUser) {
      throw new Error('Пользователь с таким именем уже существует');
    }

    const newUser = {
      id: uuidv4(),
      username: userData.username,
      password: await bcrypt.hash(userData.password, 10),
      role: userData.role || 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      originalRole: userData.role || 'user' // Для системы БАН
    };

    users.push(newUser);
    await this.saveUsers(users);
    
    // Возвращаем пользователя без пароля
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async updateUser(id, updates) {
    const users = await this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      throw new Error('Пользователь не найден');
    }

    // Хешируем пароль если он обновляется
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    users[userIndex] = { ...users[userIndex], ...updates };
    await this.saveUsers(users);
    
    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
  }

  async banUser(id) {
    const users = await this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      throw new Error('Пользователь не найден');
    }

    // Сохраняем оригинальную роль и устанавливаем статус БАН
    if (!users[userIndex].originalRole) {
      users[userIndex].originalRole = users[userIndex].role;
    }
    
    users[userIndex].status = 'banned';
    users[userIndex].bannedAt = new Date().toISOString();
    
    await this.saveUsers(users);
    
    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
  }

  async unbanUser(id) {
    const users = await this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      throw new Error('Пользователь не найден');
    }

    users[userIndex].status = 'active';
    delete users[userIndex].bannedAt;
    
    await this.saveUsers(users);
    
    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
  }

  async deleteUser(id) {
    const users = await this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      throw new Error('Пользователь не найден');
    }

    // Удаляем пользователя из массива
    users.splice(userIndex, 1);
    await this.saveUsers(users);
    
    return true;
  }

  async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }

  async updateLastLogin(id) {
    const users = await this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex !== -1) {
      users[userIndex].lastLogin = new Date().toISOString();
      await this.saveUsers(users);
    }
  }

  // Получение эффективной роли (с учетом БАН)
  getEffectiveRole(user) {
    if (user.status === 'banned') {
      return 'guest';
    }
    return user.role;
  }
}

module.exports = new UserModel(); 