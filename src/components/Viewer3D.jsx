import React, { useEffect, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { calculateGeometryData } from '../utils/geometryUtils';
import * as THREE from 'three';

const Model = ({ url, color, onLoaded }) => {
    const geometry = useLoader(STLLoader, url);

    useEffect(() => {
        if (geometry) {
            // Respetar orientación original pero ajustar posición
            geometry.computeBoundingBox();
            const box = geometry.boundingBox;
            const center = new THREE.Vector3();
            box.getCenter(center);

            // Centrar en X y Z, pero bajar hasta que la parte más baja toque Y=0
            // Esto mantiene la orientación pero apoya el modelo en la cama
            geometry.translate(-center.x, -box.min.y, -center.z);

            onLoaded(geometry);
        }
    }, [geometry, onLoaded]);

    return (
        <mesh geometry={geometry} castShadow receiveShadow position={[0, 0, 0]}>
            <meshStandardMaterial
                color={color}
                roughness={0.3}
                metalness={0.2}
            />
        </mesh>
    );
};

// Cama de impresión (Plano con cuadrícula)
const PrintBed = ({ size = 235 }) => {
    return (
        <group>
            {/* Superficie de la cama */}
            <mesh receiveShadow position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[size, size]} />
                <meshStandardMaterial
                    color="#1a1a1a"
                    roughness={0.8}
                    metalness={0.1}
                />
            </mesh>

            {/* Cuadrícula visible en la cama */}
            <Grid
                position={[0, -0.4, 0]}
                args={[size, size]}
                cellSize={10}
                cellThickness={0.5}
                cellColor="#444444"
                sectionSize={50}
                sectionThickness={1}
                sectionColor="#666666"
                fadeDistance={400}
                fadeStrength={1}
                infiniteGrid={false}
            />
        </group>
    );
};

export const Viewer3D = ({ fileUrl, colorHex, onGeometryLoaded }) => {

    const handleGeometryLoaded = useMemo(() => {
        return (geo) => {
            const data = calculateGeometryData(geo);
            onGeometryLoaded(data);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="w-full h-full bg-gradient-to-b from-slate-100 to-slate-200 relative">

            <Canvas
                shadows
                camera={{ position: [150, 120, 150], fov: 45 }}
                dpr={[1, 2]}
            >
                {/* Iluminación mejorada para realismo */}
                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[50, 100, 50]}
                    intensity={0.8}
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-camera-far={500}
                    shadow-camera-left={-200}
                    shadow-camera-right={200}
                    shadow-camera-top={200}
                    shadow-camera-bottom={-200}
                />
                <pointLight position={[-50, 50, -50]} intensity={0.3} />

                <React.Suspense fallback={null}>
                    {/* Cama de impresión */}
                    <PrintBed size={235} />

                    {/* Modelo 3D */}
                    {fileUrl && (
                        <Model url={fileUrl} color={colorHex} onLoaded={handleGeometryLoaded} />
                    )}
                </React.Suspense>

                <OrbitControls
                    makeDefault
                    autoRotate
                    autoRotateSpeed={0.5}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2.2}
                    enablePan={true}
                    target={[0, 50, 0]}
                />
            </Canvas>

            {/* Badge interactivo */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none opacity-50">
                <div className="flex items-center gap-2 text-slate-600 text-xs tracking-widest uppercase font-bold">
                    <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    Vista de Impresión
                </div>
            </div>
        </div>
    );
};

export default Viewer3D;
