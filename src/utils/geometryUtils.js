import * as THREE from 'three';

/**
 * Calculates the volume of a BufferGeometry using the signed volume of tetrahedrons method.
 * Returns volume in cubic centimeters (cm³).
 * Assumes the mesh unit is millimeters (standard for STL).
 */
export const calculateGeometryData = (geometry) => {
    // Ensure we have bounding box for dimensions
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;

    const size = new THREE.Vector3();
    box.getSize(size);

    // Volume Calculation
    let volume = 0;

    // We need to access position attribute
    const posAttribute = geometry.attributes.position;
    const p1 = new THREE.Vector3();
    const p2 = new THREE.Vector3();
    const p3 = new THREE.Vector3();

    // Iterate through triangles
    // Signed volume formula: dot(cross(p1, p2), p3) / 6
    if (geometry.index) {
        const indices = geometry.index;
        for (let i = 0; i < indices.count; i += 3) {
            p1.fromBufferAttribute(posAttribute, indices.getX(i));
            p2.fromBufferAttribute(posAttribute, indices.getX(i + 1));
            p3.fromBufferAttribute(posAttribute, indices.getX(i + 2));
            volume += signedVolumeOfTriangle(p1, p2, p3);
        }
    } else {
        // Non-indexed geometry
        for (let i = 0; i < posAttribute.count; i += 3) {
            p1.fromBufferAttribute(posAttribute, i);
            p2.fromBufferAttribute(posAttribute, i + 1);
            p3.fromBufferAttribute(posAttribute, i + 2);
            volume += signedVolumeOfTriangle(p1, p2, p3);
        }
    }

    // Convert mm³ to cm³ (divide by 1000)
    const volumeCm3 = Math.abs(volume) / 1000;

    // Detectar necesidad de soportes
    const needsSupport = checkNeedsSupport(geometry);

    return {
        volumeCm3,
        needsSupport, // Bool
        dimensions: {
            x: size.x,
            y: size.y,
            z: size.z
        },
        boundingBox: size
    };
};

/**
 * Detecta si el modelo necesita soportes analizando normales (Overhangs > 45°)
 */
export const checkNeedsSupport = (geometry) => {
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    const normals = geometry.attributes.normal;

    // Asumimos orientación Z-Up por defecto del STL.
    // Overhang crítico: Normal Z < -0.707 (45 grados hacia abajo)

    let badNormalsCount = 0;
    const total = normals.count;

    // Muestreo para performance (revisar 1 de cada 5 vértices)
    const step = 5;
    let checked = 0;

    for (let i = 0; i < total; i += step) {
        const nz = normals.getZ(i);
        // Si apunta hacia abajo con un ángulo agresivo
        if (nz < -0.707) {
            badNormalsCount++;
        }
        checked++;
    }

    // Si más del 0.5% de la superficie analizada es overhang crítico -> True
    const ratio = badNormalsCount / checked;
    return ratio > 0.005;
};

function signedVolumeOfTriangle(p1, p2, p3) {
    return p1.dot(p2.cross(p3)) / 6.0;
}

/**
 * Calcula la orientación óptima (Heurística: "Lay Flat" / Minimizar altura Z)
 * Intenta rotar el objeto para que su dimensión más pequeña quede en el eje vertical
 * (equivale a maximizar el área de contacto con la cama).
 */
// Retorna orientación neutral (0,0,0) - Modo Raw
export const calculateOptimalOrientation = (geometry) => {
    return {
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        contactArea: 0,
        orientationName: 'Original (Raw)'
    };
};

/**
 * Calcula factor de auto-escalado si el modelo excede dimensiones de cama
 * @param {Object} dimensions - {x, y, z} en mm
 * @param {Number} maxBedSize - Tamaño máximo de cama (default: 320mm para XY)
 * @returns {Object} { needsScaling, scaleFactor, reason }
 */
export const calculateAutoScale = (dimensions, maxBedSize = 320) => {
    const { x, y, z } = dimensions;

    const SAFETY_XY = 320;
    const SAFETY_Z = 325;

    // Verificar si excede
    if (x > SAFETY_XY || y > SAFETY_XY || z > SAFETY_Z) {

        // Calcular ratios
        const ratioX = x / SAFETY_XY;
        const ratioY = y / SAFETY_XY;
        const ratioZ = z / SAFETY_Z;

        // Detectar cuál es el peor eje
        const maxRatio = Math.max(ratioX, ratioY, ratioZ);

        // Calcular factor (con 5% margen)
        const scaleFactor = (1 / maxRatio) * 0.95;

        // --- AQUÍ ESTÁ EL CAMBIO CLAVE EN EL MENSAJE ---
        let reason = '';

        if (maxRatio === ratioX) {
            // Caso Eje X
            reason = `El Ancho (X) mide ${x.toFixed(0)}mm, superando el máximo de ${SAFETY_XY}mm.`;
        } else if (maxRatio === ratioY) {
            // Caso Eje Y
            reason = `El Largo (Y) mide ${y.toFixed(0)}mm, superando el máximo de ${SAFETY_XY}mm.`;
        } else {
            // Caso Eje Z
            reason = `El Alto (Z) mide ${z.toFixed(0)}mm, superando el máximo de ${SAFETY_Z}mm.`;
        }

        return {
            needsScaling: true,
            scaleFactor: Math.round(scaleFactor * 100) / 100,
            reason: reason,
            originalSize: { x, y, z },
            scaledSize: {
                x: Math.round(x * scaleFactor),
                y: Math.round(y * scaleFactor),
                z: Math.round(z * scaleFactor)
            }
        };
    }

    return {
        needsScaling: false,
        scaleFactor: 1.0,
        reason: 'Dimensiones correctas',
        originalSize: { x, y, z }
    };
};