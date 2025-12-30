import fs from 'fs';

// ============================================================
// UTILIDADES MATEMÁTICAS
// ============================================================

/**
 * Aplica una matriz de rotación 3x3 a un vector 3D
 */
function applyMatrix3(vector, matrix) {
    const x = vector[0];
    const y = vector[1];
    const z = vector[2];

    return [
        matrix[0] * x + matrix[3] * y + matrix[6] * z,
        matrix[1] * x + matrix[4] * y + matrix[7] * z,
        matrix[2] * x + matrix[5] * y + matrix[8] * z
    ];
}

/**
 * Producto cruz de dos vectores 3D
 */
function cross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

/**
 * Producto punto de dos vectores 3D
 */
function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/**
 * Magnitud de un vector 3D
 */
function magnitude(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/**
 * Normaliza un vector 3D
 */
function normalize(v) {
    const mag = magnitude(v);
    if (mag < 1e-10) return [0, 0, 0];
    return [v[0] / mag, v[1] / mag, v[2] / mag];
}

/**
 * Resta dos vectores 3D
 */
function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/**
 * Calcula el área de un triángulo dados sus 3 vértices
 */
function triangleArea(v1, v2, v3) {
    const edge1 = subtract(v2, v1);
    const edge2 = subtract(v3, v1);
    const crossProduct = cross(edge1, edge2);
    return magnitude(crossProduct) * 0.5;
}

/**
 * Redondea una normal a una precisión fija para poder agrupar
 * normales similares (tolerancia angular ~5.7°)
 */
function quantizeNormal(normal, precision = 100) {
    const n = normalize(normal);
    return `${Math.round(n[0] * precision)},${Math.round(n[1] * precision)},${Math.round(n[2] * precision)}`;
}

/**
 * Crea una matriz de rotación combinada (XYZ)
 * @param {number} x - Rotación en X en radianes
 * @param {number} y - Rotación en Y en radianes
 * @param {number} z - Rotación en Z en radianes
 */
function createRotationMatrix(x, y, z) {
    const c1 = Math.cos(x), s1 = Math.sin(x);
    const c2 = Math.cos(y), s2 = Math.sin(y);
    const c3 = Math.cos(z), s3 = Math.sin(z);

    // Matriz combinada Rz * Ry * Rx
    const m00 = c2 * c3;
    const m01 = c1 * s3 + c3 * s1 * s2;
    const m02 = s1 * s3 - c1 * c3 * s2;
    const m10 = -c2 * s3;
    const m11 = c1 * c3 - s1 * s2 * s3;
    const m12 = c1 * s2 * s3 + c3 * s1;
    const m20 = s2;
    const m21 = -c2 * s1;
    const m22 = c1 * c2;

    return [
        m00, m10, m20,
        m01, m11, m21,
        m02, m12, m22
    ];
}

/**
 * Crea matriz de rotación desde eje-ángulo (Rodrigues)
 */
function axisAngleToMatrix(axis, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const t = 1 - c;
    const x = axis[0], y = axis[1], z = axis[2];

    return [
        t * x * x + c, t * x * y + s * z, t * x * z - s * y,
        t * x * y - s * z, t * y * y + c, t * y * z + s * x,
        t * x * z + s * y, t * y * z - s * x, t * z * z + c
    ];
}

/**
 * Extrae ángulos de Euler XYZ desde una matriz de rotación
 * (compatible con la convención Rz * Ry * Rx usada en createRotationMatrix)
 */
function matrixToEulerXYZ(matrix) {
    const m00 = matrix[0], m10 = matrix[1], m20 = matrix[2];
    const m01 = matrix[3], m11 = matrix[4], m21 = matrix[5];
    const m02 = matrix[6], m12 = matrix[7], m22 = matrix[8];

    let x, y, z;

    // m20 = sin(y)
    if (m20 < 0.99999 && m20 > -0.99999) {
        y = Math.asin(Math.max(-1, Math.min(1, m20)));
        x = Math.atan2(-m21, m22);
        z = Math.atan2(-m10, m00);
    } else {
        // Gimbal lock
        y = m20 > 0 ? Math.PI / 2 : -Math.PI / 2;
        x = Math.atan2(m12, m11);
        z = 0;
    }

    return { x, y, z };
}

/**
 * Calcula la rotación (Euler XYZ) para alinear un vector con el eje -Z
 */
function calculateRotationToAlignWithNegativeZ(normal) {
    const n = normalize(normal);
    const target = [0, 0, -1];

    // Si ya está alineado (apunta hacia abajo)
    const dotProduct = dot(n, target);
    if (dotProduct > 0.9999) {
        return { x: 0, y: 0, z: 0 };
    }

    // Si apunta exactamente hacia arriba (+Z), rotar 180° en X
    if (dotProduct < -0.9999) {
        return { x: Math.PI, y: 0, z: 0 };
    }

    // Caso general: calcular eje y ángulo de rotación
    const axis = normalize(cross(n, target));
    const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

    // Convertir eje-ángulo a matriz, luego a Euler
    const matrix = axisAngleToMatrix(axis, angle);
    return matrixToEulerXYZ(matrix);
}

// ============================================================
// ANÁLISIS DE STL
// ============================================================

/**
 * Analiza un buffer STL binario y retorna información de superficies
 */
function analyzeSTLSurfaces(buffer) {
    if (buffer.length < 84) {
        throw new Error('Archivo STL demasiado pequeño o inválido');
    }

    const triangleCount = buffer.readUInt32LE(80);
    const surfaces = new Map(); // key: normal cuantizada, value: { normal: [x,y,z], totalArea: number }

    let offset = 84;
    for (let i = 0; i < triangleCount; i++) {
        // Leer normal
        const nx = buffer.readFloatLE(offset);
        const ny = buffer.readFloatLE(offset + 4);
        const nz = buffer.readFloatLE(offset + 8);
        const normal = [nx, ny, nz];

        // Leer vértices
        const v1 = [
            buffer.readFloatLE(offset + 12),
            buffer.readFloatLE(offset + 16),
            buffer.readFloatLE(offset + 20)
        ];
        const v2 = [
            buffer.readFloatLE(offset + 24),
            buffer.readFloatLE(offset + 28),
            buffer.readFloatLE(offset + 32)
        ];
        const v3 = [
            buffer.readFloatLE(offset + 36),
            buffer.readFloatLE(offset + 40),
            buffer.readFloatLE(offset + 44)
        ];

        // Calcular área del triángulo
        const area = triangleArea(v1, v2, v3);

        // Agrupar por normal similar
        const key = quantizeNormal(normal);

        if (surfaces.has(key)) {
            const surface = surfaces.get(key);
            surface.totalArea += area;
            // Actualizar normal promedio ponderada por área
            surface.normal[0] += normal[0] * area;
            surface.normal[1] += normal[1] * area;
            surface.normal[2] += normal[2] * area;
        } else {
            surfaces.set(key, {
                normal: [normal[0] * area, normal[1] * area, normal[2] * area],
                totalArea: area
            });
        }

        offset += 50;
    }

    // Normalizar las normales promedio
    for (const surface of surfaces.values()) {
        surface.normal = normalize(surface.normal);
    }

    return surfaces;
}

/**
 * Encuentra la superficie con mayor área total
 */
function findLargestSurface(surfaces) {
    let largest = null;
    let maxArea = 0;

    for (const surface of surfaces.values()) {
        if (surface.totalArea > maxArea) {
            maxArea = surface.totalArea;
            largest = surface;
        }
    }

    return largest;
}

// ============================================================
// FUNCIONES PRINCIPALES (EXPORTADAS)
// ============================================================

/**
 * Rota un archivo STL binario y lo guarda en una nueva ruta.
 * 
 * @param {string} inputPath - Ruta al archivo STL original
 * @param {string} outputPath - Ruta para guardar el STL rotado
 * @param {number} rotX - Rotación X en radianes
 * @param {number} rotY - Rotación Y en radianes
 * @param {number} rotZ - Rotación Z en radianes
 * @returns {Promise<void>}
 */
export async function rotateSTL(inputPath, outputPath, rotX, rotY, rotZ) {
    return new Promise((resolve, reject) => {
        try {
            const buffer = fs.readFileSync(inputPath);

            if (buffer.length < 84) {
                return reject(new Error('Archivo STL demasiado pequeño o inválido'));
            }

            const triangleCount = buffer.readUInt32LE(80);
            const matrix = createRotationMatrix(rotX, rotY, rotZ);

            const outputBuffer = Buffer.alloc(buffer.length);
            buffer.copy(outputBuffer, 0, 0, 84);

            let offset = 84;
            for (let i = 0; i < triangleCount; i++) {
                // Rotar Normal
                const nx = buffer.readFloatLE(offset);
                const ny = buffer.readFloatLE(offset + 4);
                const nz = buffer.readFloatLE(offset + 8);
                const rotatedNormal = applyMatrix3([nx, ny, nz], matrix);
                outputBuffer.writeFloatLE(rotatedNormal[0], offset);
                outputBuffer.writeFloatLE(rotatedNormal[1], offset + 4);
                outputBuffer.writeFloatLE(rotatedNormal[2], offset + 8);

                // Rotar Vértice 1
                const v1 = [
                    buffer.readFloatLE(offset + 12),
                    buffer.readFloatLE(offset + 16),
                    buffer.readFloatLE(offset + 20)
                ];
                const rotatedV1 = applyMatrix3(v1, matrix);
                outputBuffer.writeFloatLE(rotatedV1[0], offset + 12);
                outputBuffer.writeFloatLE(rotatedV1[1], offset + 16);
                outputBuffer.writeFloatLE(rotatedV1[2], offset + 20);

                // Rotar Vértice 2
                const v2 = [
                    buffer.readFloatLE(offset + 24),
                    buffer.readFloatLE(offset + 28),
                    buffer.readFloatLE(offset + 32)
                ];
                const rotatedV2 = applyMatrix3(v2, matrix);
                outputBuffer.writeFloatLE(rotatedV2[0], offset + 24);
                outputBuffer.writeFloatLE(rotatedV2[1], offset + 28);
                outputBuffer.writeFloatLE(rotatedV2[2], offset + 32);

                // Rotar Vértice 3
                const v3 = [
                    buffer.readFloatLE(offset + 36),
                    buffer.readFloatLE(offset + 40),
                    buffer.readFloatLE(offset + 44)
                ];
                const rotatedV3 = applyMatrix3(v3, matrix);
                outputBuffer.writeFloatLE(rotatedV3[0], offset + 36);
                outputBuffer.writeFloatLE(rotatedV3[1], offset + 40);
                outputBuffer.writeFloatLE(rotatedV3[2], offset + 44);

                // Copiar Attribute Byte Count
                const attr = buffer.readUInt16LE(offset + 48);
                outputBuffer.writeUInt16LE(attr, offset + 48);

                offset += 50;
            }

            fs.writeFileSync(outputPath, outputBuffer);
            resolve();

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Auto-orienta un STL para impresión 3D.
 * Detecta la superficie plana más grande y la rota para que sea la base.
 * 
 * @param {string} inputPath - Ruta al archivo STL original
 * @param {string} outputPath - Ruta para guardar el STL orientado
 * @returns {Promise<{rotation: {x: number, y: number, z: number}, largestSurfaceArea: number}>}
 */
export async function autoOrientSTL(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        try {
            const buffer = fs.readFileSync(inputPath);

            // Analizar superficies
            const surfaces = analyzeSTLSurfaces(buffer);
            const largest = findLargestSurface(surfaces);

            if (!largest) {
                return reject(new Error('No se encontraron superficies en el STL'));
            }

            // Calcular rotación necesaria
            const rotation = calculateRotationToAlignWithNegativeZ(largest.normal);

            // Si la rotación es mínima, copiar el archivo sin cambios
            const isMinimalRotation =
                Math.abs(rotation.x) < 0.001 &&
                Math.abs(rotation.y) < 0.001 &&
                Math.abs(rotation.z) < 0.001;

            if (isMinimalRotation) {
                fs.copyFileSync(inputPath, outputPath);
                resolve({
                    rotation: { x: 0, y: 0, z: 0 },
                    largestSurfaceArea: largest.totalArea,
                    rotationApplied: false
                });
                return;
            }

            // Aplicar rotación usando la función existente
            rotateSTL(inputPath, outputPath, rotation.x, rotation.y, rotation.z)
                .then(() => {
                    resolve({
                        rotation,
                        largestSurfaceArea: largest.totalArea,
                        rotationApplied: true
                    });
                })
                .catch(reject);

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Obtiene las dimensiones (Bounding Box) de un archivo STL binario
 * @param {string} inputPath - Ruta al archivo STL
 * @returns {Promise<{x: number, y: number, z: number, min: {x:number,y:number,z:number}, max: {x:number,y:number,z:number}}>}
 */
export async function getStlBounds(inputPath) {
    return new Promise((resolve, reject) => {
        try {
            const buffer = fs.readFileSync(inputPath);

            if (buffer.length < 84) {
                return reject(new Error('Archivo STL demasiado pequeño o inválido'));
            }

            const triangleCount = buffer.readUInt32LE(80);

            let minX = Infinity, minY = Infinity, minZ = Infinity;
            let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

            let offset = 84;
            for (let i = 0; i < triangleCount; i++) {
                // Leer 3 vértices (cada uno tiene 3 floats: x, y, z)
                // V1
                const v1x = buffer.readFloatLE(offset + 12);
                const v1y = buffer.readFloatLE(offset + 16);
                const v1z = buffer.readFloatLE(offset + 20);

                // V2
                const v2x = buffer.readFloatLE(offset + 24);
                const v2y = buffer.readFloatLE(offset + 28);
                const v2z = buffer.readFloatLE(offset + 32);

                // V3
                const v3x = buffer.readFloatLE(offset + 36);
                const v3y = buffer.readFloatLE(offset + 40);
                const v3z = buffer.readFloatLE(offset + 44);

                // Actualizar bounds
                minX = Math.min(minX, v1x, v2x, v3x);
                minY = Math.min(minY, v1y, v2y, v3y);
                minZ = Math.min(minZ, v1z, v2z, v3z);

                maxX = Math.max(maxX, v1x, v2x, v3x);
                maxY = Math.max(maxY, v1y, v2y, v3y);
                maxZ = Math.max(maxZ, v1z, v2z, v3z);

                offset += 50;
            }

            const width = maxX - minX;
            const depth = maxY - minY;
            const height = maxZ - minZ;

            resolve({
                x: parseFloat(width.toFixed(2)),
                y: parseFloat(depth.toFixed(2)),
                z: parseFloat(height.toFixed(2)),
                min: { x: minX, y: minY, z: minZ },
                max: { x: maxX, y: maxY, z: maxZ }
            });

        } catch (error) {
            reject(error);
        }
    });
}
