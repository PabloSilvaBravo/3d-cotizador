import React, { useEffect, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';

const Model = ({ url, color, onLoaded }) => {
    const geometry = useLoader(STLLoader, url);

    useEffect(() => {
        if (geometry) {
            geometry.center(); // Centrado local

            // CRUCIAL: Calcular normales para suavizar la superficie (Smooth Shading)
            // Esto permite ver los detalles curvos sin los "polígonos" duros
            geometry.computeVertexNormals();

            onLoaded(geometry);
        }
    }, [geometry, onLoaded]);

    return (
        <mesh geometry={geometry} castShadow receiveShadow position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshStandardMaterial
                color={color}
                roughness={0.2} // Equilibrio para ver brillos que definen bordes sin ser espejo
                metalness={0.1}
                flatShading={false}
            />
        </mesh>
    );
};

// Cama de impresión (Plano con cuadrícula) - ORIGINAL RESTAURADO
const PrintBed = ({ size = 235 }) => {
    return (
        <group>
            {/* Superficie de la cama */}
            <mesh receiveShadow position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[size, size]} />
                <meshStandardMaterial
                    color="#C8C8C8" // Gris original
                    roughness={0.5}
                    metalness={0.4}
                />
            </mesh>

            {/* Cuadrícula visible en la cama - MÁS OSCURA */}
            <Grid
                position={[0, -0.4, 0]}
                args={[size, size]}
                cellSize={10}
                cellThickness={0.7}
                cellColor="#555555"
                sectionSize={50}
                sectionThickness={1.2}
                sectionColor="#333333"
                fadeDistance={400}
                fadeStrength={0.5}
                infiniteGrid={false}
            />

            {/* Flechas de ejes original */}
            <primitive object={new THREE.AxesHelper(80)} position={[0, 0, 0]} />
        </group>
    );
};

// Helper para redimensionar la imagen a 100x100 (centrada)
const processCapture = (dataUrl) => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');

            // Fondo blanco para que destaque
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 100, 100);

            // Calcular escala 'cover' o 'contain'
            // Usaremos 'contain' para que se vea la pieza completa
            const scale = Math.min(100 / img.width, 100 / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (100 - w) / 2;
            const y = (100 - h) / 2;

            ctx.drawImage(img, x, y, w, h);

            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png');
        };
        img.src = dataUrl;
    });
};

import { useThree } from '@react-three/fiber';

// Componente invisible que expone la captura
const CaptureHandler = ({ captureRef }) => {
    const { gl, scene, camera } = useThree();

    useEffect(() => {
        if (captureRef) {
            captureRef.current = async () => {
                // Forzar render
                gl.render(scene, camera);
                // Obtener data URL (requiere preserveDrawingBuffer: true en Canvas)
                const dataUrl = gl.domElement.toDataURL('image/png', 0.8);
                // Procesar resizing
                return await processCapture(dataUrl);
            };
        }
    }, [gl, scene, camera, captureRef]);

    return null;
};

export const Viewer3D = ({ fileUrl, colorHex, onGeometryLoaded, rotation = [0, 0, 0], scale = 1.0, captureRef = null, isLoading = false }) => {
    const [position, setPosition] = React.useState([0, 0, 0]);
    const [autoRotate, setAutoRotate] = React.useState(true);
    const meshRef = React.useRef();
    const geometryRef = React.useRef(null);
    const controlsRef = React.useRef();

    const handleGeometryLoaded = useMemo(() => {
        return (geo) => {
            geometryRef.current = geo;
            onGeometryLoaded(geo);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Posicionamiento y Enfoque de Cámara
    React.useEffect(() => {
        if (!geometryRef.current) return;
        const geometry = geometryRef.current;
        if (!geometry.boundingBox) geometry.computeBoundingBox();

        // 1. Posicionar modelo en el suelo (Y=0)
        const zBottom = geometry.boundingBox.min.z;
        const zSize = geometry.boundingBox.max.z - geometry.boundingBox.min.z;
        const yOffset = -zBottom * scale;
        setPosition([0, yOffset, 0]);

        // 2. Ajustar mira de la cámara (Target) al centro del modelo
        if (controlsRef.current) {
            const midY = (zSize * scale) / 2;
            controlsRef.current.target.set(0, midY, 0);
            controlsRef.current.update();
        }
    }, [rotation, fileUrl, scale]);

    return (
        <div className="w-full h-full bg-gradient-to-b from-slate-200 to-slate-300 relative border-r border-slate-300">
            <Canvas
                shadows
                camera={{ position: [150, 120, 150], fov: 45 }}
                dpr={[1, 2]}
                gl={{ preserveDrawingBuffer: true }} // Necesario para capturas
            >
                {captureRef && <CaptureHandler captureRef={captureRef} />}

                {/* 1. ILUMINACIÓN AMBIENTAL (HDRI) EQUILIBRADA */}
                {/* Environment provee reflejos y luz base natural pero suavizada */}
                <Environment preset="city" blur={1} />

                {/* 2. LUCES DE REFUERZO SUAVES (Corregido para no quemar blancos) */}
                <ambientLight intensity={0.2} /> {/* Muy baja, solo para rellenar sombras */}

                <directionalLight
                    position={[50, 100, 50]}
                    intensity={0.6} // Reducido drásticamente de 1.5
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />

                {/* Luz de contra reducida */}
                <spotLight
                    position={[-50, 50, -50]}
                    intensity={0.5} // Reducido drásticamente de 2.0
                    color="#ffffff"
                />

                <React.Suspense fallback={null}>
                    <PrintBed size={320} />
                    {fileUrl && (
                        <group ref={meshRef} rotation={rotation} scale={[scale, scale, scale]} position={position}>
                            <Model url={fileUrl} color={colorHex} onLoaded={handleGeometryLoaded} />
                        </group>
                    )}
                </React.Suspense>

                <OrbitControls
                    ref={controlsRef}
                    makeDefault
                    autoRotate={autoRotate}
                    autoRotateSpeed={0.5}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2.2}
                    enablePan={true}
                    target={[0, 0, 0]}
                    mouseButtons={{
                        LEFT: THREE.MOUSE.PAN,
                        MIDDLE: THREE.MOUSE.DOLLY,
                        RIGHT: THREE.MOUSE.ROTATE
                    }}
                />
            </Canvas>

            {/* Controles e Información Compactos */}
            <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-3 transition-opacity duration-300 ${isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

                {/* Info Mouse (Muy sutil) */}
                <div className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] tracking-widest uppercase font-bold">
                        <svg className="w-3 h-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                        Vista Previa
                    </div>
                    <div className="text-[9px] text-slate-500 bg-white/40 px-2 py-0.5 rounded-full backdrop-blur-sm border border-slate-200/50 whitespace-nowrap">
                        Clic Izq: Mover • Clic Der: Rotar
                    </div>
                </div>

                {/* Botones */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setAutoRotate(!autoRotate)}
                        className="group flex flex-col items-center gap-1"
                        title="Alternar rotación"
                    >
                        <div className={`w-9 h-9 rounded-full bg-white/80 backdrop-blur border border-white/50 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${autoRotate ? 'text-brand-primary ring-1 ring-brand-primary/20' : 'text-slate-500'}`}>
                            <svg className={`w-4 h-4 ${autoRotate ? 'animate-spin-slow' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500/80 bg-white/30 px-1.5 rounded-full backdrop-blur-sm">
                            {autoRotate ? 'Pausar' : 'Girar'}
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            controlsRef.current?.reset();
                        }}
                        className="group flex flex-col items-center gap-1"
                        title="Resetear vista"
                    >
                        <div className="w-9 h-9 rounded-full bg-white/80 backdrop-blur border border-white/50 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-slate-500 hover:text-brand-primary">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500/80 bg-white/30 px-1.5 rounded-full backdrop-blur-sm">
                            Reset
                        </span>
                    </button>
                </div>
            </div>

            {/* INDICADOR DE CARGA SIMULADA - ESQUINA INFERIOR DERECHA */}
            <LoadingIndicator isLoading={isLoading} />
        </div>
    );
};

// Subcomponente para manejar estados de carga rotativos
const LoadingIndicator = ({ isLoading }) => {
    const [messageIndex, setMessageIndex] = React.useState(0);

    // Lista de mensajes "técnicos" para simular análisis
    const messages = [
        "Analizando topología...",
        "Verificando normales...",
        "Calculando volumen...",
        "Simulando capas...",
        "Generando polígonos...",
        "Optimizando malla...",
        "Interpretando para costos..."
    ];

    React.useEffect(() => {
        if (!isLoading) {
            setMessageIndex(0);
            return;
        }

        // Cambiar mensaje cada 1.2s
        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % messages.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [isLoading, messages.length]);

    return (
        <div className={`absolute bottom-6 right-6 pointer-events-none transition-all duration-500 transform ${isLoading ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="bg-white/80 backdrop-blur-md border border-white/50 shadow-lg rounded-xl px-4 py-3 flex items-center gap-4">
                <div className="relative w-8 h-8 flex items-center justify-center">
                    {/* Spinner Círculo */}
                    <svg className="animate-spin w-full h-full text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <div className='flex flex-col w-36'> {/* Ancho fijo para evitar saltos */}
                    <span className="text-xs font-black text-brand-primary uppercase tracking-wider">Procesando</span>
                    <span
                        key={messageIndex} // Key para reiniciar animación
                        className="text-[10px] text-slate-500 font-medium truncate animate-[fadeIn_0.3s_ease-out]"
                    >
                        {messages[messageIndex]}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Viewer3D;
