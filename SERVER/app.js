const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');
const { authenticateToken } = require('./auth/middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware безопасности
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Настройка trust proxy для корректной работы rate limiting
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // лимит запросов на IP
  standardHeaders: true, // Возвращать rate limit info в headers `RateLimit-*`
  legacyHeaders: false, // Отключить headers `X-RateLimit-*`
});
app.use('/api/', limiter);

// Парсинг JSON и URL
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));



// Статические файлы для хранилища
app.use('/storage', express.static(path.join(__dirname, 'storage')));

// Автоматическое подключение роутов инструментов
const toolsPath = path.join(__dirname);
const loadToolRoutes = async () => {
  try {
    const items = await fs.readdir(toolsPath);
    
    for (const item of items) {
      const toolPath = path.join(toolsPath, item);
      const routeFile = path.join(toolPath, 'routes.js');
      
      // Проверяем наличие папки инструмента и файла routes.js
      if (await fs.pathExists(routeFile)) {
        try {
          const routes = require(routeFile);
          app.use(`/api/${item}`, routes);
          console.log(`✅ Инструмент "${item}" подключен: /api/${item}`);
        } catch (requireError) {
          console.error(`❌ Ошибка загрузки routes для "${item}":`, requireError);
        }
      }
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки инструментов:', error);
  }
};

// Подключение роутов печатных форм
const printFormsRoutes = require('./print-forms/routes');
app.use('/api/print-forms', printFormsRoutes);

// Базовые роуты
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'P.I.S.D.A. Server запущен',
    timestamp: new Date().toISOString()
  });
});



// Путь к конфигурации инструментов
const toolsConfigPath = path.join(__dirname, 'tools-config.json');

// Путь к конфигурации дашбордов


// Загрузка конфигурации инструментов
const loadToolsConfig = async () => {
  try {
    if (await fs.pathExists(toolsConfigPath)) {
      const config = await fs.readJson(toolsConfigPath);
      
      // Гарантируем, что инструмент авторизации всегда активен
      if (config.tools && config.tools.auth) {
        config.tools.auth.active = true;
        // Гарантируем, что администратор всегда имеет доступ
        if (config.tools.auth.permissions && !config.tools.auth.permissions.includes('admin')) {
          config.tools.auth.permissions.push('admin');
        }
      }
      
      return config;
    }
    
    // Создаем базовую конфигурацию если файла нет
    const defaultConfig = {
      tools: {},
      defaultPermissions: {
        guest: [],
        user: [],
        editor: [],
        admin: []
      }
    };
    
    await fs.writeJson(toolsConfigPath, defaultConfig, { spaces: 2 });
    return defaultConfig;
  } catch (error) {
    console.error('Ошибка загрузки конфигурации инструментов:', error);
    return { tools: {}, defaultPermissions: {} };
  }
};

// Сохранение конфигурации инструментов
const saveToolsConfig = async (config) => {
  try {
    await fs.writeJson(toolsConfigPath, config, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Ошибка сохранения конфигурации инструментов:', error);
    return false;
  }
};



// Получение списка доступных инструментов
app.get('/api/tools', authenticateToken, async (req, res) => {
  try {
    const items = await fs.readdir(toolsPath);
    const toolsConfig = await loadToolsConfig();
    const tools = [];
    
    for (const item of items) {
      const configPath = path.join(toolsPath, item, 'config.json');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        const toolConfig = toolsConfig.tools[item] || {};
        
        // Показываем только активные инструменты (или все для админов)
        const userRole = req.user?.effectiveRole;
        const isActive = toolConfig.active !== false; // по умолчанию активен
        
        if (isActive || userRole === 'admin') {
          tools.push({
            name: item,
            title: toolConfig.title || config.title || item,
            description: toolConfig.description || config.description || '',
            permissions: toolConfig.permissions || config.permissions || ['guest'],
            active: isActive,
            order: toolConfig.order || 999
          });
        }
      }
    }
    
    // Сортируем по порядку
    tools.sort((a, b) => a.order - b.order);
    
    res.json(tools);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения списка инструментов' });
  }
});

// Управление инструментами (только для админов)
app.get('/api/tools/manage', authenticateToken, async (req, res) => {
  try {
    // Проверяем права администратора
    if (!req.user || req.user.effectiveRole !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }

    const items = await fs.readdir(toolsPath);
    const toolsConfig = await loadToolsConfig();
    const tools = [];
    
    for (const item of items) {
      const configPath = path.join(toolsPath, item, 'config.json');
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        const toolConfig = toolsConfig.tools[item] || {};
        
        tools.push({
          name: item,
          title: toolConfig.title || config.title || item,
          description: toolConfig.description || config.description || '',
          permissions: toolConfig.permissions || config.permissions || ['guest'],
          active: toolConfig.active !== false,
          order: toolConfig.order || 999,
          isInstalled: true
        });
      }
    }
    
    res.json({
      tools,
      defaultPermissions: toolsConfig.defaultPermissions
    });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения управления инструментами' });
  }
});

app.post('/api/tools/manage', authenticateToken, async (req, res) => {
  try {
    // Проверяем права администратора
    if (!req.user || req.user.effectiveRole !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен. Требуются права администратора.' });
    }

    const { tools, defaultPermissions } = req.body;
    const toolsConfig = await loadToolsConfig();

    // Проверка: нельзя отключить доступ admin к модулю авторизации
    if (tools && tools.auth && Array.isArray(tools.auth.permissions)) {
      if (!tools.auth.permissions.includes('admin')) {
        return res.status(400).json({ error: 'Нельзя отключить доступ администратора к модулю авторизации.' });
      }
    }

    // Защита от отключения инструмента авторизации
    if (tools && tools.auth && tools.auth.active === false) {
      return res.status(400).json({ error: 'Инструмент авторизации нельзя отключить.' });
    }

    // Обновляем конфигурацию
    if (tools) {
      toolsConfig.tools = { ...toolsConfig.tools, ...tools };
    }
    if (defaultPermissions) {
      toolsConfig.defaultPermissions = defaultPermissions;
    }
    const saved = await saveToolsConfig(toolsConfig);
    if (saved) {
      res.json({ success: true, message: 'Настройки инструментов сохранены' });
    } else {
      res.status(500).json({ error: 'Ошибка сохранения настроек' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Ошибка обновления настроек инструментов' });
  }
});



// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Раздача статических файлов React-приложения
const webBuildPath = path.join(__dirname, '..', 'WEB', 'build');
if (fs.existsSync(webBuildPath)) {
  app.use(express.static(webBuildPath));
  
  // Catch-all handler для React Router
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(webBuildPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint не найден' });
    }
  });
} else {
  // Если сборки нет, отправляем на dev-сервер
  app.get('/', (req, res) => {
    res.json({ 
      message: 'P.I.S.D.A. Server работает',
      webInterface: 'http://localhost:3000 (dev-server)',
      api: {
        health: '/api/health',
        tools: '/api/tools',
        auth: '/api/auth'
      }
    });
  });
}

// Запуск сервера
const startServer = async () => {
  // Создаем необходимые папки
  await fs.ensureDir(path.join(__dirname, 'storage', 'shared'));
  await fs.ensureDir(path.join(__dirname, 'storage', 'tools'));
  
  // Загружаем роуты инструментов
  await loadToolRoutes();
  
  // 404 для API (должен быть ПОСЛЕ всех роутов)
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint не найден' });
  });
  
  app.listen(PORT, () => {
    console.log(`🚀 P.I.S.D.A. Server запущен на порту ${PORT}`);
    
    const webBuildPath = path.join(__dirname, '..', 'WEB', 'build');
    if (fs.existsSync(webBuildPath)) {
      console.log(`📋 Веб-интерфейс: http://localhost:${PORT}/`);
    } else {
      console.log(`📋 Веб-интерфейс: http://localhost:3000 (dev-server)`);
      console.log(`🔧 API Информация: http://localhost:${PORT}/`);
    }
    
    console.log(`🔍 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🛠️ API Tools: http://localhost:${PORT}/api/tools`);
  });
};

startServer().catch(console.error); 