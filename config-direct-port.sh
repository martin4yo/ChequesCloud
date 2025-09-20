#!/bin/bash

echo "============================================"
echo "   CONFIGURACIÓN DOMINIO → PUERTO 8085"
echo "   cheques.axiomacloud.com:8085"
echo "============================================"
echo

DOMAIN="cheques.axiomacloud.com"
PORT="8085"

echo "🌐 Configurando: $DOMAIN → Puerto $PORT directamente"
echo

echo "[1/4] Deshabilitando nginx para este dominio..."
# Eliminar configuraciones de nginx que interfieran
sudo rm -f /etc/nginx/sites-enabled/cheques.axiomacloud.com 2>/dev/null
sudo rm -f /etc/nginx/sites-available/cheques.axiomacloud.com 2>/dev/null

# Reiniciar nginx para que no maneje este dominio
sudo systemctl reload nginx 2>/dev/null || true

echo "[2/4] Configurando backend para acceso directo por puerto..."
cd /var/www/ChequesCloud

# Parar proceso actual
pm2 delete chequescloud 2>/dev/null || true

# Configurar variables para acceso directo con puerto
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
      API_URL: 'http://cheques.axiomacloud.com:8085',
      DB_NAME: 'chequescloud',
      DB_USER: 'postgres',
      DB_PASSWORD: 'Q27G4B98',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_DIALECT: 'postgres',
      JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production-123456789',
      JWT_EXPIRES_IN: '7d',
      CORS_ORIGIN: 'http://cheques.axiomacloud.com:8085',
      SESSION_SECRET: 'your-session-secret-change-this-in-production-987654321'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
PM2_EOF

echo "[3/4] Configurando frontend para acceso directo..."
cd frontend
cat > .env.production << 'FRONTEND_EOF'
# Configuración para acceso directo por puerto
VITE_API_BASE_URL=http://cheques.axiomacloud.com:8085/api
VITE_NODE_ENV=production
FRONTEND_EOF

# Recompilar frontend
npm run build -- --mode production
cd ..

echo "[4/4] Iniciando aplicación..."
pm2 start ecosystem.config.js
pm2 save

echo
echo "============================================"
echo "   VERIFICACIÓN"
echo "============================================"

sleep 3

echo "Estado PM2:"
pm2 status | grep chequescloud

echo
echo "Verificando puerto 8085:"
netstat -tlnp | grep :8085 || echo "Puerto 8085 no está escuchando"

echo
echo "Probando acceso local:"
if curl -s "http://localhost:8085/api/health" >/dev/null; then
    echo "✅ Backend responde localmente"
else
    echo "❌ Backend no responde localmente"
fi

echo
echo "Probando acceso por IP:"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "149.50.148.198")
if curl -s "http://$SERVER_IP:8085/api/health" >/dev/null; then
    echo "✅ Backend responde por IP: $SERVER_IP:8085"
else
    echo "❌ Backend no responde por IP: $SERVER_IP:8085"
fi

echo
echo "============================================"
echo "   CONFIGURACIÓN COMPLETADA"
echo "============================================"
echo
echo "🌐 URLs DE ACCESO:"
echo "   • Por dominio: http://cheques.axiomacloud.com:8085"
echo "   • Por IP: http://$SERVER_IP:8085"
echo "   • API: http://cheques.axiomacloud.com:8085/api"
echo "   • Health: http://cheques.axiomacloud.com:8085/api/health"
echo
echo "🔧 VERIFICAR:"
echo "1. DNS: dig cheques.axiomacloud.com (debe mostrar $SERVER_IP)"
echo "2. Firewall: ufw status (puerto 8085 debe estar abierto)"
echo "3. Navegador: http://cheques.axiomacloud.com:8085"
echo
echo "🔍 COMANDOS DE DEBUG:"
echo "   pm2 logs chequescloud"
echo "   curl -v http://cheques.axiomacloud.com:8085"
echo "   netstat -tlnp | grep 8085"
echo "============================================"
