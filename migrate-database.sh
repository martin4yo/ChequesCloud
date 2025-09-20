#!/bin/bash

echo "============================================"
echo "   MIGRACIÓN COMPLETA DE BASE DE DATOS"
echo "   Local → Producción"
echo "============================================"
echo

echo "Este script realizará:"
echo "1. Backup de la base de datos local"
echo "2. Restauración en producción"
echo "3. Verificación de los datos"
echo

read -p "¿Continuar con la migración completa? (s/N): " confirm
if [[ ! $confirm =~ ^[Ss]$ ]]; then
    echo "Migración cancelada"
    exit 0
fi

echo
echo "============================================"
echo "   PASO 1: BACKUP DE BASE DE DATOS LOCAL"
echo "============================================"

# Configuración local
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_DB="chequescloud"
LOCAL_USER="postgres"
LOCAL_PASSWORD="Q27G4B98"

# Crear directorio para backups
mkdir -p database-backups

# Generar timestamp para nombres únicos
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
backup_file="database-backups/chequescloud_migration_${timestamp}.sql"

echo "Generando backup: $backup_file"
export PGPASSWORD="$LOCAL_PASSWORD"
pg_dump -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$LOCAL_USER" -d "$LOCAL_DB" -f "$backup_file" --verbose --clean --if-exists

if [ $? -ne 0 ]; then
    echo "❌ ERROR: Falló el backup de la base de datos local"
    exit 1
fi

echo "✅ Backup local completado"

echo
echo "============================================"
echo "   PASO 2: CONFIGURAR CONEXIÓN A PRODUCCIÓN"
echo "============================================"

PROD_HOST="149.50.148.198"
PROD_PORT="5432"
PROD_DB="chequescloud"
PROD_USER="postgres"

echo "Host de producción: $PROD_HOST:$PROD_PORT"
echo "Base de datos: $PROD_DB"
echo "Usuario: $PROD_USER"
echo

read -s -p "Ingresa la contraseña de PostgreSQL de producción: " PROD_PASSWORD
echo

echo
echo "Probando conexión..."
export PGPASSWORD="$PROD_PASSWORD"
psql -h "$PROD_HOST" -p "$PROD_PORT" -U "$PROD_USER" -d "$PROD_DB" -c "SELECT version();" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ ERROR: No se puede conectar a la base de datos de producción"
    echo
    echo "Verifica:"
    echo "- El servidor $PROD_HOST está accesible"
    echo "- PostgreSQL está corriendo en puerto $PROD_PORT"
    echo "- Las credenciales son correctas"
    echo "- El firewall permite la conexión"
    exit 1
fi

echo "✅ Conexión a producción exitosa"

echo
echo "============================================"
echo "   PASO 3: VERIFICAR DATOS EXISTENTES"
echo "============================================"

echo "Datos actuales en producción:"
for table in usuarios bancos chequeras cheques; do
    count=$(psql -h "$PROD_HOST" -p "$PROD_PORT" -U "$PROD_USER" -d "$PROD_DB" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | xargs)
    echo "- $table: $count registros"
done

echo
echo "⚠️  ADVERTENCIA: La restauración borrará TODOS los datos existentes en producción"
echo
read -p "¿Continuar con la restauración? (s/N): " final_confirm

if [[ ! $final_confirm =~ ^[Ss]$ ]]; then
    echo "Migración cancelada"
    echo "El backup se creó en: $backup_file"
    exit 0
fi

echo
echo "============================================"
echo "   PASO 4: RESTAURANDO BASE DE DATOS"
echo "============================================"

echo "Restaurando desde: $backup_file"
echo "Destino: $PROD_HOST:$PROD_PORT/$PROD_DB"
echo
echo "Esto puede tomar varios minutos..."

psql -h "$PROD_HOST" -p "$PROD_PORT" -U "$PROD_USER" -d "$PROD_DB" -f "$backup_file" --quiet

if [ $? -ne 0 ]; then
    echo "❌ ERROR: La restauración falló"
    echo
    echo "El archivo de backup se conserva en: $backup_file"
    echo "Revisa los logs para más detalles"
    exit 1
fi

echo "✅ Restauración completada"

echo
echo "============================================"
echo "   PASO 5: VERIFICACIÓN FINAL"
echo "============================================"

echo "Verificando datos migrados:"
echo

for table in usuarios bancos chequeras cheques; do
    count=$(psql -h "$PROD_HOST" -p "$PROD_PORT" -U "$PROD_USER" -d "$PROD_DB" -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null | xargs)
    echo "- $table: $count registros"
done

echo
echo "Verificando integridad de datos..."

# Verificar que las relaciones estén intactas
related_count=$(psql -h "$PROD_HOST" -p "$PROD_PORT" -U "$PROD_USER" -d "$PROD_DB" -t -c "SELECT COUNT(*) FROM cheques c JOIN chequeras ch ON c.chequeraId = ch.id JOIN bancos b ON ch.bancoId = b.id;" 2>/dev/null | xargs)
echo "- Relaciones intactas: $related_count cheques con banco y chequera válidos"

echo
echo "============================================"
echo "   MIGRACIÓN COMPLETADA EXITOSAMENTE"
echo "============================================"
echo
echo "✅ Base de datos migrada exitosamente"
echo "📁 Backup guardado en: $backup_file"
echo "🌐 Producción: $PROD_HOST:$PROD_PORT/$PROD_DB"
echo
echo "PRÓXIMOS PASOS:"
echo "1. Iniciar la aplicación en producción"
echo "2. Configurar Nginx para cheques.axiomacloud.com"
echo "3. Configurar SSL con Let's Encrypt"
echo "4. Verificar que el login funcione"
echo "5. Probar la funcionalidad completa"
echo
echo "Para configurar el dominio:"
echo "  sudo cp nginx-cheques.axiomacloud.com.conf /etc/nginx/sites-available/"
echo "  sudo ln -s /etc/nginx/sites-available/cheques.axiomacloud.com /etc/nginx/sites-enabled/"
echo "  sudo certbot --nginx -d cheques.axiomacloud.com"
echo
echo "Para iniciar en producción ejecuta:"
echo "  ./start-production.sh"
echo
echo "URL Final: https://cheques.axiomacloud.com"
echo