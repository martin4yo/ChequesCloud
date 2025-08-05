@echo off
echo ================================
echo   ChequesCloud Production Build
echo ================================

echo.
echo Stopping PM2 processes...
pm2 stop chequescloud-backend
pm2 stop chequescloud-frontend

echo.
echo Building backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo Backend build failed!
    pause
    exit /b 1
)

echo.
echo Building frontend for production...
cd ..\frontend

REM Check if .env.local exists, if not, prompt user to create it
if not exist .env.local (
    echo.
    echo WARNING: .env.local file not found!
    echo Please create .env.local file with your server configuration.
    echo Example:
    echo VITE_API_BASE_URL=http://YOUR_SERVER_IP:3000/api
    echo.
    echo Press any key to continue with default settings or Ctrl+C to exit...
    pause > nul
)

call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo.
echo Starting PM2 processes...
cd ..
pm2 start chequescloud-backend
pm2 start chequescloud-frontend

echo.
echo Deployment completed successfully!
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Check PM2 status with: pm2 status
echo Check logs with: pm2 logs
echo.
pause