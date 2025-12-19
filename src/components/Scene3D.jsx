// src/components/Scene3D.jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Grid, Center } from '@react-three/drei';
import { Suspense } from 'react';

export default function Scene3D({ children }) {
    // Dimensiones H2D: 350x320 mm
    const bedWidth = 350;
    const bedDepth = 320;

    return (
        <div className="w-full h-screen bg-[#1a1a1a]">
            <Canvas
                shadows
                camera={{ position: [400, 400, 400], fov: 40 }} // Cámara más alejada para cama grande
                dpr={[1, 2]}
            >
                <Suspense fallback={null}>
                    <Stage environment="city" intensity={0.6} adjustCamera={false}>
                        <Center top>
                            {children}
                        </Center>
                    </Stage>
                </Suspense>

                {/* Cama H2D - Visualización exacta */}
                <group position={[0, -0.2, 0]}>
                    {/* Rejilla Principal */}
                    <Grid
                        args={[bedWidth, bedDepth]}
                        cellSize={10}
                        cellThickness={0.6}
                        cellColor="#444"
                        sectionSize={50}
                        sectionThickness={1.2}
                        sectionColor="#22c55e" // Verde Bambu/H2D
                        fadeDistance={600}
                    />
                    {/* Borde físico de la cama (opcional para realismo) */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                        <planeGeometry args={[bedWidth + 10, bedDepth + 10]} />
                        <meshBasicMaterial color="#111" transparent opacity={0.5} />
                    </mesh>
                </group>

                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
            </Canvas>
        </div>
    );
}
