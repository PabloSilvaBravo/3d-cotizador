import React, { useEffect, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';

const Model = ({ url, color, onLoaded }) => {
    const geometry = useLoader(STLLoader, url);

    useEffect(() => {
        if (geometry) {
            // Calcular bounding box
            geometry.computeBoundingBox();
            const box = geometry.boundingBox;
            const center = new THREE.Vector3();
            box.getCenter(center);

            // Centrar en X y Z, y bajar hasta que la parte más baja toque Y=0
            // IMPORTANTE: NO rotamos, solo trasladamos para centrar y apoyar en cama
            // Esto respeta si el STL está parado, acostado, volteado, etc.
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
                    color="#C8C8C8"
                    roughness={0.5}
                    metalness={0.4}
                />
            </mesh>

            {/* Cuadrícula visible en la cama - MÁS OSCURA */}
            <Grid
                position={[0, -0.4, 0]}
                args={[size, size]}
                cellSize={10}
                cellThickness={0.6}
                cellColor="#555555"
                sectionSize={50}
                sectionThickness={1.2}
                sectionColor="#333333"
                fadeDistance={400}
                fadeStrength={1}
                infiniteGrid={false}
            />

            {/* Flechas de ejes: X (rojo), Y (verde), Z (azul) */}
            <primitive object={new THREE.AxesHelper(80)} position={[0, 0, 0]} />
        </group>
    );
};

export const Viewer3D = ({ fileUrl, colorHex, onGeometryLoaded }) => {
    const [rotation, setRotation] = React.useState([0, 0, 0]); // [X, Y, Z]
    const [position, setPosition] = React.useState([0, 0, 0]); // Ajuste dinámico
    const meshRef = React.useRef();

    const handleGeometryLoaded = useMemo(() => {
        return (geo) => {
            // Pasar la geometría cruda al padre para cálculos avanzados (volumen, orientación)
            onGeometryLoaded(geo);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rotateModel = (axis) => {
        setRotation(prev => {
            const newRotation = [...prev];
            newRotation[axis] += Math.PI / 2; // 90 grados
            return newRotation;
        });
    };

    const resetRotation = () => {
        setRotation([0, 0, 0]);
    };

    // Recalcular posición después de rotar
    React.useEffect(() => {
        if (meshRef.current) {
            // Esperar un frame para que la rotación se aplique
            setTimeout(() => {
                const mesh = meshRef.current;
                const box = new THREE.Box3().setFromObject(mesh);
                const minY = box.min.y;

                // Ajustar Y para que la parte más baja toque la cama
                setPosition([0, -minY, 0]);
            }, 50);
        }
    }, [rotation]);

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

                    {/* Modelo 3D con rotación controlada */}
                    {fileUrl && (
                        <group ref={meshRef} rotation={rotation} position={position}>
                            <Model url={fileUrl} color={colorHex} onLoaded={handleGeometryLoaded} />
                        </group>
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

            {/* Controles de Rotación */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-3 space-y-2">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 text-center">
                    Rotar Modelo
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => rotateModel(0)}
                        className="p-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-lg transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-1"
                        title="Rotar en X (90°)"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-[10px] font-semibold">X</span>
                    </button>
                    <button
                        onClick={() => rotateModel(1)}
                        className="p-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-lg transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-1"
                        title="Rotar en Y (90°)"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-[10px] font-semibold">Y</span>
                    </button>
                    <button
                        onClick={() => rotateModel(2)}
                        className="p-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-lg transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-1"
                        title="Rotar en Z (90°)"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-[10px] font-semibold">Z</span>
                    </button>
                </div>
                <button
                    onClick={resetRotation}
                    className="w-full p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all text-xs font-semibold"
                >
                    Resetear
                </button>
            </div>

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
