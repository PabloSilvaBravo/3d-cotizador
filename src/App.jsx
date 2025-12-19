// src/App.jsx
import { useState, useMemo } from 'react';
import Scene3D from './components/Scene3D';
import Model from './components/Model'; // (Lo crearemos en el sig. paso, por ahora usa un placeholder o fallo silencioso si queremos probar)
import UploadZone from './components/UploadZone';
import Interface from './components/Interface';
import { MATERIAL_RATES, DIFFICULTY_FACTOR, PRICING_CONFIG } from './utils/constants';

export default function App() {
    const [fileUrl, setFileUrl] = useState(null);
    const [volume, setVolume] = useState(0); // Volumen en mm3
    const [material, setMaterial] = useState('PLA');
    const [difficulty, setDifficulty] = useState('normal');

    // --- LÓGICA DE PRECIOS (Tu fórmula) ---
    const totalPrice = useMemo(() => {
        if (!volume) return 0;

        // 1. Convertir volumen a peso (Densidad PLA ~1.24 g/cm3)
        // Nota: Deberías tener densidades por material en constants.js idealmente
        const density = 1.24;
        const weightInGrams = (volume / 1000) * density;

        // 2. Costo Material
        const materialCost = weightInGrams * PRICING_CONFIG.costPerGram * MATERIAL_RATES[material].price;

        // 3. Tiempo (Estimación simple basada en gramos, ej: 10g por hora)
        // En el futuro, el G-Code parser te dará el tiempo exacto.
        const estimatedHours = weightInGrams / 10;
        const timeCost = estimatedHours * PRICING_CONFIG.hourlyRate;

        // 4. Totales con dificultad y base
        let total = (materialCost + timeCost + PRICING_CONFIG.baseBedCost);
        total = total * DIFFICULTY_FACTOR[difficulty];

        return Math.ceil(total / 10) * 10; // Redondear a decenas
    }, [volume, material, difficulty]);

    return (
        <div className="relative w-full h-screen bg-[#1a1a1a] overflow-hidden font-sans">

            {/* UI Flotante */}
            <UploadZone onFileLoaded={setFileUrl} />

            <Interface
                volume={volume}
                material={material}
                setMaterial={setMaterial}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                price={totalPrice}
            />

            {/* Escena 3D */}
            <Scene3D>
                {fileUrl && (
                    <Model
                        url={fileUrl}
                        onVolumeCalculated={setVolume} // El modelo nos dirá su volumen al cargar
                    />
                )}
            </Scene3D>
        </div>
    );
}
