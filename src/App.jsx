// src/App.jsx
import { useState, useMemo } from 'react';
import Scene3D from './components/Scene3D';
import Model from './components/Model'; // (Lo crearemos en el sig. paso, por ahora usa un placeholder o fallo silencioso si queremos probar)
import UploadZone from './components/UploadZone';
import Interface from './components/Interface';
import { MATERIAL_RATES, DIFFICULTY_FACTOR, PRICING_CONFIG } from './utils/constants';

export default function App() {
    const [fileUrl, setFileUrl] = useState(null);
    const [stats, setStats] = useState(null); // Nuevo estado para datos H2D
    const [material, setMaterial] = useState('PLA');
    const [difficulty, setDifficulty] = useState('normal');

    // --- LÓGICA DE PRECIOS (Tu fórmula con Datos H2D) ---
    const totalPrice = useMemo(() => {
        if (!stats) return 0;

        // Usamos el peso calculado por el perfil H2D
        const weight = stats.weightGrams;

        // Costo Material
        const materialCost = weight * PRICING_CONFIG.costPerGram * MATERIAL_RATES[material].price;

        // Costo Tiempo (H2D es rápida, cobramos por hora de máquina)
        const timeCost = (stats.printTimeMinutes / 60) * PRICING_CONFIG.hourlyRate;

        // Factores extras
        let total = (materialCost + timeCost + PRICING_CONFIG.baseBedCost);
        total = total * DIFFICULTY_FACTOR[difficulty];

        return Math.ceil(total / 100) * 100; // Redondeo CLP
    }, [stats, material, difficulty]);

    return (
        <div className="relative w-full h-screen bg-[#1a1a1a] overflow-hidden font-sans">

            {/* UI Flotante */}
            <UploadZone onFileLoaded={setFileUrl} />

            <Interface
                volume={stats?.volumeCm3 * 1000} // Pasamos mm3 para mantener compatibilidad visual
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
                        onStatsCalculated={setStats} // <--- AQUÍ RECIBES LA DATA PURA
                    />
                )}
            </Scene3D>
        </div>
    );
}
