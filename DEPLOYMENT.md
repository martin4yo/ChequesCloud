# 📚 Guía de Despliegue a Producción - ChequesCloud

## 🌐 URL de Producción
- **URL Principal:** http://149.50.148.198:8085/
- **API Backend:** http://149.50.148.198:8085/api

## 📋 Requisitos Previos

### Software Requerido:
- Node.js v18+ instalado
- PostgreSQL 14+ instalado y configurado
- Git para clonar el repositorio

### Base de Datos:
- PostgreSQL corriendo en localhost:5432
- Base de datos: `chequescloud`
- Usuario: `postgres`
- Password: `Q27G4B98` (cambiar en producción)

## 🚀 Pasos de Despliegue

### 1. Preparar el Entorno

```bash
# Clonar repositorio (si es necesario)
git clone [tu-repositorio]
cd ChequesCloud

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### 2. Configurar Variables de Entorno

#### Backend (.env.production)
```bash
cd backend
cp .env.production .env
```

Verificar que `.env` contenga:
- `PORT=8085`
- `NODE_ENV=production`
- Credenciales de base de datos correctas
- JWT_SECRET único y seguro

#### Frontend (.env.production)
El frontend ya está configurado con:
- `VITE_API_BASE_URL=http://149.50.148.198:8085/api`

### 3. Preparar la Base de Datos

```bash
cd backend

# Ejecutar migraciones de Prisma
npx prisma migrate deploy

# Generar cliente de Prisma
npx prisma generate
```

### 4. Compilar la Aplicación

#### Opción A: Usar Script Automático (Windows)
```bash
# Desde la raíz del proyecto
start-production.bat
```

#### Opción B: Compilación Manual

**Backend:**
```bash
cd backend
npm run build
```

**Frontend:**
```bash
cd frontend
npm run build -- --mode production
```

### 5. Ejecutar en Producción

#### Desde la raíz del proyecto:
```bash
cd backend
SET NODE_ENV=production
SET PORT=8085
npm start
```

El backend servirá automáticamente:
- API en: http://149.50.148.198:8085/api
- Frontend estático en: http://149.50.148.198:8085/

## 🔧 Configuración Adicional

### Servidor con PM2 (Recomendado)

1. Instalar PM2 globalmente:
```bash
npm install -g pm2
```

2. Crear archivo ecosystem.config.js:
```javascript
module.exports = {
  apps: [{
    name: 'chequescloud',
    script: './backend/dist/index.js',
    env: {
      NODE_ENV: 'production',
      PORT: 8085
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
}
```

3. Iniciar con PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx como Proxy Reverso (Opcional)

Si prefieres usar Nginx:

```nginx
server {
    listen 80;
    server_name 149.50.148.198;

    location / {
        proxy_pass http://localhost:8085;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔍 Verificación

1. **Verificar API:**
   ```
   curl http://149.50.148.198:8085/api/health
   ```

2. **Verificar Frontend:**
   - Abrir navegador en http://149.50.148.198:8085/
   - Debe mostrar la página de login

3. **Verificar Logs:**
   ```bash
   # Si usas PM2
   pm2 logs chequescloud

   # Si ejecutas directamente
   # Los logs aparecen en la consola
   ```

## 🛡️ Seguridad

### Antes de ir a producción:

1. **Cambiar secretos:**
   - JWT_SECRET en .env
   - SESSION_SECRET en .env
   - Contraseña de base de datos

2. **Configurar HTTPS:**
   - Obtener certificado SSL
   - Configurar en Nginx o directamente en Node.js

3. **Configurar Firewall:**
   - Abrir solo puerto 8085 (o 80/443 con Nginx)
   - Restringir acceso a PostgreSQL

4. **Actualizar CORS:**
   - En producción real, especificar dominios permitidos
   - Actualmente está en `origin: true` (acepta todos)

## 📊 Monitoreo

### Comandos útiles:

```bash
# Estado del servicio (PM2)
pm2 status

# Reiniciar servicio
pm2 restart chequescloud

# Ver logs en tiempo real
pm2 logs chequescloud --lines 100

# Monitoreo de recursos
pm2 monit
```

## 🔄 Actualización

Para actualizar la aplicación:

1. Hacer backup de la base de datos
2. Detener el servicio
3. Actualizar código
4. Compilar nuevamente
5. Ejecutar migraciones si hay cambios
6. Reiniciar servicio

```bash
# Backup base de datos
pg_dump -U postgres chequescloud > backup_$(date +%Y%m%d).sql

# Actualizar y reiniciar
pm2 stop chequescloud
git pull origin main
cd backend && npm run build
cd ../frontend && npm run build -- --mode production
pm2 restart chequescloud
```

## 🆘 Troubleshooting

### Problemas comunes:

1. **Error de conexión a base de datos:**
   - Verificar PostgreSQL está corriendo
   - Verificar credenciales en .env
   - Verificar firewall permite conexión

2. **Frontend no carga:**
   - Verificar build del frontend en `frontend/dist`
   - Verificar NODE_ENV=production
   - Revisar logs del backend

3. **CORS errors:**
   - Verificar URL en frontend .env.production
   - Backend CORS configurado con `origin: true`

4. **Puerto en uso:**
   - Cambiar PORT en .env
   - Actualizar todas las referencias al puerto

## 📞 Soporte

Para problemas o consultas sobre el despliegue, revisar:
- Logs del servidor
- Estado de servicios
- Configuración de red

---

**Última actualización:** 2025-09-19
**Versión:** 2.0.0