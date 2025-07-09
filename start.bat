@echo off
echo.
echo ========================================
echo   🚀 P.I.S.D.A. - Запуск системы
echo ========================================
echo.
echo Запускаем сервер и клиент...
echo Сервер: http://localhost:3001
echo Клиент: http://localhost:3000
echo.
echo 📦 Используется NPM Workspaces (централизованные зависимости)
echo Для остановки нажмите Ctrl+C
echo.

npm run dev:all

echo.
echo ========================================
echo   ✅ P.I.S.D.A. остановлена
echo ========================================
pause 