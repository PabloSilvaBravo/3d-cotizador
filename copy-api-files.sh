#!/bin/bash
# Script para copiar archivos PHP de Drive a /api/

echo "📦 Copiando archivos PHP de Drive a /api/..."

# Crear carpeta api si no existe
mkdir -p /var/www/3d.mechatronicstore.cl/api

# Copiar archivos PHP
cp src/components/paquete_drive/api/*.php /var/www/3d.mechatronicstore.cl/api/

# Copiar client_secret.json (si existe, sino habrá que subirlo manual)
if [ -f "src/components/paquete_drive/api/client_secret.json" ]; then
    cp src/components/paquete_drive/api/client_secret.json /var/www/3d.mechatronicstore.cl/api/
    echo "✅ client_secret.json copiado"
else
    echo "⚠️  client_secret.json NO encontrado - debes subirlo manualmente"
fi

# Configurar permisos
chmod 755 /var/www/3d.mechatronicstore.cl/api/*.php
chown www-data:www-data /var/www/3d.mechatronicstore.cl/api/ -R

echo "✅ Archivos PHP copiados a /api/"
echo "📝 Recuerda subir client_secret.json si no estaba"
