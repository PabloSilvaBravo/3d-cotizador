@echo off
echo ==================================
echo   Iniciando Frontend (Red Local)
echo ==================================
echo.
echo Acceso desde esta PC: http://localhost:5173
echo.
echo Para acceder desde otra PC:
echo 1. Averigua tu IP con: ipconfig
echo 2. Busca "IPv4 Address" (ejemplo: 192.168.1.100)
echo 3. Accede desde otra PC: http://192.168.1.100:5173
echo.
echo ==================================
echo.

npm run dev -- --host

pause
