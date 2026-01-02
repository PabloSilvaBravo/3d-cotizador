# Checklist de Despliegue - 3d.mechatronicstore.cl

## Estado Actual
- ✅ Código desplegado en el servidor
- ❌ Página en blanco (faltan pasos)

## Pasos para Arreglar

### 1. Verificar Estructura de Archivos en Servidor

Conecta por SSH y verifica:
```bash
ssh usuario@147.93.11.63
cd /var/www/3d.mechatronicstore.cl
ls -la
```

Deberías ver:
```
/var/www/3d.mechatronicstore.cl/
├── dist/              # Frontend compilado
│   ├── index.html
│   └── assets/
├── backend/
├── server.js
└── package.json
```

### 2. Instalar Dependencias (si no se hizo)

```bash
cd /var/www/3d.mechatronicstore.cl
npm install --production
```

### 3. Construir el Frontend (si dist/ está vacío)

```bash
npm run build
```

### 4. Configurar NGINX

El archivo de config debería estar en:
`/etc/nginx/sites-available/3d.mechatronicstore.cl`

**Contenido mínimo necesario:**

```nginx
server {
    listen 80;
    server_name 3d.mechatronicstore.cl;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 3d.mechatronicstore.cl;
    
    # SSL config (asumiendo que ya tienes certificado)
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Configuración para archivos grandes (Drive)
    client_max_body_size 100M;
    
    # Servir frontend (React build)
    root /var/www/3d.mechatronicstore.cl/dist;
    index index.html;
    
    # Frontend - SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API - Proxy a Node.js
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Reiniciar nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Iniciar Backend Node.js

Con PM2 (recomendado):
```bash
npm install -g pm2
cd /var/www/3d.mechatronicstore.cl
pm2 start server.js --name cotizador-3d
pm2 save
pm2 startup
```

Verificar que esté corriendo:
```bash
pm2 status
pm2 logs cotizador-3d
```

Sin PM2 (temporal):
```bash
node server.js &
```

### 6. Verificar Logs

**Nginx errors:**
```bash
tail -f /var/log/nginx/error.log
```

**Backend logs:**
```bash
pm2 logs cotizador-3d
```

**Navegador:**
Abre F12 en https://3d.mechatronicstore.cl y revisa:
- Console tab: errores JavaScript
- Network tab: archivos que fallan al cargar

## Problemas Comunes

### Página en blanco
- ✅ Verificar que `dist/index.html` existe
- ✅ Verificar permisos: `chmod -R 755 /var/www/3d.mechatronicstore.cl`
- ✅ Verificar nginx apunta a `root /var/www/3d.mechatronicstore.cl/dist`

### Assets no cargan (404)
- Verificar que `dist/assets/` tiene archivos .js y .css
- Verificar que nginx sirve archivos estáticos correctamente

### Backend no responde
- Verificar: `curl http://localhost:3001/health` (si tienes endpoint de health)
- Ver logs: `pm2 logs cotizador-3d`

### Error 500 en /api/
- Backend no está corriendo
- Error en el código Node.js
- Ver logs para más detalles

## Comandos Rápidos

```bash
# Ver estado de todo
pm2 status
sudo systemctl status nginx

# Reiniciar todo
pm2 restart cotizador-3d
sudo systemctl reload nginx

# Ver logs en tiempo real
pm2 logs cotizador-3d --lines 50
tail -f /var/log/nginx/error.log
```
