#!/bin/bash

echo "============================================"
echo "   CONFIGURACIÓN HTTPS COMPLETA"
echo "   cheques.axiomacloud.com con SSL"
echo "============================================"
echo

# Verificar directorio
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde /var/www/ChequesCloud"
    exit 1
fi

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "149.50.148.198")
DOMAIN="cheques.axiomacloud.com"

echo "🌐 Servidor: $SERVER_IP"
echo "🔗 Dominio: $DOMAIN"
echo

echo "[1/8] Verificando DNS del dominio..."
DNS_IP=$(dig +short $DOMAIN | tail -1)
if [ "$DNS_IP" != "$SERVER_IP" ]; then
    echo "⚠️  ADVERTENCIA: DNS del dominio ($DNS_IP) no apunta a este servidor ($SERVER_IP)"
    echo "   Asegúrate de que el dominio apunte correctamente"
    read -p "¿Continuar de todas formas? (s/N): " continue_anyway
    if [[ ! $continue_anyway =~ ^[Ss]$ ]]; then
        echo "Cancelado. Configura primero el DNS."
        exit 1
    fi
fi

echo "[2/8] Instalando certbot si no existe..."
if ! command -v certbot >/dev/null 2>&1; then
    echo "Instalando certbot..."
    if command -v apt >/dev/null 2>&1; then
        # Ubuntu/Debian
        apt update
        apt install snapd -y
        snap install core; snap refresh core
        snap install --classic certbot
        ln -sf /snap/bin/certbot /usr/bin/certbot
    elif command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL
        yum install epel-release -y
        yum install certbot python3-certbot-nginx -y
    else
        echo "❌ No se puede instalar certbot automáticamente"
        echo "Instala certbot manualmente según tu distribución"
        exit 1
    fi
else
    echo "✅ certbot ya está instalado"
fi

echo "[3/8] Instalando nginx si no existe..."
if ! command -v nginx >/dev/null 2>&1; then
    if command -v apt >/dev/null 2>&1; then
        apt install nginx -y
    elif command -v yum >/dev/null 2>&1; then
        yum install nginx -y
    fi
    systemctl enable nginx
    systemctl start nginx
else
    echo "✅ nginx ya está instalado"
fi

echo "[4/8] Configurando nginx para HTTP temporal (para certbot)..."
cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_TEMP_EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    # Para validación de certbot
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Proxy al backend
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
}
NGINX_TEMP_EOF

sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/sites-available/$DOMAIN
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t && systemctl reload nginx

echo "[5/8] Configurando backend para HTTPS..."
pm2 delete chequescloud 2>/dev/null || true

cat > start-chequescloud.sh << 'BACKEND_EOF'
#!/bin/bash

# Variables HTTPS
export NODE_ENV=production
export PORT=8085
export DATABASE_URL="postgresql://postgres:Q27G4B98@localhost:5432/chequescloud?schema=public"
export API_URL="https://DOMAIN_PLACEHOLDER"
export DB_NAME=chequescloud
export DB_USER=postgres
export DB_PASSWORD=Q27G4B98
export DB_HOST=localhost
export DB_PORT=5432
export DB_DIALECT=postgres
export JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-123456789"
export JWT_EXPIRES_IN=7d
export CORS_ORIGIN="https://DOMAIN_PLACEHOLDER"
export SESSION_SECRET="your-session-secret-change-this-in-production-987654321"

cd /var/www/ChequesCloud/backend

echo "=== CONFIGURACIÓN HTTPS ==="
echo "PORT: $PORT"
echo "API_URL: $API_URL"
echo "CORS_ORIGIN: $CORS_ORIGIN"
echo "==========================="

exec node dist/index.js
BACKEND_EOF

sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" start-chequescloud.sh
chmod +x start-chequescloud.sh

echo "[6/8] Configurando frontend para HTTPS..."
cd frontend
cat > .env.production << FRONTEND_EOF
# Configuración HTTPS
VITE_API_BASE_URL=https://$DOMAIN/api
VITE_NODE_ENV=production
FRONTEND_EOF

npm run build -- --mode production
cd ..

echo "[7/8] Iniciando backend..."
pm2 start ecosystem.config.js
pm2 save

echo "[8/8] Obteniendo certificado SSL..."
echo "Esto puede tomar unos minutos..."

# Obtener certificado
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

if [ $? -eq 0 ]; then
    echo "✅ Certificado SSL obtenido exitosamente"
    
    # Verificar configuración final
    echo "Verificando configuración HTTPS..."
    systemctl reload nginx
    
    sleep 5
    
    echo
    echo "============================================"
    echo "   HTTPS CONFIGURADO EXITOSAMENTE"
    echo "============================================"
    echo
    echo "🔒 URL HTTPS: https://$DOMAIN"
    echo "🔧 API HTTPS: https://$DOMAIN/api"
    echo "💚 Health: https://$DOMAIN/api/health"
    echo
    echo "🧪 VERIFICACIÓN:"
    if curl -s "https://$DOMAIN/api/health" >/dev/null; then
        echo "   ✅ HTTPS API responde"
    else
        echo "   ⚠️  HTTPS API no responde (puede tomar unos minutos)"
    fi
    
    if curl -s "https://$DOMAIN/" | grep -q "html"; then
        echo "   ✅ HTTPS Frontend responde"
    else
        echo "   ⚠️  HTTPS Frontend no responde (puede tomar unos minutos)"
    fi
    
    echo
    echo "🔄 RENOVACIÓN AUTOMÁTICA:"
    echo "   Los certificados se renovarán automáticamente"
    echo "   Verificar: certbot renew --dry-run"
    
    echo
    echo "🎉 ¡CONFIGURACIÓN HTTPS COMPLETADA!"
    echo "   Abre: https://$DOMAIN"
    
else
    echo "❌ Error obteniendo certificado SSL"
    echo
    echo "POSIBLES CAUSAS:"
    echo "1. DNS no apunta correctamente al servidor"
    echo "2. Firewall bloquea puerto 80/443"
    echo "3. Otro servicio usa puerto 80"
    echo
    echo "VERIFICACIONES:"
    echo "- dig $DOMAIN (debe mostrar $SERVER_IP)"
    echo "- netstat -tlnp | grep :80"
    echo "- netstat -tlnp | grep :443"
    echo "- ufw status"
    
    # Mostrar configuración HTTP como fallback
    echo
    echo "FALLBACK HTTP:"
    echo "http://$SERVER_IP:8085"
fi

echo "============================================"
