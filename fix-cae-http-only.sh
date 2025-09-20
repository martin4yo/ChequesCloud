#!/bin/bash

echo "============================================"
echo "   CORRECCIÓN CAE.AXIOMACLOUD.COM"
echo "   Configuración HTTP únicamente"
echo "============================================"
echo

# Verificar que estamos ejecutando como root o con sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script debe ejecutarse como root o con sudo"
    echo "Uso: sudo ./fix-cae-http-only.sh"
    exit 1
fi

echo "[1/4] Creando backup de configuración actual..."
backup_file="/etc/nginx/sites-available/axioma-cae.backup.$(date +%s)"
if [ -f "/etc/nginx/sites-available/axioma-cae" ]; then
    cp /etc/nginx/sites-available/axioma-cae "$backup_file"
    echo "✅ Backup creado: $backup_file"
else
    echo "⚠️  No existe configuración previa de axioma-cae"
fi

echo
echo "[2/4] Aplicando configuración HTTP para cae.axiomacloud.com..."

cat > /etc/nginx/sites-available/axioma-cae << 'NGINX_EOF'
# Configuración HTTP para cae.axiomacloud.com
server {
    listen 80;
    server_name cae.axiomacloud.com;
    root /var/www/axioma-cae/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Headers básicos de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Logs específicos para CAE
    access_log /var/log/nginx/cae.access.log;
    error_log /var/log/nginx/cae.error.log;
}

# Configuración por defecto para acceso por IP
server {
    listen 80 default_server;
    server_name 149.50.148.198 vps-5199621-x.dattaweb.com _;
    root /var/www/axioma-cae/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Logs por defecto
    access_log /var/log/nginx/default.access.log;
    error_log /var/log/nginx/default.error.log;
}
NGINX_EOF

echo "✅ Configuración HTTP aplicada"

echo
echo "[3/4] Verificando configuración de nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuración de nginx válida"
    
    echo
    echo "[4/4] Recargando nginx..."
    systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx recargado exitosamente"
    else
        echo "❌ Error recargando nginx"
        exit 1
    fi
else
    echo "❌ Error en configuración de nginx"
    echo "Revisar con: sudo nginx -t"
    echo "Restaurar backup: sudo cp $backup_file /etc/nginx/sites-available/axioma-cae"
    exit 1
fi

echo
echo "============================================"
echo "   VERIFICACIÓN DE FUNCIONAMIENTO"
echo "============================================"

sleep 2

echo "🌐 Probando CAE (HTTP):"
if curl -s -I http://cae.axiomacloud.com >/dev/null 2>&1; then
    echo "   ✅ http://cae.axiomacloud.com responde"
    title=$(curl -s http://cae.axiomacloud.com | grep -o "<title>[^<]*</title>" 2>/dev/null)
    if [ -n "$title" ]; then
        echo "   📄 Título: $title"
    fi
else
    echo "   ❌ http://cae.axiomacloud.com no responde"
fi

echo
echo "🌐 Probando acceso por IP:"
if curl -s -I http://149.50.148.198 >/dev/null 2>&1; then
    echo "   ✅ http://149.50.148.198 responde"
else
    echo "   ❌ http://149.50.148.198 no responde"
fi

echo
echo "🔍 Verificando ChequesCloud (no debe verse afectado):"
if curl -s -I https://cheques.axiomacloud.com >/dev/null 2>&1; then
    echo "   ✅ https://cheques.axiomacloud.com sigue funcionando"
    cheques_title=$(curl -s https://cheques.axiomacloud.com | grep -o "<title>[^<]*</title>" 2>/dev/null)
    if [ -n "$cheques_title" ]; then
        echo "   📄 Título: $cheques_title"
    fi
else
    echo "   ⚠️  https://cheques.axiomacloud.com no responde"
fi

echo
echo "============================================"
echo "   CONFIGURACIÓN COMPLETADA"
echo "============================================"
echo
echo "📱 URLs disponibles:"
echo "   • CAE: http://cae.axiomacloud.com"
echo "   • Por IP: http://149.50.148.198"
echo "   • ChequesCloud: https://cheques.axiomacloud.com"
echo
echo "📁 Archivos de configuración:"
echo "   • Configuración: /etc/nginx/sites-available/axioma-cae"
echo "   • Backup: $backup_file"
echo "   • Logs CAE: /var/log/nginx/cae.access.log"
echo
echo "🔧 Comandos útiles:"
echo "   sudo nginx -t                    # Verificar configuración"
echo "   sudo systemctl reload nginx     # Recargar nginx"
echo "   sudo tail -f /var/log/nginx/cae.access.log  # Ver logs"
echo
echo "✅ Script completado exitosamente"
echo "============================================"
