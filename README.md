# Cotizador 3D - MechatronicStore

Cotizador automático de impresión 3D para MechatronicStore.

**URL Producción:** https://3d.mechatronicstore.cl

## Estructura del Proyecto

```
3d-cotizador/
├── public/          # Archivos públicos (HTML, CSS, JS, assets)
│   └── index.html   # Página principal
├── src/             # Código fuente (backend PHP si lo necesitas)
└── README.md
```

## Stack Recomendado

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla o React/Vue)
- **Visualización 3D:** Three.js con STLLoader
- **Backend (opcional):** PHP 8.x
- **Estilos:** Tailwind CSS (recomendado) o CSS propio

## Deploy Automático

El proyecto tiene **deploy automático** al servidor de producción.

### Remotes configurados:

| Remote | Destino | Uso |
|--------|---------|-----|
| `origin` | GitHub | Colaboración y backup |
| `vps` | Servidor producción | Deploy directo |

### Comandos:

```bash
# Subir a GitHub (backup)
git push origin main

# Subir a producción (deploy automático)
git push vps main

# Subir a ambos
git push origin main && git push vps main
```

## Flujo de Trabajo

1. Clonar el repositorio
2. Hacer cambios en `public/`
3. Probar localmente abriendo `public/index.html`
4. Commit: `git add . && git commit -m "descripción"`
5. Push: `git push vps main` (deploy automático)

## Funcionalidades Sugeridas

1. **Upload de archivos STL** - Drag & drop o botón
2. **Visor 3D interactivo** - Rotar, zoom, pan con Three.js
3. **Calculador de precio** - Basado en volumen, material, calidad
4. **Formulario de cotización** - Nombre, email, comentarios
5. **Galería de trabajos** - Portfolio de impresiones

## Recursos Útiles

- [Three.js Docs](https://threejs.org/docs/)
- [STLLoader Example](https://threejs.org/examples/#webgl_loader_stl)
- [Tailwind CSS](https://tailwindcss.com/docs)

## Contacto

Dudas técnicas o acceso al servidor → Pablo
