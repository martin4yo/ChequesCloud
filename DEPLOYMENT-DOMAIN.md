# 🚀 Despliegue ChequesCloud - cheques.axiomacloud.com

## 📋 Configuración del Servidor Linux

### 1. Requisitos Previos
```bash
# Instalar Node.js, npm, PostgreSQL, Nginx
sudo apt update
sudo apt install nodejs npm postgresql nginx certbot python3-certbot-nginx

# Verificar versiones
node --version  # v18+
npm --version
psql --version  # v14+
nginx -v
```

### 2. Configurar Base de Datos
```bash
# Acceder a PostgreSQL
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE chequescloud;
CREATE USER postgres WITH ENCRYPTED PASSWORD 'Q27G4B98';
GRANT ALL PRIVILEGES ON DATABASE chequescloud TO postgres;
\q
```

### 3. Clonar y Configurar Aplicación
```bash
# Clonar repositorio
cd /var/www/
sudo git clone [tu-repositorio] ChequesCloud
sudo chown -R $USER:$USER /var/www/ChequesCloud
cd ChequesCloud

# Configurar backend
cd backend
cp .env.production .env
npm install
npm run build

# Configurar frontend
cd ../frontend
npm install
npm run build -- --mode production
```

### 4. Configurar Nginx
```bash
# Copiar configuración
sudo cp nginx-cheques.axiomacloud.com.conf /etc/nginx/sites-available/cheques.axiomacloud.com
sudo ln -s /etc/nginx/sites-available/cheques.axiomacloud.com /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 5. Configurar SSL con Let's Encrypt
```bash
# Obtener certificado SSL
sudo certbot --nginx -d cheques.axiomacloud.com

# Verificar renovación automática
sudo certbot renew --dry-run
```

### 6. Configurar PM2 para Node.js
```bash
# Instalar PM2
sudo npm install -g pm2

# Crear ecosystem.config.js
cd /var/www/ChequesCloud
cat > ecosystem.config.js << 'ECOSYSTEM_EOF'
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
ECOSYSTEM_EOF

# Iniciar aplicación
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Configurar Firewall
```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 8085
sudo ufw enable
```

## 🔧 Comandos de Administración

### Gestión de la Aplicación
```bash
# Ver estado
pm2 status
pm2 logs chequescloud

# Reiniciar
pm2 restart chequescloud

# Actualizar aplicación
cd /var/www/ChequesCloud
git pull origin main
cd backend && npm run build
cd ../frontend && npm run build -- --mode production
pm2 restart chequescloud
```

### Gestión de Nginx
```bash
# Verificar configuración
sudo nginx -t

# Reiniciar
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/cheques.axiomacloud.com.access.log
sudo tail -f /var/log/nginx/cheques.axiomacloud.com.error.log
```

### Gestión de SSL
```bash
# Renovar certificados
sudo certbot renew

# Verificar estado
sudo certbot certificates
```

## 🌐 URLs Finales

- **Aplicación:** https://cheques.axiomacloud.com
- **API:** https://cheques.axiomacloud.com/api
- **Health Check:** https://cheques.axiomacloud.com/api/health

## 🔍 Verificación

1. **DNS:** Verificar que cheques.axiomacloud.com apunte al servidor
2. **Backend:** `curl https://cheques.axiomacloud.com/api/health`
3. **Frontend:** Abrir https://cheques.axiomacloud.com en navegador
4. **SSL:** Verificar certificado válido
5. **Base de datos:** Verificar conexión y datos

## 📊 Monitoreo

```bash
# Logs de aplicación
pm2 logs chequescloud --lines 100

# Logs de Nginx
sudo tail -f /var/log/nginx/cheques.axiomacloud.com.access.log

# Estado del sistema
pm2 monit
htop
```

## 🆘 Troubleshooting

### Error de conexión a base de datos
```bash
# Verificar PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT version();"
```

### Error 502 Bad Gateway
```bash
# Verificar backend
pm2 status
pm2 logs chequescloud

# Verificar puerto
sudo netstat -tlnp | grep 8085
```

### Error de SSL
```bash
# Verificar certificados
sudo certbot certificates
sudo nginx -t
```
