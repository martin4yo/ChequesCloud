@echo off
echo ============================================
echo   Iniciando Backend en Modo Produccion
echo   Puerto: 8085
echo ============================================
echo.

REM Configurar variables de entorno
set NODE_ENV=production
set PORT=8085

echo Variables de entorno:
echo NODE_ENV = %NODE_ENV%
echo PORT = %PORT%
echo.

REM Asegurar que existe el archivo .env
if exist .env.production (
    echo Copiando .env.production a .env...
    copy .env.production .env /Y
) else (
    echo ⚠️  ADVERTENCIA: No existe .env.production
)

echo.
echo Iniciando backend...
npm start

pause