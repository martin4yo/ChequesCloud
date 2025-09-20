#!/bin/bash

echo "============================================"
echo "   SOLUCIONADOR DE ERRORES SSL/HTTPS"
echo "   Forzando configuración HTTP completa"
echo "============================================"
echo

# Verificar directorio
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde /var/www/ChequesCloud"
    exit 1
fi

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "149.50.148.198")
echo "🌐 IP del servidor: $SERVER_IP"

echo "[1/8] Limpiando configuraciones previas..."
pm2 delete chequescloud 2>/dev/null || true
rm -f start-chequescloud.sh ecosystem.config.js nginx-*.conf 2>/dev/null || true

echo "[2/8] Limpiando caché del frontend..."
cd frontend
rm -rf dist/ node_modules/.vite/ .vite/ 2>/dev/null || true

echo "[3/8] Configurando variables para HTTP estricto..."
cat > .env.production << FRONTEND_EOF
# CONFIGURACIÓN HTTP ESTRICTA
VITE_API_BASE_URL=http://$SERVER_IP:8085/api
VITE_NODE_ENV=production

# Forzar HTTP
VITE_FORCE_HTTP=true
VITE_SSL_DISABLED=true
FRONTEND_EOF

# También crear .env.local para asegurar
cp .env.production .env.local

echo "[4/8] Verificando configuración de Vite..."
# Verificar si existe vite.config.ts y agregar configuración
if [ -f "vite.config.ts" ]; then
    # Backup del archivo original
    cp vite.config.ts vite.config.ts.backup
    
    # Crear nueva configuración que force HTTP
    cat > vite.config.ts << 'VITE_EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    https: false, // Forzar HTTP
  },
  preview: {
    port: 4173,
    host: true,
    https: false, // Forzar HTTP
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  define: {
    // Forzar variables de entorno
    'import.meta.env.VITE_FORCE_HTTP': '"true"',
    'import.meta.env.VITE_SSL_DISABLED': '"true"',
  },
})
VITE_EOF
fi

echo "[5/8] Recompilando frontend con configuración HTTP..."
npm run build -- --mode production --force
if [ $? -ne 0 ]; then
    echo "❌ Error compilando frontend"
    exit 1
fi

echo "[6/8] Configurando backend con CORS permisivo..."
cd ..
cat > start-chequescloud.sh << 'BACKEND_EOF'
#!/bin/bash

# Variables HTTP con CORS muy permisivo
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
export CORS_ORIGIN="*"
export SESSION_SECRET="your-session-secret-change-this-in-production-987654321"

cd /var/www/ChequesCloud/backend

echo "=== BACKEND HTTP CON CORS PERMISIVO ==="
echo "PORT: $PORT"
echo "API_URL: $API_URL"
echo "CORS_ORIGIN: $CORS_ORIGIN (PERMISIVO)"
echo "DATABASE_URL: $DATABASE_URL"
echo "======================================="

exec node dist/index.js
BACKEND_EOF

sed -i "s/SERVER_IP/$SERVER_IP/g" start-chequescloud.sh
chmod +x start-chequescloud.sh

echo "[7/8] Configurando PM2..."
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
    env: {
      NODE_ENV: 'production',
      FORCE_COLOR: '0'
    }
  }]
}
PM2_EOF

echo "[8/8] Iniciando aplicación..."
pm2 start ecosystem.config.js
pm2 save

echo
echo "============================================"
echo "   DIAGNÓSTICO POST-CONFIGURACIÓN"
echo "============================================"
echo

sleep 3

echo "1. Estado PM2:"
pm2 status | grep chequescloud

echo
echo "2. Logs recientes:"
pm2 logs chequescloud --lines 5

echo
echo "3. Probando conectividad:"
echo -n "   Backend API: "
if curl -s "http://localhost:8085/api/health" >/dev/null; then
    echo "✅ OK"
else
    echo "❌ FALLO"
fi

echo -n "   Frontend: "
if curl -s "http://localhost:8085/" | grep -q "html"; then
    echo "✅ OK"
else
    echo "❌ FALLO"
fi

echo
echo "4. Verificando archivos frontend:"
echo "   dist/index.html existe: $([ -f frontend/dist/index.html ] && echo "✅ SÍ" || echo "❌ NO")"
echo "   Assets generados: $(ls frontend/dist/assets/ 2>/dev/null | wc -l) archivos"

echo
echo "============================================"
echo "   CONFIGURACIÓN ANTI-SSL COMPLETADA"
echo "============================================"
echo
echo "📱 PROBAR ESTAS URLs:"
echo "   http://$SERVER_IP:8085"
echo "   http://$SERVER_IP:8085/api/health"
echo
echo "🔧 SI PERSISTEN ERRORES SSL:"
echo "   1. Limpiar caché del navegador (Ctrl+Shift+Del)"
echo "   2. Abrir en modo incógnito"
echo "   3. Probar desde otro navegador"
echo "   4. Usar: curl -v http://$SERVER_IP:8085"
echo
echo "📊 COMANDOS DE DEBUG:"
echo "   pm2 logs chequescloud --lines 20"
echo "   curl -I http://$SERVER_IP:8085"
echo "   curl -v http://$SERVER_IP:8085/api/health"
echo "============================================"
