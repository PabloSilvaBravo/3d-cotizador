# Cotizador 3D - MechatronicStore

Cotizador automático de impresión 3D para MechatronicStore.

**URL:** https://3d.mechatronicstore.cl

## Estructura del Proyecto

```
3d-cotizador/
├── public/          # Archivos públicos (HTML, CSS, JS, assets)
│   └── index.html   # Página principal
├── src/             # Código fuente (si usas PHP u otro backend)
└── README.md
```

## Requisitos

- El servidor está configurado con Apache
- PHP 8.x disponible si lo necesitas
- El dominio ya apunta al servidor (3d.mechatronicstore.cl)

## Deploy

El proyecto usa dos remotes de Git:

1. **origin** - GitHub (para colaboración y backup)
2. **vps** - Servidor de producción (deploy directo)

### Para subir cambios:

```bash
# Subir a GitHub
git push origin main

# Subir a producción
git push vps main
```

### Flujo recomendado:

1. Hacer cambios localmente
2. Commit: `git add . && git commit -m "descripción"`
3. Push a ambos: `git push origin main && git push vps main`

## Configuración inicial (ya hecha)

El DNS en Cloudflare ya está configurado:
- Registro A: `3d` → `147.93.11.63`

## Ideas para el proyecto

- Visor 3D de archivos STL (usar Three.js)
- Calculador de precio basado en volumen/material
- Formulario de cotización
- Galería de trabajos anteriores

## Contacto

Para acceso al servidor o dudas técnicas, contactar a Pablo.
