// src/components/Interface.jsx
import { MATERIAL_RATES, DIFFICULTY_FACTOR, PRICING_CONFIG } from '../utils/constants';

export default function Interface({ volume, material, setMaterial, difficulty, setDifficulty, price }) {

    if (!volume) return null; // No mostrar si no hay modelo

    return (
        <div className="absolute top-4 right-4 z-50 w-80 flex flex-col gap-4">

            {/* CARD 1: Resumen del Modelo */}
            <div className="bg-[#1a1a1a]/90 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl">
                <h2 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#22c55e]" /> Cotizador 3D
                </h2>
                <div className="space-y-2 text-sm text-gray-400">
                    <p className="flex justify-between">
                        <span>Volumen:</span> <span className="text-white">{(volume / 1000).toFixed(2)} cm³</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Peso Est. (PLA):</span> <span className="text-white">{(volume * 1.24 / 1000).toFixed(1)} g</span>
                    </p>
                </div>
            </div>

            {/* CARD 2: Configuración (Inputs estilo Uiverse) */}
            <div className="bg-[#1a1a1a]/90 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl space-y-4">

                {/* Selector de Material */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Material</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {Object.entries(MATERIAL_RATES).map(([key, data]) => (
                            <button
                                key={key}
                                onClick={() => setMaterial(key)}
                                className={`
                  py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 border
                  ${material === key
                                        ? 'bg-[#22c55e] border-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}
                `}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selector de Dificultad */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Complejidad</label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full mt-2 bg-black/50 border border-white/20 text-white text-sm rounded-lg p-2.5 focus:ring-[#22c55e] focus:border-[#22c55e] outline-none"
                    >
                        {Object.entries(DIFFICULTY_FACTOR).map(([key, value]) => (
                            <option key={key} value={key}>
                                {key.charAt(0).toUpperCase() + key.slice(1)} (x{value})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* CARD 3: Precio Final (Highlight) */}
            <div className="bg-gradient-to-br from-[#22c55e] to-[#16a34a] p-1 rounded-2xl shadow-lg">
                <div className="bg-[#1a1a1a] rounded-[14px] p-5 text-center">
                    <p className="text-gray-400 text-xs uppercase mb-1">Total Estimado</p>
                    <div className="text-3xl font-black text-white tracking-tight">
                        ${price.toLocaleString('es-CL')}
                    </div>
                    <button className="w-full mt-4 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold py-2 rounded-lg transition-colors">
                        Solicitar Impresión
                    </button>
                </div>
            </div>

        </div>
    );
}
