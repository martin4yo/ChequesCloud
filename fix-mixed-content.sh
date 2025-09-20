#!/bin/bash

echo "============================================"
echo "   SOLUCIONANDO MIXED CONTENT HTTP/HTTPS"
echo "============================================"

cd /var/www/ChequesCloud

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "149.50.148.198")

echo "🔧 Configurando backend con headers de seguridad específicos..."

# Actualizar backend con headers anti-mixed-content
cat > start-chequescloud.sh << 'BACKEND_EOF'
#!/bin/bash

# Variables de entorno HTTP estrictas
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

cd /var/www/ChequesCloud/backend

echo "=== BACKEND ANTI-MIXED-CONTENT ==="
echo "PORT: $PORT"
echo "API_URL: $API_URL"
echo "CORS_ORIGIN: $CORS_ORIGIN"
echo "================================="

exec node dist/index.js
BACKEND_EOF

sed -i "s/SERVER_IP/$SERVER_IP/g" start-chequescloud.sh
chmod +x start-chequescloud.sh

echo "🎨 Configurando frontend con base URL explícita..."
cd frontend

# Configuración frontend con base explícita
cat > .env.production << FRONTEND_EOF
# Configuración HTTP explícita
VITE_API_BASE_URL=http://$SERVER_IP:8085/api
VITE_NODE_ENV=production

# Variables para forzar HTTP
VITE_BASE_URL=http://$SERVER_IP:8085
VITE_FORCE_HTTP=true
FRONTEND_EOF

echo "🔧 Actualizando vite.config.ts con configuración anti-mixed-content..."
cat > vite.config.ts << 'VITE_EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // Base path explícita
  server: {
    https: false,
    port: 5173,
  },
  preview: {
    https: false,
    port: 4173,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  define: {
    __HTTP_ONLY__: true,
  },
})
VITE_EOF

echo "🧹 Limpiando caché y recompilando..."
rm -rf dist/ node_modules/.vite/ .vite/
npm run build -- --mode production

if [ $? -ne 0 ]; then
    echo "❌ Error en compilación, usando configuración mínima..."
    cat > vite.config.ts << 'SIMPLE_EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
})
SIMPLE_EOF
    npm run build -- --mode production
fi

echo "🔍 Verificando archivos generados..."
if [ -f "dist/index.html" ]; then
    echo "✅ index.html generado"
    echo "Contenido del index.html:"
    head -20 dist/index.html | grep -E "(script|link|href|src)"
else
    echo "❌ No se generó index.html"
    exit 1
fi

cd ..

echo "🔄 Reiniciando backend..."
pm2 restart chequescloud

sleep 3

echo "🧪 Probando configuración..."
echo -n "Backend responde: "
if curl -s "http://localhost:8085/api/health" >/dev/null; then
    echo "✅ OK"
else
    echo "❌ FALLO"
fi

echo -n "Frontend HTML: "
if curl -s "http://localhost:8085/" | grep -q "html"; then
    echo "✅ OK"
else
    echo "❌ FALLO"
fi

echo -n "Assets accesibles: "
ASSET_URL=$(curl -s "http://localhost:8085/" | grep -o '/assets/[^"]*\.js' | head -1)
if [ -n "$ASSET_URL" ] && curl -s "http://localhost:8085$ASSET_URL" | grep -q "export\|import\|function"; then
    echo "✅ OK"
else
    echo "❌ FALLO - Asset: $ASSET_URL"
fi

echo
echo "============================================"
echo "   CONFIGURACIÓN ANTI-MIXED-CONTENT LISTA"
echo "============================================"
echo
echo "🌐 PROBAR EN NAVEGADOR (MODO INCÓGNITO):"
echo "   http://$SERVER_IP:8085"
echo
echo "🔧 SI PERSISTEN ERRORES:"
echo "   1. Limpiar TODO el caché del navegador"
echo "   2. Reiniciar el navegador completamente"
echo "   3. Probar en otro navegador"
echo "   4. Verificar que no hay extensiones bloqueando"
echo
echo "📊 COMANDOS DE VERIFICACIÓN:"
echo "   curl -v http://$SERVER_IP:8085"
echo "   curl -v http://$SERVER_IP:8085/api/health"
echo "   pm2 logs chequescloud"
echo "============================================"
