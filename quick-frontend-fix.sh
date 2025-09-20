#!/bin/bash

echo "============================================"
echo "   SOLUCIÓN RÁPIDA FRONTEND"
echo "============================================"

cd /var/www/ChequesCloud/frontend

echo "1. Restaurando vite.config.ts original..."
if [ -f "vite.config.ts.backup" ]; then
    cp vite.config.ts.backup vite.config.ts
    echo "✅ Configuración original restaurada"
else
    echo "No hay backup, creando configuración mínima..."
    cat > vite.config.ts << 'MIN_VITE_EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
MIN_VITE_EOF
fi

echo "2. Asegurando configuración HTTP en .env.production..."
cat > .env.production << 'ENV_EOF'
VITE_API_BASE_URL=http://149.50.148.198:8085/api
VITE_NODE_ENV=production
ENV_EOF

echo "3. Instalando dependencias..."
npm install

echo "4. Compilando..."
npm run build -- --mode production

if [ $? -eq 0 ]; then
    echo "✅ Compilación exitosa"
    
    # Verificar que los archivos estén bien
    echo "Archivos generados:"
    ls -la dist/assets/
    
    cd ..
    echo "5. Reiniciando backend..."
    pm2 restart chequescloud
    
    echo
    echo "============================================"
    echo "   FRONTEND CORREGIDO"
    echo "============================================"
    echo "Probar: http://149.50.148.198:8085"
else
    echo "❌ Error en compilación. Ver detalles arriba."
fi
