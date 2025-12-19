// src/utils/h2dProfile.js
import * as THREE from 'three';

// 1. Cargamos tu perfil H2D (Datos del .ini)
const H2D_CONFIG = {
    // Geometría
    bedSize: { x: 350, y: 320, z: 325 },
    nozzle: 0.4,
    filamentDiameter: 1.75,

    // Alturas
    layerHeight: 0.2,

    // Velocidades (mm/s)
    speeds: {
        perimeter: 400,
        infill: 500,
        travel: 1000,
        solidInfill: 400
    },

    // Material
    density: 1.24, // g/cm3 (PLA/General)

    // Estructura
    perimeters: 2, // Cantidad de paredes
    infillDensity: 0.15, // 15%
};

/**
 * Calcula el volumen de una geometría STL (Mesh)
 * Algoritmo de "Signed Triangle Volume"
 */
export function getGeometryVolume(geometry) {
    let volume = 0;
    const position = geometry.attributes.position;
    const p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), p3 = new THREE.Vector3();

    for (let i = 0; i < position.count; i += 3) {
        p1.fromBufferAttribute(position, i);
        p2.fromBufferAttribute(position, i + 1);
        p3.fromBufferAttribute(position, i + 2);
        // Producto cruzado y punto para volumen de tetraedro
        volume += p1.dot(p2.cross(p3)) / 6.0;
    }
    return Math.abs(volume); // Retornamos mm³
}

/**
 * SIMULADOR DE SLICER (H2D Logic)
 * Estima peso y tiempo basándose en volumen y superficie
 */
export function calculatePrintStats(geometry, materialFactor = 1.0) {
    // 1. Datos Geométricos Base
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    const size = new THREE.Vector3();
    bbox.getSize(size);

    const rawVolumeMm3 = getGeometryVolume(geometry); // Volumen si fuera 100% sólido

    // Si el objeto es más grande que la cama, error
    const fitsInBed =
        size.x <= H2D_CONFIG.bedSize.x &&
        size.y <= H2D_CONFIG.bedSize.y &&
        size.z <= H2D_CONFIG.bedSize.z;

    // 2. Estimación de "Cáscara" vs "Relleno"
    // Aproximación: Superficie * (perímetros * ancho de boquilla)
    // Nota: Three.js no da área de superficie fácil, aproximaremos con volumen.
    // Una heurística común para piezas mecánicas: 40% es pared, 60% es relleno (varía).
    // Para ser más precisos, asumiremos un factor de corrección.

    const shellFactor = 0.4; // 40% del volumen es sólido (paredes/techo/suelo)
    const infillFactor = 0.6; // 60% es estructura interna

    const solidVolume = rawVolumeMm3 * shellFactor;
    const infillVolume = rawVolumeMm3 * infillFactor * H2D_CONFIG.infillDensity;

    const finalVolumeMm3 = solidVolume + infillVolume;

    // 3. Peso (Gramos)
    const weightGrams = (finalVolumeMm3 / 1000) * H2D_CONFIG.density;

    // 4. Tiempo (Estimación basada en Flujo Volumétrico)
    // Velocidad promedio ponderada entre paredes y relleno
    const avgSpeed = (H2D_CONFIG.speeds.perimeter * 0.4) + (H2D_CONFIG.speeds.infill * 0.6);

    // Caudal (mm³/s) = Ancho * Altura * Velocidad
    // Ancho de línea suele ser 1.1x el nozzle
    const lineWidth = H2D_CONFIG.nozzle * 1.125;
    const volumetricFlow = lineWidth * H2D_CONFIG.layerHeight * avgSpeed;

    // Tiempo impresión (segundos) = VolumenImpreso / Caudal
    // Agregamos 20% de overhead por desplazamientos (travel) y aceleraciones
    const printTimeSeconds = (finalVolumeMm3 / volumetricFlow) * 1.2;

    return {
        dimensions: { x: size.x, y: size.y, z: size.z },
        volumeCm3: rawVolumeMm3 / 1000,
        weightGrams: weightGrams,
        printTimeMinutes: printTimeSeconds / 60,
        fitsInBed,
        filamentLength: (finalVolumeMm3 / (Math.PI * Math.pow(H2D_CONFIG.filamentDiameter / 2, 2))) / 10 // en cm aprox
    };
}
