#!/bin/bash

echo "============================================"
echo "   SOLUCIONANDO DATABASE_URL EN PM2"
echo "============================================"

cd /var/www/ChequesCloud

echo "[1/5] Parando proceso actual..."
pm2 delete chequescloud 2>/dev/null || true

echo "[2/5] Verificando configuración actual..."
echo "Contenido del start-chequescloud.sh:"
if [ -f "start-chequescloud.sh" ]; then
    grep -E "(DATABASE_URL|export)" start-chequescloud.sh || echo "No se encontraron variables de entorno"
else
    echo "❌ start-chequescloud.sh no existe"
fi

echo
echo "Contenido del ecosystem.config.js:"
if [ -f "ecosystem.config.js" ]; then
    cat ecosystem.config.js
else
    echo "❌ ecosystem.config.js no existe"
fi

echo "[3/5] Creando configuración PM2 con variables explícitas..."
cat > ecosystem.config.js << 'PM2_EOF'
module.exports = {
  apps: [{
    name: 'chequescloud',
    script: './backend/dist/index.js',
    cwd: '/var/www/ChequesCloud',
    env: {
      NODE_ENV: 'production',
      PORT: '8085',
      DATABASE_URL: 'postgresql://postgres:Q27G4B98@localhost:5432/chequescloud?schema=public',
      API_URL: 'https://cheques.axiomacloud.com',
      DB_NAME: 'chequescloud',
      DB_USER: 'postgres',
      DB_PASSWORD: 'Q27G4B98',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_DIALECT: 'postgres',
      JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production-123456789',
      JWT_EXPIRES_IN: '7d',
      CORS_ORIGIN: 'https://cheques.axiomacloud.com',
      SESSION_SECRET: 'your-session-secret-change-this-in-production-987654321'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_file: '/var/log/pm2/chequescloud.log',
    error_file: '/var/log/pm2/chequescloud-error.log',
    out_file: '/var/log/pm2/chequescloud-out.log'
  }]
}
PM2_EOF

echo "[4/5] Verificando PostgreSQL..."
if systemctl is-active postgresql >/dev/null 2>&1; then
    echo "✅ PostgreSQL está activo"
else
    echo "🔄 Iniciando PostgreSQL..."
    systemctl start postgresql
    systemctl enable postgresql
fi

# Verificar conexión a la base de datos
echo "Probando conexión a la base de datos..."
if sudo -u postgres psql -c "SELECT version();" >/dev/null 2>&1; then
    echo "✅ Conexión a PostgreSQL exitosa"
    
    # Verificar que existe la base de datos
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw chequescloud; then
        echo "✅ Base de datos 'chequescloud' existe"
    else
        echo "⚠️  Creando base de datos 'chequescloud'..."
        sudo -u postgres createdb chequescloud
        echo "✅ Base de datos creada"
    fi
else
    echo "❌ Error conectando a PostgreSQL"
    echo "Verificar instalación: sudo systemctl status postgresql"
fi

echo "[5/5] Iniciando aplicación con PM2..."
pm2 start ecosystem.config.js
pm2 save

sleep 3

echo
echo "============================================"
echo "   VERIFICACIÓN"
echo "============================================"

echo "Estado PM2:"
pm2 status | grep chequescloud || echo "❌ Proceso no encontrado"

echo
echo "Logs recientes:"
pm2 logs chequescloud --lines 10

echo
echo "Probando conectividad:"
sleep 2
if curl -s "http://localhost:8085/api/health" >/dev/null; then
    echo "✅ Backend responde"
else
    echo "❌ Backend no responde"
    echo "Ver logs completos: pm2 logs chequescloud"
fi

echo
echo "============================================"
echo "Variables de entorno en PM2:"
pm2 show chequescloud | grep -A 20 "env:"

echo "============================================"
