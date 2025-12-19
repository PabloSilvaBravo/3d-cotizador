// src/components/Scene3D.jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Grid, Center } from '@react-three/drei';
import { Suspense } from 'react';

export default function Scene3D({ children }) {
    return (
        <div className="w-full h-screen bg-[#1a1a1a]"> {/* Fondo Oscuro Prusa/Bambu */}
            <Canvas
                shadows
                camera={{ position: [200, 200, 200], fov: 45 }}
                dpr={[1, 2]} // Optimización de píxeles
            >
                <Suspense fallback={null}>
                    {/* Iluminación de estudio para que se vea profesional */}
                    <Stage environment="city" intensity={0.6} adjustCamera={false}>
                        <Center top>
                            {children}
                        </Center>
                    </Stage>
                </Suspense>

                {/* La "Cama" de impresión */}
                <Grid
                    position={[0, -0.1, 0]} // Un poco abajo del modelo
                    args={[256, 256]}       // Tamaño similar a una Bambu X1
                    cellSize={10}           // Cuadros chicos
                    cellThickness={0.6}
                    cellColor="#444"        // Líneas sutiles
                    sectionSize={50}        // Cuadros grandes
                    sectionThickness={1.2}
                    sectionColor="#22c55e"  // Verde "Matrix" o Naranja Prusa (ajustable)
                    fadeDistance={400}
                    infiniteGrid
                />

                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
            </Canvas>
        </div>
    );
}
