@echo off
echo ============================================
echo   BACKUP DE BASE DE DATOS CHEQUESCLOUD
echo ============================================
echo.

REM Configuracion de base de datos local
set LOCAL_HOST=localhost
set LOCAL_PORT=5432
set LOCAL_DB=chequescloud
set LOCAL_USER=postgres
set LOCAL_PASSWORD=Q27G4B98

REM Crear directorio para backups si no existe
if not exist "database-backups" mkdir database-backups

REM Generar nombre de archivo con timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,4%-%dt:~4,2%-%dt:~6,2%_%dt:~8,2%-%dt:~10,2%-%dt:~12,2%"
set "backup_file=database-backups\chequescloud_backup_%timestamp%.sql"

echo [1/3] Generando backup completo de la base de datos...
echo Archivo: %backup_file%
echo.

REM Exportar toda la base de datos
set PGPASSWORD=%LOCAL_PASSWORD%
pg_dump -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% -f %backup_file% --verbose --clean --if-exists

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [2/3] Generando backup solo de datos (sin estructura)...
    set "data_only_file=database-backups\chequescloud_data_only_%timestamp%.sql"
    pg_dump -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% -f !data_only_file! --data-only --verbose

    echo.
    echo [3/3] Generando backup de estructura (sin datos)...
    set "schema_only_file=database-backups\chequescloud_schema_only_%timestamp%.sql"
    pg_dump -h %LOCAL_HOST% -p %LOCAL_PORT% -U %LOCAL_USER% -d %LOCAL_DB% -f !schema_only_file! --schema-only --verbose

    echo.
    echo ============================================
    echo   BACKUP COMPLETADO EXITOSAMENTE
    echo ============================================
    echo.
    echo Archivos generados:
    echo - Completo: %backup_file%
    echo - Solo datos: !data_only_file!
    echo - Solo estructura: !schema_only_file!
    echo.
    echo Tamaños:
    for %%f in ("%backup_file%") do echo - Completo: %%~zf bytes
    for %%f in ("!data_only_file!") do echo - Solo datos: %%~zf bytes
    for %%f in ("!schema_only_file!") do echo - Solo estructura: %%~zf bytes
) else (
    echo.
    echo ❌ ERROR: El backup falló
    echo Revisa la configuración de PostgreSQL y las credenciales
)

echo.
pause