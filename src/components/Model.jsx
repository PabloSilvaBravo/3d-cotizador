import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { Center } from '@react-three/drei';

export default function Model({ url, color = "#6366F1", onGeometryLoaded }) {
    const geometry = useLoader(STLLoader, url);

    useMemo(() => {
        if (geometry) {
            // Centramos para visualización correcta
            geometry.center();
            geometry.computeBoundingBox();
            // ¡Aquí ocurre la magia! Enviamos la geometría al padre
            if (onGeometryLoaded) {
                onGeometryLoaded(geometry);
            }
        }
    }, [geometry, onGeometryLoaded]);

    return (
        <Center top>
            <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
        </Center>
    );
}
