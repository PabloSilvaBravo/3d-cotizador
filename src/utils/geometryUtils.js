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

    return {
        volumeCm3,
        dimensions: {
            x: size.x,
            y: size.y,
            z: size.z
        },
        boundingBox: size
    };
};

function signedVolumeOfTriangle(p1, p2, p3) {
    return p1.dot(p2.cross(p3)) / 6.0;
}

/**
 * Calcula la orientación óptima (Heurística: "Lay Flat" / Minimizar altura Z)
 * Intenta rotar el objeto para que su dimensión más pequeña quede en el eje vertical
 * (equivale a maximizar el área de contacto con la cama).
 */
export const calculateOptimalOrientation = (geometry) => {
    try {
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        const size = new THREE.Vector3();
        box.getSize(size);

        // En Three.js, Y es Arriba. En impresión 3D, queremos minimizar la altura Y.
        // Identificar cuál eje (x, y, z) es el más corto.
        const { x, y, z } = size;
        let rotation = [0, 0, 0];
        let orientationName = 'Original';

        if (x <= y && x <= z) {
            // X es el más corto. Idealmente rotaríamos 90° en Z.
            // PERO: El backend (PrusaSlicer CLI) no soporta rotación en X/Y fiablemente.
            // Para mantener consistencia (lo que ves es lo que se cotiza), deshabilitamos esta optimización.
            // rotation = [0, 0, Math.PI / 2];
            // orientationName = 'Acostado (X-Up) [Deshabilitado]';
            rotation = [0, 0, 0];
            orientationName = 'Original';
        } else if (z <= x && z <= y) {
            // Z es el más corto. Idealmente rotaríamos 90° en X.
            // rotation = [Math.PI / 2, 0, 0];
            // orientationName = 'Acostado (Z-Up) [Deshabilitado]';
            rotation = [0, 0, 0];
            orientationName = 'Original';
        } else {
            // Y ya es el más corto. Mantener.
            rotation = [0, 0, 0];
            orientationName = 'Original (Optimizado)';
        }

        // Calcular area aproximada (xy) resultante
        // Si rotamos Z->Y, el área es XY original? No, es X(oldY).
        // Esto es solo informativo
        const contactArea = 0;

        return {
            rotationX: rotation[0],
            rotationY: rotation[1],
            rotationZ: rotation[2],
            contactArea,
            orientationName
        };
    } catch (error) {
        console.error('Error calculando orientación:', error);
        return {
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            contactArea: 0,
            orientationName: 'Error'
        };
    }
};

/**
 * Calcula factor de auto-escalado si el modelo excede dimensiones de cama
 * @param {Object} dimensions - {x, y, z} en mm
 * @param {Number} maxBedSize - Tamaño máximo de cama (default: 240mm con margen)
 * @returns {Object} { needsScaling, scaleFactor, reason }
 */
export const calculateAutoScale = (dimensions, maxBedSize = 240) => {
    const { x, y, z } = dimensions;

    // Encontrar la dimensión más grande en XY (Z puede ser mayor)
    const maxXY = Math.max(x, y);
    const maxZ = z;

    // Verificar si excede límites
    if (maxXY > maxBedSize || maxZ > 256) {
        // Calcular factor necesario para caber (con margen de seguridad 5%)
        const scaleXY = maxBedSize / maxXY;
        const scaleZ = 256 / maxZ;
        const scaleFactor = Math.min(scaleXY, scaleZ) * 0.95; // 95% para margen

        return {
            needsScaling: true,
            scaleFactor: Math.round(scaleFactor * 100) / 100, // Redondear a 2 decimales
            reason: maxXY > maxBedSize
                ? `Modelo muy ancho (${maxXY.toFixed(0)}mm excede ${maxBedSize}mm)`
                : `Modelo muy alto (${maxZ.toFixed(0)}mm excede 256mm)`,
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
        reason: 'Modelo dentro de dimensiones permitidas',
        originalSize: { x, y, z }
    };
};
