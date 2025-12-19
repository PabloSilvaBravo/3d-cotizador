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
