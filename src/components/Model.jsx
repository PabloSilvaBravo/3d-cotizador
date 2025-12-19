// src/components/Model.jsx
import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

export default function Model({ url, onVolumeCalculated }) {
    // Carga asíncrona del STL
    const geometry = useLoader(STLLoader, url);
    const meshRef = useRef();

    // Cálculo de volumen (solo cuando cambia la geometría)
    useMemo(() => {
        if (!geometry) return;

        // Asegurar que tenemos normales y posición
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        geometry.center(); // Centrar en (0,0,0) para que rote bonito

        // Algoritmo de volumen (Producto Mixto de Vectores)
        // Es la forma matemática estándar de obtener el volumen de una malla cerrada
        let vol = 0;
        const pos = geometry.attributes.position;
        const faces = pos.count / 3;
        const p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), p3 = new THREE.Vector3();

        for (let i = 0; i < faces; i++) {
            p1.fromBufferAttribute(pos, i * 3 + 0);
            p2.fromBufferAttribute(pos, i * 3 + 1);
            p3.fromBufferAttribute(pos, i * 3 + 2);
            vol += p1.dot(p2.cross(p3)) / 6.0;
        }

        // Convertir a mm3 positivo
        const volumeMm3 = Math.abs(vol);

        // Notificar al padre (App.jsx)
        if (onVolumeCalculated) {
            onVolumeCalculated(volumeMm3);
        }

    }, [geometry, onVolumeCalculated]);

    return (
        <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
            {/* Material "Físico" Estilo Prusa Slicer (Naranja brillante o Verde Matrix) */}
            <meshStandardMaterial
                color="#22c55e"
                roughness={0.3}
                metalness={0.1}
                flatShading={false}
            />
        </mesh>
    );
}
