#!/bin/bash
# deploy_api_3d.sh
# Mueve los scripts de Backend al servidor web (Dashboard) y configura permisos.
# Ejecutar con SUDO.

TARGET_DIR="/var/www/dashboard/api/3d"
SOURCE_DIR="$(dirname "$0")" # Directorio donde está este script

echo "--- Desplegando API de Slicing 3D ---"

# 1. Crear directorio destino si no existe
if [ ! -d "$TARGET_DIR" ]; then
    echo "Creando directorio $TARGET_DIR..."
    mkdir -p "$TARGET_DIR"
fi

# 2. Copiar archivos
echo "Copiando achivos PHP/INI..."
cp "$SOURCE_DIR/slice.php" "$TARGET_DIR/"
cp "$SOURCE_DIR/config.ini" "$TARGET_DIR/"

# 3. Permisos de Archivos Web
echo "Ajustando permisos web (www-data)..."
chown -R www-data:www-data "$TARGET_DIR"
chmod +x "$TARGET_DIR/slice.php"

# 4. Configurar carpeta temporal para uploads
TMP_UPLOAD_DIR="/tmp/slicer_uploads"
if [ ! -d "$TMP_UPLOAD_DIR" ]; then
    echo "Creando directorio temporal $TMP_UPLOAD_DIR..."
    mkdir -p "$TMP_UPLOAD_DIR"
fi
echo "Dando permisos 777 a $TMP_UPLOAD_DIR..."
chmod 777 "$TMP_UPLOAD_DIR"

# 5. Verificación Final
echo "--- Verificación ---"
if [ -f "$TARGET_DIR/slice.php" ]; then
    echo "✅ slice.php copiado exitosamente."
else
    echo "❌ ERROR: slice.php no encontrado en destino."
fi

PRUSA_PATH="/home/mechatro/slicer/prusa-slicer"
if [ -f "$PRUSA_PATH" ]; then
    echo "✅ Ejecutable PrusaSlicer detectado."
else
    echo "⚠️ ADVERTENCIA: PrusaSlicer no encontrado en $PRUSA_PATH. Asegúrate de correr install_prusa.sh primero."
fi

echo "--- DESPLIEGUE FINALIZADO ---"
echo "Prueba accediendo a: https://dashboard.mechatronicstore.cl/api/3d/slice.php"
