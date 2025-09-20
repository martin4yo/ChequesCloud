#!/bin/bash

echo "============================================"
echo "  DESPLIEGUE CHEQUES.AXIOMACLOUD.COM"
echo "  Ubicación: /var/www/ChequesCloud"
echo "============================================"
echo

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz del proyecto"
    echo "Ubicación esperada: /var/www/ChequesCloud"
    exit 1
fi

echo "[1/8] Actualizando código..."
git pull origin main

echo "[2/8] Instalando dependencias del backend..."
cd backend
npm install

echo "[3/8] Compilando backend..."
npm run build

echo "[4/8] Configurando entorno de producción..."
cp .env.production .env

echo "[5/8] Instalando dependencias del frontend..."
cd ../frontend
npm install

echo "[6/8] Compilando frontend..."
npm run build -- --mode production

echo "[7/8] Configurando Nginx..."
cd ..
sudo cp nginx-cheques.axiomacloud.com.conf /etc/nginx/sites-available/cheques.axiomacloud.com
sudo ln -sf /etc/nginx/sites-available/cheques.axiomacloud.com /etc/nginx/sites-enabled/

# Verificar configuración de Nginx
sudo nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Error en configuración de Nginx"
    exit 1
fi

echo "[8/8] Reiniciando servicios..."

# Reiniciar Nginx
sudo systemctl reload nginx

# Configurar PM2 si no existe
if ! pm2 list | grep -q "chequescloud"; then
    echo "Configurando PM2..."
    
    cat > ecosystem.config.js << 'PM2_EOF'
module.exports = {
  apps: [{
    name: 'chequescloud',
    script: './backend/dist/index.js',
    cwd: '/var/www/ChequesCloud',
    env: {
      NODE_ENV: 'production',
      PORT: 8085
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

    pm2 start ecosystem.config.js
    pm2 save
else
    echo "Reiniciando aplicación..."
    pm2 restart chequescloud
fi

echo
echo "============================================"
echo "   DESPLIEGUE COMPLETADO"
echo "============================================"
echo
echo "🌐 URL: https://cheques.axiomacloud.com"
echo "📊 API: https://cheques.axiomacloud.com/api"
echo "💚 Health: https://cheques.axiomacloud.com/api/health"
echo
echo "VERIFICACIONES:"
echo "1. curl https://cheques.axiomacloud.com/api/health"
echo "2. Abrir https://cheques.axiomacloud.com en navegador"
echo
echo "COMANDOS ÚTILES:"
echo "- pm2 status"
echo "- pm2 logs chequescloud"
echo "- sudo nginx -t"
echo "- sudo systemctl status nginx"
echo
echo "Si es la primera vez, configurar SSL:"
echo "sudo certbot --nginx -d cheques.axiomacloud.com"
echo
