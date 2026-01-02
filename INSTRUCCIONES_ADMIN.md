# ⚠️ REQUIERE ACCESO ROOT AL SERVIDOR

## Problema Actual
nginx redirige **TODO** a React (index.html), incluso `/api/`. Los archivos PHP no se procesan.

## Solución

### 1. Aplicar Nueva Configuración Nginx

```bash
# Conectarse al servidor
ssh root@147.93.11.63

# Editar configuración (o usar el archivo nginx-config.conf de este repo)
sudo nano /etc/nginx/sites-available/3d.mechatronicstore.cl
```

**Contenido que debe tener** (ver `nginx-config.conf`):
- Location `/api/` ANTES que location `/`
- PHP-FPM configurado para procesar .php
- `alias /var/www/3d.mechatronicstore.cl/api/`

### 2. Probar Configuración

```bash
sudo nginx -t
```

Si dice "syntax is ok":

```bash
sudo systemctl reload nginx
```

### 3. Verificar PHP-FPM

```bash
# Ver si PHP-FPM está corriendo
sudo systemctl status php8.1-fpm

# Si no está instalado
sudo apt install php8.1-fpm php8.1-curl php8.1-json
```

### 4. Verificar Archivos en Servidor

```bash
cd /var/www/3d.mechatronicstore.cl
ls -la api/

# Deberías ver:
# setup-drive.php
# test-drive.php
# upload-to-drive.php
```

### 5. Subir client_secret.json

El archivo `client_secret.json` NO está en Git (seguridad).
Debe subirse manualmente:

```bash
# Por SCP desde tu PC
scp api/client_secret.json root@147.93.11.63:/var/www/3d.mechatronicstore.cl/api/

# O crear en el servidor con el contenido correcto
sudo nano /var/www/3d.mechatronicstore.cl/api/client_secret.json
```

### 6. Permisos

```bash
sudo chown -R www-data:www-data /var/www/3d.mechatronicstore.cl/api/
sudo chmod 755 /var/www/3d.mechatronicstore.cl/api/*.php
sudo chmod 600 /var/www/3d.mechatronicstore.cl/api/client_secret.json
```

## Verificación Final

1. **Archivos estáticos:** 
   ```
   https://3d.mechatronicstore.cl/api/test.txt
   ```
   Debería mostrar: "Test file - If you can see this, /api/ folder is working"

2. **PHP:**
   ```
   https://3d.mechatronicstore.cl/api/test-drive.php
   ```
   Debería mostrar página de test de Drive

3. **Setup Drive:**
   ```
   https://3d.mechatronicstore.cl/api/setup-drive.php
   ```
   Debería mostrar botón "CONECTAR CON GOOGLE DRIVE"

## Resumen

**El problema:** nginx catch-all redirige TODO a React.

**La solución:** Configurar `/api/` con prioridad sobre la SPA.

**Quién puede hacerlo:** Alguien con acceso root (SSH completo).
