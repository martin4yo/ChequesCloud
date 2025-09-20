#!/bin/bash

echo "============================================"
echo "   CORRIGIENDO CONFIGURACIÓN NGINX"
echo "   Para servir ChequesCloud correctamente"
echo "============================================"
echo

DOMAIN="cheques.axiomacloud.com"

echo "[1/6] Verificando configuraciones de nginx actuales..."
echo "Sitios habilitados:"
ls -la /etc/nginx/sites-enabled/

echo
echo "[2/6] Respaldando configuración actual..."
sudo cp -r /etc/nginx/sites-available /etc/nginx/sites-available.backup.$(date +%s)

echo "[3/6] Deshabilitando configuraciones conflictivas..."
# Deshabilitar temporalmente otros sitios que puedan interferir
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null
sudo rm -f /etc/nginx/sites-enabled/caeweb* 2>/dev/null

echo "[4/6] Creando nueva configuración para ChequesCloud..."
sudo cat > /etc/nginx/sites-available/$DOMAIN << 'NGINX_EOF'
server {
    listen 80;
    server_name cheques.axiomacloud.com;
    
    # Redirección a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cheques.axiomacloud.com;

    # Certificados SSL (ajustar si la ruta es diferente)
    ssl_certificate /etc/letsencrypt/live/cheques.axiomacloud.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cheques.axiomacloud.com/privkey.pem;
    
    # Configuración SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers off;

    # Headers de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Proxy a ChequesCloud en puerto 8085
    location / {
        proxy_pass http://127.0.0.1:8085;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Configuración específica para la API
    location /api/ {
        proxy_pass http://127.0.0.1:8085/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Logs específicos para ChequesCloud
    access_log /var/log/nginx/chequescloud.access.log;
    error_log /var/log/nginx/chequescloud.error.log;
}
NGINX_EOF

echo "[5/6] Activando configuración de ChequesCloud..."
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

echo "Verificando configuración de nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración válida"
    
    echo "[6/6] Reiniciando nginx..."
    sudo systemctl reload nginx
    
    echo
    echo "============================================"
    echo "   VERIFICACIÓN"
    echo "============================================"
    
    sleep 2
    
    echo "Probando redirección HTTP → HTTPS:"
    curl -I http://$DOMAIN | head -2
    
    echo
    echo "Probando HTTPS (debe mostrar ChequesCloud, no CAEWeb):"
    curl -s https://$DOMAIN | grep -o "<title>[^<]*</title>" || echo "No se pudo obtener título"
    
    echo
    echo "Probando API:"
    curl -s https://$DOMAIN/api/health || echo "API no responde"
    
    echo
    echo "============================================"
    echo "   CONFIGURACIÓN CORREGIDA"
    echo "============================================"
    echo
    echo "🌐 ChequesCloud debería estar disponible en:"
    echo "   https://$DOMAIN"
    echo
    echo "Si todavía muestra CAEWeb, verificar:"
    echo "1. Que ChequesCloud esté corriendo: pm2 status"
    echo "2. Que responda localmente: curl http://localhost:8085"
    echo "3. Los logs: pm2 logs chequescloud"
    
else
    echo "❌ Error en configuración de nginx"
    echo "Revisar el archivo manualmente:"
    echo "sudo nano /etc/nginx/sites-available/$DOMAIN"
fi

echo
echo "🔍 Configuraciones de nginx activas:"
ls -la /etc/nginx/sites-enabled/
echo "============================================"
