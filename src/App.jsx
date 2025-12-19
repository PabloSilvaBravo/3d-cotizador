// src/App.jsx
import { useState, useEffect, useMemo } from 'react';
import Scene3D from './components/Scene3D';
import Model from './components/Model';
import UploadZone from './components/UploadZone';
import Interface from './components/Interface';
import { usePrusaQuote } from './hooks/usePrusaQuote'; // Nuevo Hook
import { PRICING_CONFIG, MATERIAL_RATES } from './utils/constants';

export default function App() {
    const [fileUrl, setFileUrl] = useState(null); // URL para Three.js
    const [fileObj, setFileObj] = useState(null); // Archivo real para Backend

    // Estado de Configuración del usuario
    const [material, setMaterial] = useState('PLA');
    const [difficulty, setDifficulty] = useState('normal'); // Esto sigue siendo manual o heurístico

    // Hook de Slicing (Backend)
    const { getQuote, slicerData, loading: isSlicing } = usePrusaQuote();

    // 1. Cuando el usuario suelta un archivo
    const handleFileUpload = (url, file) => {
        setFileUrl(url); // Mostrar visualmente
        setFileObj(file); // Guardar para envío
    };

    // 2. Efecto: Cuando cambia el archivo o material, pedir cotización al servidor
    useEffect(() => {
        if (fileObj) {
            getQuote(fileObj, {
                material,
                infill: '15%', // Podrías hacerlo dinámico
                hasSupports: difficulty === 'alta' // Ejemplo: Si es alta dificultad, activar soportes en backend
            });
        }
    }, [fileObj, material, difficulty]); // Se dispara al subir archivo o cambiar material/dificultad

    // 3. Cálculo de Precio Final
    const totalPrice = useMemo(() => {
        // Si no hay datos del slicer aún, devolvemos 0 o un estimado básico
        if (!slicerData) return 0;

        // Fórmula usando DATOS REALES DE PRUSA
        // Costo Material
        const materialCost = slicerData.peso * PRICING_CONFIG.costPerGram * MATERIAL_RATES[material].price;

        // Costo Tiempo (Horas reales del slicer)
        const timeCost = slicerData.tiempoHoras * PRICING_CONFIG.hourlyRate;

        // Extras (Cama, dificultad visual si aplica, aunque el tiempo ya debería incluirlo si el slicer es bueno)
        // Nota: A veces mantenemos un factor de dificultad extra para post-procesado manual (quitar soportes)
        const manualLaborFactor = difficulty === 'alta' ? 1.2 : 1.0;

        let total = (materialCost + timeCost + PRICING_CONFIG.baseBedCost) * manualLaborFactor;

        return Math.ceil(total / 100) * 100; // Redondeo
    }, [slicerData, material, difficulty]);

    return (
        <div className="relative w-full h-screen bg-[#1a1a1a] overflow-hidden font-sans">

            {/* Zona de Carga */}
            {!fileUrl && <UploadZone onFileLoaded={handleFileUpload} />}

            {/* Interfaz Flotante */}
            {fileUrl && (
                <Interface
                    // Pasamos datos del Slicer a la UI
                    volume={slicerData?.volumen} // cm3 reales? No, el backend devuelve peso. Visualmente podemos usar estimate.
                    // OJO: El backend devuelve 'peso', 'tiempoTexto', 'tiempoHoras'. El volumen no lo devolvemos explícitamente en el parseSlicerOutput del backend actual.
                    weight={slicerData?.peso}    // gramos reales
                    printTime={slicerData?.tiempoTexto} // string "2h 30m"

                    material={material}
                    setMaterial={setMaterial}
                    difficulty={difficulty}
                    setDifficulty={setDifficulty}

                    price={totalPrice}
                // Adaptamos Interface si no tiene prop isLoading
                />
            )}

            {/* Escena 3D - Solo Visualización */}
            <Scene3D>
                {fileUrl && <Model url={fileUrl} onStatsCalculated={() => { }} />}
                {/* Ya no necesitamos stats de Three.js para el precio, solo para visual */}
            </Scene3D>
        </div>
    );
}
