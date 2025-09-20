@echo off
echo ============================================
echo   MIGRACIÓN COMPLETA DE BASE DE DATOS
echo   Local → Producción
echo ============================================
echo.

echo Este script realizará:
echo 1. Backup de la base de datos local
echo 2. Restauración en producción
echo 3. Verificación de los datos
echo.

set /p confirm=¿Continuar con la migración completa? (S/N):
if /i not "%confirm%"=="S" (
    echo Migración cancelada
    pause
    exit /b 0
)

echo.
echo ============================================
echo   PASO 1: BACKUP DE BASE DE DATOS LOCAL
echo ============================================

REM Configuracion local
set LOCAL_HOST=localhost
set LOCAL_PORT=5432
set LOCAL_DB=chequescloud
set LOCAL_USER=postgres
set LOCAL_PASSWORD=Q27G4B98

REM Crear directorio para backups
if not exist "database-backups" mkdir database-backups

REM Generar timestamp para nombres únicos
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%_%dt:~8,2%-%dt:~10,2%-%dt:~12,2%"
set "backup_file=database-backups\chequescloud_migration_%timestamp%.sql"

echo Generando backup: %backup_file%
set PGPASSWORD=%LOCAL_PASSWORD%
pg_dump -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% -f "%backup_file%" --verbose --clean --if-exists

if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Falló el backup de la base de datos local
    pause
    exit /b 1
)

echo ✅ Backup local completado

echo.
echo ============================================
echo   PASO 2: CONFIGURAR CONEXIÓN A PRODUCCIÓN
echo ============================================

set PROD_HOST=149.50.148.198
set PROD_PORT=5432
set PROD_DB=chequescloud
set PROD_USER=postgres

echo Host de producción: %PROD_HOST%:%PROD_PORT%
echo Base de datos: %PROD_DB%
echo Usuario: %PROD_USER%
echo.

set /p PROD_PASSWORD=Ingresa la contraseña de PostgreSQL de producción:

echo.
echo Probando conexión...
set PGPASSWORD=%PROD_PASSWORD%
psql -h %PROD_HOST% -p %PROD_PORT% -U %PROD_USER% -d %PROD_DB% -c "SELECT version();" > nul 2>&1

if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: No se puede conectar a la base de datos de producción
    echo.
    echo Verifica:
    echo - El servidor %PROD_HOST% está accesible
    echo - PostgreSQL está corriendo en puerto %PROD_PORT%
    echo - Las credenciales son correctas
    echo - El firewall permite la conexión
    pause
    exit /b 1
)

echo ✅ Conexión a producción exitosa

echo.
echo ============================================
echo   PASO 3: VERIFICAR DATOS EXISTENTES
echo ============================================

echo Datos actuales en producción:
for %%t in (usuarios bancos chequeras cheques) do (
    for /f %%r in ('psql -h %PROD_HOST% -p %PROD_PORT% -U %PROD_USER% -d %PROD_DB% -t -c "SELECT COUNT(*) FROM %%t;" 2^>nul') do (
        echo - %%t: %%r registros
    )
)

echo.
echo ⚠️  ADVERTENCIA: La restauración borrará TODOS los datos existentes en producción
echo.
set /p final_confirm=¿Continuar con la restauración? (S/N):

if /i not "%final_confirm%"=="S" (
    echo Migración cancelada
    echo El backup se creó en: %backup_file%
    pause
    exit /b 0
)

echo.
echo ============================================
echo   PASO 4: RESTAURANDO BASE DE DATOS
echo ============================================

echo Restaurando desde: %backup_file%
echo Destino: %PROD_HOST%:%PROD_PORT%/%PROD_DB%
echo.
echo Esto puede tomar varios minutos...

psql -h %PROD_HOST% -p %PROD_PORT% -U %PROD_USER% -d %PROD_DB% -f "%backup_file%" --quiet

if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: La restauración falló
    echo.
    echo El archivo de backup se conserva en: %backup_file%
    echo Revisa los logs para más detalles
    pause
    exit /b 1
)

echo ✅ Restauración completada

echo.
echo ============================================
echo   PASO 5: VERIFICACIÓN FINAL
echo ============================================

echo Verificando datos migrados:
echo.

for %%t in (usuarios bancos chequeras cheques) do (
    for /f %%r in ('psql -h %PROD_HOST% -p %PROD_PORT% -U %PROD_USER% -d %PROD_DB% -t -c "SELECT COUNT(*) FROM %%t;" 2^>nul') do (
        echo - %%t: %%r registros
    )
)

echo.
echo Verificando integridad de datos...

REM Verificar que las relaciones estén intactas
for /f %%r in ('psql -h %PROD_HOST% -p %PROD_PORT% -U %PROD_USER% -d %PROD_DB% -t -c "SELECT COUNT(*) FROM cheques c JOIN chequeras ch ON c.chequeraId = ch.id JOIN bancos b ON ch.bancoId = b.id;" 2^>nul') do (
    echo - Relaciones intactas: %%r cheques con banco y chequera válidos
)

echo.
echo ============================================
echo   MIGRACIÓN COMPLETADA EXITOSAMENTE
echo ============================================
echo.
echo ✅ Base de datos migrada exitosamente
echo 📁 Backup guardado en: %backup_file%
echo 🌐 Producción: %PROD_HOST%:%PROD_PORT%/%PROD_DB%
echo.
echo PRÓXIMOS PASOS:
echo 1. Iniciar la aplicación en producción
echo 2. Verificar que el login funcione
echo 3. Probar la funcionalidad completa
echo.
echo Para iniciar en producción ejecuta:
echo   start-production.bat
echo.
pause