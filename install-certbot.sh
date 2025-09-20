#!/bin/bash

echo "============================================"
echo "   INSTALACIÓN DE CERTBOT PARA SSL"
echo "============================================"
echo

# Detectar distribución
if [ -f /etc/debian_version ]; then
    DISTRO="debian"
elif [ -f /etc/redhat-release ]; then
    DISTRO="redhat"
else
    echo "❌ Distribución no soportada automáticamente"
    echo "Instala certbot manualmente según tu distribución"
    exit 1
fi

echo "Distribución detectada: $DISTRO"
echo

if [ "$DISTRO" = "debian" ]; then
    echo "[1/4] Actualizando repositorios..."
    sudo apt update
    
    echo "[2/4] Instalando snapd..."
    sudo apt install snapd -y
    
    echo "[3/4] Instalando certbot via snap..."
    sudo snap install core; sudo snap refresh core
    sudo snap install --classic certbot
    
    echo "[4/4] Creando enlace simbólico..."
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
    
elif [ "$DISTRO" = "redhat" ]; then
    echo "[1/3] Instalando EPEL repository..."
    sudo yum install epel-release -y
    
    echo "[2/3] Instalando certbot..."
    sudo yum install certbot python3-certbot-nginx -y
    
    echo "[3/3] Habilitando certbot..."
    sudo systemctl enable certbot-renew.timer
fi

echo
echo "✅ Certbot instalado exitosamente"
echo

# Verificar instalación
echo "Verificando instalación..."
certbot --version

echo
echo "============================================"
echo "   CONFIGURAR SSL PARA CHEQUES.AXIOMACLOUD.COM"
echo "============================================"
echo
echo "Para configurar SSL ejecuta:"
echo "sudo certbot --nginx -d cheques.axiomacloud.com"
echo
echo "Para verificar renovación automática:"
echo "sudo certbot renew --dry-run"
echo
echo "Los certificados se renovarán automáticamente"
echo "============================================"
