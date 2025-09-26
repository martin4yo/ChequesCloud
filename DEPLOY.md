# 🚀 Deploy Script para Cheques - Linux Production

## 📋 Requisitos Previos

### Sistema:
- Ubuntu/Debian/CentOS Linux
- Node.js >= 18.0.0
- npm >= 8.0.0
- Git
- PostgreSQL corriendo
- PM2 instalado globalmente

### Instalación de dependencias:
```bash
# Node.js y npm (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2

# Git
sudo apt-get install -y git

# PostgreSQL (si no está instalado)
sudo apt-get install -y postgresql postgresql-contrib
```

## 📁 Estructura de Directorios

```
/var/www/cheques/           # Directorio principal
├── backend/                # Código del backend
├── frontend/               # Código del frontend
├── deploy.sh              # Script de deploy
├── ecosystem.config.js    # Configuración PM2 (auto-generado)
└── logs/                  # Logs de la aplicación
```

## 🔧 Configuración Inicial

### 1. Clonar el proyecto:
```bash
cd /var/www
sudo git clone <tu-repositorio> cheques
sudo chown -R $USER:$USER /var/www/cheques
cd cheques
```

### 2. Configurar variables de entorno:
```bash
cd backend
cp .env.example .env
nano .env
```

Configurar las variables necesarias:
```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/cheques?schema=public"

# JWT
JWT_SECRET=tu-super-secreto-jwt-cambiar-en-produccion
JWT_EXPIRES_IN=7d

# Servidor
PORT=8085
NODE_ENV=production

# CORS (ajustar según tu dominio)
CORS_ORIGIN=https://tu-dominio.com
```

### 3. Configurar base de datos:
```bash
# Crear usuario y base de datos en PostgreSQL
sudo -u postgres psql
CREATE DATABASE cheques;
CREATE USER cheques_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE cheques TO cheques_user;
\q
```

## 🚀 Uso del Script de Deploy

### Hacer ejecutable:
```bash
chmod +x deploy.sh
```

### Ejecutar deploy:
```bash
./deploy.sh
```

### Lo que hace el script:

1. **📋 Verificaciones**: Node.js, npm, PM2, git
2. **💾 Backup**: Crea backup de configuración
3. **📥 Git Pull**: Actualiza código (con stash de cambios locales)
4. **🛑 Stop**: Detiene la aplicación actual
5. **🔧 Backend**:
   - Instala dependencias (`npm ci`)
   - Genera cliente Prisma (`npx prisma generate`)
   - Ejecuta migraciones (`npx prisma migrate deploy`)
   - Compila TypeScript (`npm run build`)
6. **🎨 Frontend**:
   - Instala dependencias
   - Build de producción (`npm run build`)
7. **🔄 PM2**: Configura y reinicia la aplicación
8. **🔍 Verificación**: Comprueba que todo esté funcionando

## 📊 Comandos PM2 Útiles

```bash
# Ver estado de aplicaciones
pm2 status

# Ver logs en tiempo real
pm2 logs chequescloud

# Reiniciar aplicación
pm2 restart chequescloud

# Parar aplicación
pm2 stop chequescloud

# Monitor en tiempo real
pm2 monit

# Ver información detallada
pm2 describe chequescloud

# Guardar configuración actual
pm2 save

# Configurar auto-inicio en boot
pm2 startup
```

## 🌐 Configuración de Nginx (Recomendado)

Crear archivo de configuración:
```bash
sudo nano /etc/nginx/sites-available/cheques
```

Contenido:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend estático
    location / {
        root /var/www/cheques/frontend/dist;
        try_files $uri $uri/ /index.html;

        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend
    location /api/ {
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
```

Habilitar sitio:
```bash
sudo ln -s /etc/nginx/sites-available/cheques /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔍 Troubleshooting

### La aplicación no inicia:
```bash
# Ver logs detallados
pm2 logs chequescloud --lines 50

# Verificar configuración
pm2 describe chequescloud

# Revisar puertos
sudo netstat -tlnp | grep 8085
```

### Problemas de base de datos:
```bash
# Ver logs de migraciones
cd /var/www/cheques/backend
npx prisma migrate status

# Resetear migraciones (¡CUIDADO! Borra datos)
# npx prisma migrate reset
```

### Problemas de permisos:
```bash
# Asegurar permisos correctos
sudo chown -R $USER:$USER /var/www/cheques
chmod +x /var/www/cheques/deploy.sh
```

### Build del frontend falla:
```bash
cd /var/www/cheques/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🔒 SSL/HTTPS con Let's Encrypt

```bash
# Instalar certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tu-dominio.com

# Auto-renovación
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📈 Monitoreo y Logs

### Logs de la aplicación:
- **PM2 Logs**: `pm2 logs cheques`
- **App Logs**: `/var/www/cheques/logs/app.log`
- **Error Logs**: `/var/www/cheques/logs/error.log`

### Monitoreo de sistema:
```bash
# CPU y memoria
htop

# Espacio en disco
df -h

# Estado de servicios
sudo systemctl status nginx postgresql
```

## 🔄 Deploy Automático con Git Hooks (Opcional)

Configurar webhook en el servidor:
```bash
# En el repositorio bare
nano hooks/post-receive
```

```bash
#!/bin/bash
cd /var/www/cheques
git --git-dir=.git --work-tree=. checkout -f
./deploy.sh
```

```bash
chmod +x hooks/post-receive
```

---

## 📞 Soporte

Si encuentras problemas durante el deploy:

1. Revisa los logs: `pm2 logs cheques`
2. Verifica la configuración de base de datos en `.env`
3. Asegúrate de que PostgreSQL esté corriendo
4. Revisa los permisos de archivos y directorios