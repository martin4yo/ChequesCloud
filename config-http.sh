#!/bin/bash

echo "============================================"
echo "   CONFIGURACIÓN HTTP PARA CHEQUESCLOUD"
echo "   Configurando todo para HTTP temporal"
echo "============================================"
echo

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde /var/www/ChequesCloud"
    exit 1
fi

# Detectar IP del servidor
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "149.50.148.198")
echo "🌐 IP del servidor detectada: $SERVER_IP"
echo

echo "[1/7] Parando servicios actuales..."
pm2 delete chequescloud 2>/dev/null || echo "No hay proceso chequescloud ejecutándose"

echo "[2/7] Configurando backend para HTTP..."
cat > start-chequescloud.sh << 'BACKEND_EOF'
#!/bin/bash

# Variables de entorno HTTP
export NODE_ENV=production
export PORT=8085
export DATABASE_URL="postgresql://postgres:Q27G4B98@localhost:5432/chequescloud?schema=public"
export API_URL="http://SERVER_IP:8085"
export DB_NAME=chequescloud
export DB_USER=postgres
export DB_PASSWORD=Q27G4B98
export DB_HOST=localhost
export DB_PORT=5432
export DB_DIALECT=postgres
export JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-123456789"
export JWT_EXPIRES_IN=7d
export CORS_ORIGIN="http://SERVER_IP:8085"
export SESSION_SECRET="your-session-secret-change-this-in-production-987654321"

# Ir al directorio del backend
cd /var/www/ChequesCloud/backend

echo "=== CONFIGURACIÓN BACKEND HTTP ==="
echo "PORT: $PORT"
echo "API_URL: $API_URL"
echo "CORS_ORIGIN: $CORS_ORIGIN"
echo "DATABASE_URL: $DATABASE_URL"
echo "================================="

# Ejecutar aplicación
exec node dist/index.js
BACKEND_EOF

# Reemplazar SERVER_IP con la IP real
sed -i "s/SERVER_IP/$SERVER_IP/g" start-chequescloud.sh
chmod +x start-chequescloud.sh

echo "[3/7] Configurando frontend para HTTP..."
cd frontend
cat > .env.production << FRONTEND_EOF
# API Configuration for Production (HTTP)
VITE_API_BASE_URL=http://$SERVER_IP:8085/api

# Environment
VITE_NODE_ENV=production
FRONTEND_EOF

echo "[4/7] Compilando frontend..."
npm run build -- --mode production
if [ $? -ne 0 ]; then
    echo "❌ Error compilando frontend"
    exit 1
fi

echo "[5/7] Configurando PM2..."
cd ..
cat > ecosystem.config.js << 'PM2_EOF'
module.exports = {
  apps: [{
    name: 'chequescloud',
    script: './start-chequescloud.sh',
    cwd: '/var/www/ChequesCloud',
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

echo "[6/7] Iniciando aplicación..."
pm2 start ecosystem.config.js
pm2 save

echo "[7/7] Configurando Nginx (opcional)..."
if command -v nginx >/dev/null 2>&1; then
    cat > nginx-http.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name cheques.axiomacloud.com SERVER_IP;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Proxy to Node.js backend
    location / {
        proxy_pass http://localhost:8085;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Logs
    access_log /var/log/nginx/chequescloud-http.access.log;
    error_log /var/log/nginx/chequescloud-http.error.log;
}
NGINX_EOF

    # Reemplazar SERVER_IP
    sed -i "s/SERVER_IP/$SERVER_IP/g" nginx-http.conf
    
    echo "Para activar Nginx ejecuta:"
    echo "  sudo cp nginx-http.conf /etc/nginx/sites-available/chequescloud-http"
    echo "  sudo ln -sf /etc/nginx/sites-available/chequescloud-http /etc/nginx/sites-enabled/"
    echo "  sudo nginx -t && sudo systemctl reload nginx"
else
    echo "Nginx no está instalado, saltando configuración"
fi

echo
echo "============================================"
echo "   CONFIGURACIÓN HTTP COMPLETADA"
echo "============================================"
echo
echo "🚀 VERIFICACIÓN:"
echo "1. Estado de la aplicación:"
pm2 status | grep chequescloud || echo "   ❌ Aplicación no está ejecutándose"

echo
echo "2. Probando conectividad:"
sleep 3
if curl -s "http://localhost:8085/api/health" >/dev/null; then
    echo "   ✅ Backend responde en localhost:8085"
else
    echo "   ❌ Backend no responde"
    echo "   Ver logs: pm2 logs chequescloud"
fi

if curl -s "http://$SERVER_IP:8085/" >/dev/null; then
    echo "   ✅ Frontend accesible en $SERVER_IP:8085"
else
    echo "   ❌ Frontend no accesible desde IP externa"
    echo "   Verificar firewall: ufw status"
fi

echo
echo "📱 URLS DISPONIBLES:"
echo "   • Aplicación: http://$SERVER_IP:8085"
echo "   • API: http://$SERVER_IP:8085/api"
echo "   • Health: http://$SERVER_IP:8085/api/health"
if command -v nginx >/dev/null 2>&1; then
    echo "   • Con dominio: http://cheques.axiomacloud.com (después de configurar Nginx)"
fi

echo
echo "🔧 COMANDOS ÚTILES:"
echo "   pm2 status                    # Ver estado"
echo "   pm2 logs chequescloud         # Ver logs"
echo "   pm2 restart chequescloud      # Reiniciar"
echo "   curl http://$SERVER_IP:8085/api/health  # Probar API"

echo
echo "🔒 PARA CONFIGURAR HTTPS DESPUÉS:"
echo "   ./install-certbot.sh          # Instalar certbot"
echo "   ./config-https.sh             # Configurar HTTPS"

echo
echo "============================================"
