# Script para subir client_secret.json al servidor
# Este archivo NO debe estar en Git, se sube manualmente

# IMPORTANTE: Ejecuta esto desde tu PC local

scp src/components/paquete_drive/api/client_secret.json root@147.93.11.63:/var/www/3d.mechatronicstore.cl/api/

echo "✅ client_secret.json subido al servidor"
echo "Ahora puedes acceder a: https://3d.mechatronicstore.cl/api/setup-drive.php"
