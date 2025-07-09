# 🚀 P.I.S.D.A. - Быстрый старт

## Автоматический запуск системы

### 1. Windows (Batch-файлы)

#### Запуск в режиме разработки
```bash
# Двойной клик на файл или из PowerShell:
.\start.bat

# Альтернативно через NPM:
npm run dev:all
```
- Запускает сервер с автоперезагрузкой (nodemon)
- Запускает React dev-server
- Сервер: http://localhost:3001
- Клиент: http://localhost:3000

#### Запуск в производственном режиме
```bash
# PowerShell:
.\start-prod.bat

# NPM:
npm run prod
```
- Собирает React-приложение
- Запускает только сервер (раздает собранное приложение)
- Доступ: http://localhost:3001

#### Остановка всех процессов
```bash
# PowerShell:
.\stop.bat

# Или Ctrl+C в консоли где запущены процессы
```
- Завершает все процессы Node.js

### 2. NPM команды

#### Установка всех зависимостей
```bash
# С NPM Workspaces (рекомендуется):
npm install

# Старый способ (для совместимости):
npm run install-all
```

#### Разработка
```bash
# Запуск сервера и клиента одновременно
npm run dev:all

# Только сервер (с автоперезагрузкой)
npm run dev

# Только клиент
npm run web
```

#### Производство
```bash
# Сборка клиента
npm run build

# Запуск только сервера
npm start

# Сборка + запуск
npm run prod
```

## Первый запуск

1. **Установка зависимостей:**
   ```bash
   npm run install-all
   ```

2. **Запуск системы:**
   - Windows (двойной клик): `start.bat`
   - PowerShell: `.\start.bat`
   - NPM: `npm run dev:all`

3. **Вход в систему:**
   - URL: http://localhost:3000
   - Логин: `admin`
   - Пароль: `admin123`

## Структура проекта

```
P.I.S.D.A/
├── 📄 start.bat          # Запуск (разработка)
├── 📄 start-prod.bat     # Запуск (производство)
├── 📄 stop.bat           # Остановка процессов
├── 📄 package.json       # Корневой package.json с workspaces
├── 📁 node_modules/      # Централизованные зависимости
├── 📁 SERVER/            # Серверная часть
│   ├── 📄 package.json   # Упрощенная конфигурация сервера
│   └── 📄 app.js         # Точка входа сервера
└── 📁 WEB/               # Клиентская часть
    ├── 📄 package.json   # Упрощенная конфигурация клиента
    └── 📁 src/           # Исходники React
```

### 📦 NPM Workspaces

Проект использует **NPM Workspaces** для централизованного управления зависимостями:

- ✅ **Экономия места:** Все пакеты в одной папке `node_modules/`
- ✅ **Быстрая установка:** Убраны дублирующиеся зависимости
- ✅ **Простое управление:** Единая команда `npm install`
- ✅ **Автосвязывание:** Workspaces автоматически связаны друг с другом

## Полезные ссылки

- **Дашборд:** http://localhost:3000
- **API Health:** http://localhost:3001/api/health
- **API Tools:** http://localhost:3001/api/tools
- **API Auth:** http://localhost:3001/api/auth 