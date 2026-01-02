#!/bin/bash
# install_prusa.sh
# Script para instalar PrusaSlicer en VPS Ubuntu/Debian (Headless)

# Colores
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}--- Iniciando Instalación de PrusaSlicer CLI ---${NC}"

# 1. Instalar dependencias del sistema
echo "Instalando librerías gráficas y xvfb..."
sudo apt-get update
sudo apt-get install -y xvfb libfuse2 libglu1-mesa libgtk-3-0 curl wget

# 2. Preparar directorio
TARGET_DIR="/home/mechatro/slicer"
echo "Creando directorio en $TARGET_DIR..."
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

# 3. Descargar AppImage (Versión 2.7.4 Estable)
echo "Descargando PrusaSlicer..."
wget -O prusa-slicer https://github.com/prusa3d/PrusaSlicer/releases/download/version_2.7.4/PrusaSlicer-2.7.4+linux-x64-GTK3-202404050934.AppImage

# 4. Permisos
echo "Asignando permisos de ejecución..."
chmod +x prusa-slicer

# 5. Descargar Configuración Base (Ejemplo)
# Si slice.php no provee config, usaremos esta por defecto
# echo "Creando config.ini base..."
# touch config.ini

# 6. Prueba
echo "Verificando ejecución (esto puede tardar unos segundos)..."
VERSION=$(xvfb-run -a ./prusa-slicer --version)

if [[ $VERSION == *"PrusaSlicer"* ]]; then
    echo -e "${GREEN}SUCCESS! PrusaSlicer instalado correctamente.${NC}"
    echo "Versión detectada: $VERSION"
    echo "Ruta ejecutable: $TARGET_DIR/prusa-slicer"
else
    echo "ERROR: No se pudo ejecutar PrusaSlicer. Revisa los logs."
    exit 1
fi
