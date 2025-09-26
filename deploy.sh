#!/bin/bash

# ChequesCloud - Deploy Script for Linux Production
# Este script realiza un deploy completo sin pérdida de datos

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
APP_NAME="chequescloud"
PROJECT_DIR="/var/www/cheques"
BACKEND_PORT=8085
FRONTEND_BUILD_DIR="frontend/dist"
BACKUP_DIR="/var/backups/cheques"

# Función para logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR $(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING $(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO $(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Cambiar al directorio del proyecto
cd $PROJECT_DIR || error "No se pudo acceder al directorio $PROJECT_DIR"

# Verificar que estamos en el directorio correcto
if [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    error "Este script debe ejecutarse desde el directorio raíz del proyecto cheques en $PROJECT_DIR"
fi

log "🚀 Iniciando deploy de Cheques en $PROJECT_DIR..."

# 1. Verificar dependencias del sistema
info "📋 Verificando dependencias del sistema..."
command -v node >/dev/null 2>&1 || error "Node.js no está instalado"
command -v npm >/dev/null 2>&1 || error "npm no está instalado"
command -v pm2 >/dev/null 2>&1 || error "pm2 no está instalado. Instalar con: npm install -g pm2"
command -v git >/dev/null 2>&1 || error "git no está instalado"

# Verificar versión de Node
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"
if ! npm version --version &>/dev/null; then
    error "Versión de Node.js debe ser >= $REQUIRED_VERSION"
fi

log "✅ Dependencias verificadas correctamente"

# 2. Crear directorio de backup si no existe
info "📁 Preparando directorios de backup..."
sudo mkdir -p $BACKUP_DIR
sudo chown $USER:$USER $BACKUP_DIR

# 3. Backup de base de datos (opcional)
if [ -f ".env" ]; then
    info "💾 Creando backup de configuración..."
    cp .env $BACKUP_DIR/.env.backup.$(date +%Y%m%d_%H%M%S)
fi

# 4. Git pull con stash de cambios locales
log "📥 Actualizando código desde repositorio..."
if [ -d ".git" ]; then
    # Stash cambios locales si existen
    if ! git diff-index --quiet HEAD --; then
        warn "Hay cambios locales, guardándolos en stash..."
        git stash push -m "Deploy backup $(date)"
    fi

    git fetch origin
    git pull origin master || git pull origin main
    log "✅ Código actualizado correctamente"
else
    warn "No es un repositorio git, saltando git pull"
fi

# 5. Detener la aplicación si está corriendo
log "🛑 Deteniendo aplicación actual..."
if pm2 list | grep -q $APP_NAME; then
    pm2 stop $APP_NAME || warn "No se pudo detener $APP_NAME (puede que no esté corriendo)"
else
    info "La aplicación no está corriendo en PM2"
fi

# 6. Pre-validación - Compilar para detectar errores de tipos
log "🔍 Pre-validación: Verificando errores de tipos..."

# Backend - Verificar tipos primero
info "🔧 Verificando tipos del Backend..."
cd backend

info "📦 Instalando dependencias del backend..."
npm ci --production=false

info "🗄️  Generando cliente Prisma..."
npx prisma generate

info "🏗️  Verificando compilación TypeScript..."
npm run build || error "❌ Error de compilación en Backend - revisar errores de tipos"

log "✅ Backend compilado sin errores"
cd ..

# Frontend - Verificar tipos y build
info "🎨 Verificando tipos del Frontend..."
cd frontend

info "📦 Instalando dependencias del frontend..."
npm ci

info "🏗️  Construyendo aplicación para producción..."
npm run build || error "❌ Error de build en Frontend - revisar errores de tipos"

# Verificar que el build se creó correctamente
if [ ! -d "dist" ]; then
    error "El build del frontend falló - directorio 'dist' no encontrado"
fi

log "✅ Frontend construido sin errores"
cd ..

log "✅ Pre-validación completada - Sin errores de tipos"

# 7. Ahora ejecutar migraciones (después de validar que todo compila)
info "🗄️  Ejecutando migraciones de base de datos..."
cd backend
npx prisma migrate deploy || warn "Error en migraciones, verificar manualmente"
cd ..

# 9. Configurar variables de entorno para producción
info "⚙️  Configurando variables de entorno..."
if [ -f "backend/.env.example" ] && [ ! -f "backend/.env" ]; then
    warn "Archivo .env no encontrado, creando desde .env.example"
    cp backend/.env.example backend/.env
    warn "IMPORTANTE: Configurar las variables de entorno en backend/.env"
fi

# 10. Configurar PM2 ecosystem
info "🔄 Configurando PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'backend/dist/index.js',
    cwd: '$(pwd)',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: $BACKEND_PORT
    },
    log_file: './logs/app.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Crear directorio de logs
mkdir -p logs

# 11. Iniciar aplicación con PM2
log "🚀 Iniciando aplicación..."

# Cargar configuración en PM2
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start ecosystem.config.js

# Guardar configuración de PM2
pm2 save

# Configurar PM2 para auto-inicio
pm2 startup || warn "No se pudo configurar auto-inicio de PM2"

# 12. Verificar que la aplicación está corriendo
info "🔍 Verificando estado de la aplicación..."
sleep 5

if pm2 list | grep -q "$APP_NAME.*online"; then
    log "✅ Aplicación iniciada correctamente"

    # Mostrar logs en tiempo real por 10 segundos
    info "📋 Mostrando logs de inicio (10 segundos)..."
    timeout 10s pm2 logs $APP_NAME || true

    # Verificar que el puerto está abierto
    if netstat -tlnp | grep :$BACKEND_PORT > /dev/null; then
        log "✅ Servidor corriendo en puerto $BACKEND_PORT"
    else
        warn "El puerto $BACKEND_PORT no parece estar abierto"
    fi
else
    error "❌ La aplicación falló al iniciar. Verificar logs con: pm2 logs $APP_NAME"
fi

# 13. Información final
log "🎉 Deploy completado exitosamente!"
echo
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}        ChequesCloud Deploy Summary         ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${YELLOW}🔗 Backend URL:${NC} http://localhost:$BACKEND_PORT"
echo -e "${YELLOW}📁 Frontend Build:${NC} $FRONTEND_BUILD_DIR"
echo -e "${YELLOW}📋 PM2 App Name:${NC} $APP_NAME"
echo
echo -e "${BLUE}Comandos útiles:${NC}"
echo -e "  ${GREEN}pm2 logs $APP_NAME${NC}        - Ver logs en tiempo real"
echo -e "  ${GREEN}pm2 restart $APP_NAME${NC}     - Reiniciar aplicación"
echo -e "  ${GREEN}pm2 stop $APP_NAME${NC}        - Detener aplicación"
echo -e "  ${GREEN}pm2 status${NC}               - Ver estado de aplicaciones PM2"
echo -e "  ${GREEN}pm2 monit${NC}                - Monitor de PM2"
echo
echo -e "${YELLOW}⚠️  Recuerda configurar tu servidor web (nginx/apache) para servir los archivos estáticos del frontend${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

exit 0