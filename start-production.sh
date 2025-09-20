#!/bin/bash

# Script para iniciar ChequesCloud en producción
# URL: http://149.50.148.198:8085/

echo "🚀 Iniciando ChequesCloud en modo producción..."
echo "=====================================���========"

# Navegar al directorio del backend
cd backend

# Compilar el backend
echo "📦 Compilando backend..."
npm run build

# Copiar archivo de producción
cp .env.production .env

# Iniciar el backend en background
echo "🔧 Iniciando backend en puerto 8085..."
NODE_ENV=production PORT=8085 npm start &
BACKEND_PID=$!

# Esperar a que el backend inicie
sleep 5

# Navegar al directorio del frontend
cd ../frontend

# Compilar el frontend para producción
echo "📦 Compilando frontend..."
npm run build -- --mode production

# Servir el frontend con un servidor estático
echo "🌐 Sirviendo frontend..."
npx serve -s dist -l 8085 &
FRONTEND_PID=$!

echo "=============================================="
echo "✅ ChequesCloud está corriendo en producción!"
echo "🔗 URL: http://149.50.148.198:8085/"
echo "🔗 API: http://149.50.148.198:8085/api"
echo "=============================================="
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Para detener los servicios:"
echo "kill $BACKEND_PID $FRONTEND_PID"

# Mantener el script corriendo
wait