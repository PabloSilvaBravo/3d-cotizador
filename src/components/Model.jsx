// src/components/Model.jsx
import { useEffect, useRef, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';
import { calculatePrintStats } from '../utils/h2dProfile';

export default function Model({ url, onStatsCalculated }) {
    // Cargar geometría
    const geometry = useLoader(STLLoader, url);
    const meshRef = useRef();

    // Procesar Geometría (Centrado y Cálculos)
    useMemo(() => {
        if (!geometry) return;

        // 1. Centrar geometría internamente
        geometry.center();

        // 2. Calcular Bounding Box para ponerlo sobre el piso
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        const height = box.max.y - box.min.y;

        // Mover hacia arriba la mitad de su altura para que la base quede en Y=0
        geometry.translate(0, height / 2, 0);

        // 3. Ejecutar la "Lógica H2D"
        const stats = calculatePrintStats(geometry);

        // Enviar datos hacia arriba (App.jsx)
        if (onStatsCalculated) {
            onStatsCalculated(stats);
        }

    }, [geometry, onStatsCalculated]);

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            castShadow
            receiveShadow
            rotation={[-Math.PI / 2, 0, 0]} // A veces los STL vienen rotados, ajusta si es necesario, usualmente en threejs Y es up.
        // NOTA: Si usas geometry.translate, el mesh debe estar en [0,0,0]
        >
            {/* Material "Bambu Green/Orange" - Plástico semi-brillante */}
            <meshPhysicalMaterial
                color="#22c55e"      // Color de marca
                roughness={0.5}      // Textura de plástico
                metalness={0.1}
                clearcoat={0.1}      // Un poco de brillo extra
                flatShading={false}  // Suavizado
            />
        </mesh>
    );
}
