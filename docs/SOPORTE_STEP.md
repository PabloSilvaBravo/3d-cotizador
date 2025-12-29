# Documentación Técnica: Soporte y Conversión de Archivos STEP (.step / .stp)

Este documento detalla la implementación del soporte para archivos STEP en el Cotizador 3D, explicando el flujo de trabajo híbrido utilizado para garantizar tanto la precisión en la cotización como la visualización en el frontend.

## 🧠 Arquitectura Híbrida

El sistema utiliza un enfoque de **doble flujo** cuando se detecta un archivo STEP:

1.  **Flujo de Precisión (Slicing)**: El archivo STEP original se utiliza directamente para el cálculo de costos y tiempos.
2.  **Flujo de Visualización (Conversión)**: Se genera un archivo STL ligero derivado para ser renderizado en el navegador.

### Diagrama de Flujo

```mermaid
graph TD
    A[Cliente Sube Archivo .STEP] -->|POST /api/quote| B(Backend Server)
    B --> C{Tipo de Archivo?}
    
    C -->|.STEP / .STP| D[Inicia Proceso Paralelo]
    
    subgraph "Backend Processing"
        D -->|Ruta 1: Precisión| E[PrusaSlicer CLI]
        E -->|Input: .step original| F[Generación G-Code]
        F --> G[Análisis de Costos (Peso, Tiempo)]
        
        D -->|Ruta 2: Visualización| H[Conversión STEP -> STL]
        H -->|Comando: --export-stl| I[Archivo .stl Temporal]
        I -->|Cálculo Geométrico| J[Extraer Bounding Box (Oversized Check)]
    end
    
    G --> K[Respuesta JSON]
    I --> K
    J --> K
    
    K -->|Datos Cotización + URL STL| L[Frontend React]
    L -->|Carga URL STL| M[Viewer3D (Three.js)]
```

## 🛠️ Implementación Técnica (`server.js`)

### 1. Detección y Conversión
Cuando el endpoint `/api/quote` recibe un archivo:
- Verifica la extensión (`.step` o `.stp`).
- Si es STEP, invoca la función `convertStepToStl`.

```javascript
// La conversión se realiza usando el CLI de PrusaSlicer
const command = `"${PRUSASLICER_PATH}" --export-stl --output "${stlPath}" "${stepPath}"`;
```

Esta operación es bloqueante (await) pero rápida, asegurando que el STL esté listo antes de responder al cliente.

### 2. Slicing de Alta Fidelidad
A diferencia de otros sistemas que convierten a STL antes de rebanar (perdiendo precisión en curvas), nosotros pasamos el **STEP original** al motor de slicing.

```javascript
// Job de Slicing
jobQueue.push({
    inputPath: stepPath, // <-- USAMOS EL STEP ORIGINAL
    auxStlPath: stlPath, // <-- Referencia al STL auxiliar para validaciones
    // ...
});
```
Esto permite que PrusaSlicer maneje la geometría NURBS nativa, resultando en:
- Superficies más suaves.
- Tiempos de impresión más precisos.
- Menor probabilidad de errores "non-manifold".

### 3. Manejo de Modelos "Oversized" (Fuera de Volumen)
Si PrusaSlicer detecta que el modelo es más grande que el volumen de impresión (325x320x325mm):
1. Captura el error `stderr` ("outside of the print volume").
2. Utiliza la función `getStlBounds` para leer el archivo STL binario (generado en el paso 1) byte a byte.
3. Calcula las dimensiones reales (Bounding Box).
4. Devuelve un flag `{ oversized: true, dimensions: {...} }` en lugar de un error 500.

Esto permite al Frontend mostrar una alerta amigable: *"Tu modelo mide 500mm (Máx 325mm)"*.

## 📦 Configuración
- **Límite de Tamaño**: 100MB (Configurado en Multer).
- **Timeout de Proceso**: 10 Minutos (Para permitir geometrías complejas).
- **Limpieza**: Los archivos `.step` y `.stl` generados se eliminan periódicamente (o al reiniciar) mediante `cleanupOldFiles`.

## ⚠️ Requisitos del Sistema
- **PrusaSlicer Console**: Debe estar instalado y accesible en el PATH o definido en la constante `SLICER_COMMAND`.
- **Memoria**: Se recomienda al menos 4GB de RAM libre para manejar la conversión de archivos >100MB.
