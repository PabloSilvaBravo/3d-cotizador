import React, { useEffect, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';

const Model = ({ url, color, onLoaded }) => {
    const geometry = useLoader(STLLoader, url);

    useEffect(() => {
        if (geometry) {
            // CENTRADO PERFECTO:
            // Centramos la geometría en (0,0,0).
            // Esto asegura que al rotar, el objeto gire sobre su propio eje sin desplazarse.
            // La lógica del padre (Viewer3D) se encargará de "levantarlo" para que toque el piso.
            geometry.center();

            onLoaded(geometry);
        }
    }, [geometry, onLoaded]);

    return (
        // CORRECCIÓN VISUAL: STL usa Z-Up, Three.js usa Y-Up.
        // Rotamos -90° en X para que lo que es "Arriba" en el archivo (Z) sea "Arriba" en la pantalla (Y).
        // Esto hace que la visual coincida con PrusaSlicer.
        <mesh geometry={geometry} castShadow receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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

export const Viewer3D = ({ fileUrl, colorHex, onGeometryLoaded, rotation = [0, 0, 0], scale = 1.0 }) => {
    const [position, setPosition] = React.useState([0, 0, 0]); // Ajuste dinámico
    const meshRef = React.useRef();

    const geometryRef = React.useRef(null);

    const handleGeometryLoaded = useMemo(() => {
        return (geo) => {
            // Guardamos referencia local para cálculos
            geometryRef.current = geo;
            // Pasar la geometría cruda al padre
            onGeometryLoaded(geo);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);



    // POSICIONAMIENTO DETERMINISTA
    // Como rotamos visualmente -90° en X, la altura visual corresponde al eje Z de la geometría original.
    // Al usar geometry.center(), el objeto está centrado en (0,0,0).
    // El punto más bajo del objeto es box.min.z (en el espacio local del archivo).
    // Para que toque el suelo (Y=0 world), debemos subirlo esa cantidad escalada.
    React.useEffect(() => {
        if (!geometryRef.current) return;

        const geometry = geometryRef.current;
        if (!geometry.boundingBox) geometry.computeBoundingBox();

        // Obtenemos la distancia desde el centro (0) hasta el punto más bajo en Z
        const zBottom = geometry.boundingBox.min.z;

        // Calculamos el offset necesario: invertir la posición negativa y escalar
        // Ejemplo: Si min.z es -10, necesitamos subirlo +10 * escala.
        const yOffset = -zBottom * scale;

        setPosition([0, yOffset, 0]);

    }, [rotation, fileUrl, scale]);

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
                    {/* Cama de impresión (350x350 visual para cubrir 350x320) */}
                    <PrintBed size={350} />

                    {/* Modelo 3D con rotación controlada */}
                    {fileUrl && (
                        <group ref={meshRef} rotation={rotation} scale={[scale, scale, scale]} position={position}>
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
