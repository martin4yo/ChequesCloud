@echo off
echo ============================================
echo   RESTAURAR BASE DE DATOS EN PRODUCCION
echo ============================================
echo.

REM Configuracion de base de datos de produccion
set PROD_HOST=149.50.148.198
set PROD_PORT=5432
set PROD_DB=chequescloud
set PROD_USER=postgres

REM Solicitar la contraseña de producción
set /p PROD_PASSWORD=Ingresa la contraseña de PostgreSQL de producción:

echo.
echo Buscando archivos de backup disponibles...
echo.

REM Listar archivos de backup disponibles
if not exist "database-backups" (
    echo ❌ ERROR: No existe el directorio database-backups
    echo Primero ejecuta database-backup.bat para crear un backup
    pause
    exit /b 1
)

echo Archivos de backup disponibles:
echo.
set count=0
for %%f in (database-backups\*.sql) do (
    set /a count+=1
    echo !count!. %%~nxf (%%~zf bytes)
)

if %count% EQU 0 (
    echo ❌ No se encontraron archivos de backup
    echo Primero ejecuta database-backup.bat
    pause
    exit /b 1
)

echo.
set /p backup_choice=Ingresa el número del archivo a restaurar (o 'L' para el más reciente):

if /i "%backup_choice%"=="L" (
    REM Buscar el archivo más reciente
    for /f "delims=" %%f in ('dir "database-backups\chequescloud_backup_*.sql" /b /o-d 2^>nul ^| findstr /n "^" ^| findstr "^1:"') do (
        set "backup_file=%%f"
        set "backup_file=!backup_file:~2!"
    )
    set "backup_file=database-backups\!backup_file!"
) else (
    REM Usar el archivo seleccionado por número
    set current=0
    for %%f in (database-backups\*.sql) do (
        set /a current+=1
        if !current! EQU %backup_choice% set "backup_file=%%f"
    )
)

if not defined backup_file (
    echo ❌ ERROR: Selección inválida
    pause
    exit /b 1
)

echo.
echo Archivo seleccionado: %backup_file%
echo.
echo ⚠️  ADVERTENCIA: Esta operación borrará todos los datos existentes en producción
echo    Host: %PROD_HOST%:%PROD_PORT%
echo    Base de datos: %PROD_DB%
echo.
set /p confirm=¿Estás seguro que quieres continuar? (S/N):

if /i not "%confirm%"=="S" (
    echo Operación cancelada
    pause
    exit /b 0
)

echo.
echo [1/3] Probando conexión a la base de datos de producción...
set PGPASSWORD=%PROD_PASSWORD%
psql -h %PROD_HOST% -p %PROD_PORT% -U %PROD_USER% -d %PROD_DB% -c "SELECT version();" > nul 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: No se puede conectar a la base de datos de producción
    echo Verifica:
    echo - Host y puerto correctos
    echo - Credenciales correctas
    echo - Firewall permite conexión
    echo - PostgreSQL está corriendo
    pause
    exit /b 1
)

echo ✅ Conexión exitosa

echo.
echo [2/3] Restaurando base de datos...
echo Esto puede tomar varios minutos dependiendo del tamaño...
psql -h %PROD_HOST% -p %PROD_PORT% -U %PROD_USER% -d %PROD_DB% -f "%backup_file%" --verbose

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [3/3] Verificando restauración...
    echo.
    echo Contando registros en las tablas principales:

    REM Verificar tablas principales
    for %%t in (usuarios bancos chequeras cheques) do (
        for /f %%r in ('psql -h %PROD_HOST% -p %PROD_PORT% -U %PROD_USER% -d %PROD_DB% -t -c "SELECT COUNT(*) FROM %%t;" 2^>nul') do (
            echo - %%t: %%r registros
        )
    )

    echo.
    echo ============================================
    echo   RESTAURACIÓN COMPLETADA EXITOSAMENTE
    echo ============================================
    echo.
    echo La base de datos de producción ahora contiene
    echo los datos de tu base de datos local.
    echo.
    echo Siguiente paso: Iniciar la aplicación en producción
) else (
    echo.
    echo ❌ ERROR: La restauración falló
    echo Revisa los mensajes de error anteriores
    echo.
    echo Posibles causas:
    echo - Versiones incompatibles de PostgreSQL
    echo - Permisos insuficientes
    echo - Estructura de BD diferente
)

echo.
pause