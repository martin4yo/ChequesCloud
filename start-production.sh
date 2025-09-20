#!/bin/bash

echo "============================================"
echo "   Iniciando ChequesCloud en Producción"
echo "   URL: http://149.50.148.198:8085/"
echo "============================================"
echo

# Compilar y ejecutar Backend
echo "[1/4] Compilando backend..."
cd backend
npm run build

# Copiar configuración de producción
echo "[2/4] Configurando entorno de producción..."
cp .env.production .env

# Configurar variables de entorno
echo "[3/4] Configurando variables de entorno..."
export NODE_ENV=production
export PORT=8085
echo "NODE_ENV establecido a: $NODE_ENV"
echo "PORT establecido a: $PORT"

# Compilar Frontend
echo "[4/4] Compilando frontend para producción..."
cd ../frontend
npm run build -- --mode production

echo
echo "============================================"
echo "   ChequesCloud compilado exitosamente!"
echo "============================================"
echo
echo "Para iniciar el servidor ejecuta:"
echo "  cd backend && npm start"
echo
echo "   Backend:  http://149.50.148.198:8085/api"
echo "   Frontend: http://149.50.148.198:8085/"
echo "============================================"
