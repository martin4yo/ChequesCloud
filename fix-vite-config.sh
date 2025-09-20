#!/bin/bash

echo "============================================"
echo "   CORRIGIENDO VITE CONFIG"
echo "============================================"

cd /var/www/ChequesCloud/frontend

# Crear vite.config.ts correcto para ES modules
cat > vite.config.ts << 'VITE_EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
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
    // Forzar variables de entorno HTTP
    'import.meta.env.VITE_FORCE_HTTP': '"true"',
    'import.meta.env.VITE_SSL_DISABLED': '"true"',
  },
})
VITE_EOF

echo "✅ vite.config.ts corregido"

# Verificar que las dependencias estén instaladas
echo "Verificando dependencias..."
npm install

# Limpiar y reconstruir
echo "Limpiando dist..."
rm -rf dist/

echo "Compilando frontend..."
npm run build -- --mode production

if [ $? -eq 0 ]; then
    echo "✅ Frontend compilado exitosamente"
    echo "Archivos generados:"
    ls -la dist/
else
    echo "❌ Error en la compilación"
    echo
    echo "Intentando con configuración más simple..."
    
    # Crear configuración mínima sin alias
    cat > vite.config.ts << 'SIMPLE_VITE_EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    https: false,
  },
  preview: {
    https: false,
  },
  build: {
    outDir: 'dist',
  },
})
SIMPLE_VITE_EOF
    
    echo "Reintentando compilación..."
    npm run build -- --mode production
fi

cd ..
echo "============================================"
