@echo off
echo ============================================
echo   Iniciando ChequesCloud en Produccion
echo   URL: http://149.50.148.198:8085/
echo ============================================
echo.

REM Compilar y ejecutar Backend
echo [1/4] Compilando backend...
cd backend
call npm run build

REM Copiar configuracion de produccion
echo [2/4] Configurando entorno de produccion...
copy .env.production .env /Y

REM Verificar variables de entorno
echo [3/4] Configurando variables de entorno...
set NODE_ENV=production
set PORT=8085
echo NODE_ENV establecido a: %NODE_ENV%
echo PORT establecido a: %PORT%

REM Iniciar backend
echo Iniciando backend en puerto 8085...
start "Backend ChequesCloud" cmd /k "set NODE_ENV=production && set PORT=8085 && npm start"

REM Esperar 5 segundos para que el backend inicie
timeout /t 5

REM Compilar Frontend
echo [4/4] Compilando frontend para produccion...
cd ..\frontend
call npm run build -- --mode production

REM Servir el frontend con Express integrado en el backend
echo ============================================
echo   ChequesCloud iniciado exitosamente!
echo ============================================
echo.
echo   Backend:  http://149.50.148.198:8085/api
echo   Frontend: http://149.50.148.198:8085/
echo.
echo   IMPORTANTE: El frontend debe servirse
echo   desde el mismo puerto que el backend (8085)
echo   usando Express static o un proxy reverso
echo ============================================
pause