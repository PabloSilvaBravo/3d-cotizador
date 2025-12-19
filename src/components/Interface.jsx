// src/components/Interface.jsx
import { MATERIAL_RATES, DIFFICULTY_FACTOR } from '../utils/constants';

export default function Interface({
    weight,
    printTime,
    material,
    setMaterial,
    difficulty,
    setDifficulty,
    price,
    isLoading
}) {

    // Si está cargando, mostramos un estado de espera elegante
    if (isLoading) {
        return (
            <div className="absolute top-4 right-4 z-50 w-80">
                <div className="bg-[#1a1a1a]/90 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-center">
                        <h3 className="text-white font-bold">Simulando Impresión...</h3>
                        <p className="text-xs text-gray-400">Calculando capas, tiempo y material real (H2D)</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute top-4 right-4 z-50 w-80 flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500">

            {/* CARD 1: Resultados del Slicer (Data Real) */}
            <div className="bg-[#1a1a1a]/90 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl">
                <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" /> Análisis H2D
                </h2>
                <div className="space-y-3 text-sm">
                    {/* Peso */}
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                        <span className="text-gray-400">Peso (+Soportes)</span>
                        <span className="text-white font-mono font-bold text-lg">
                            {weight ? `${weight.toFixed(1)} g` : '--'}
                        </span>
                    </div>
                    {/* Tiempo */}
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                        <span className="text-gray-400">Tiempo Est.</span>
                        <span className="text-[#22c55e] font-mono font-bold text-lg">
                            {printTime || '--'}
                        </span>
                    </div>
                </div>
            </div>

            {/* CARD 2: Configuración (Inputs) */}
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
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Complejidad (Post-Proceso)</label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full mt-2 bg-black/50 border border-white/20 text-white text-sm rounded-lg p-2.5 focus:ring-[#22c55e] focus:border-[#22c55e] outline-none"
                    >
                        <option value="normal">Normal (Limpieza Std)</option>
                        <option value="alta">Alta (Muchos Soportes +20%)</option>
                    </select>
                </div>
            </div>

            {/* CARD 3: Precio Final */}
            <div className="bg-gradient-to-br from-[#22c55e] to-[#16a34a] p-1 rounded-2xl shadow-lg transform transition-all hover:scale-[1.02]">
                <div className="bg-[#1a1a1a] rounded-[14px] p-5 text-center">
                    <p className="text-gray-400 text-xs uppercase mb-1">Costo Total Estimado</p>
                    <div className="text-4xl font-black text-white tracking-tight">
                        ${price.toLocaleString('es-CL')}
                    </div>
                    <div className="text-[10px] text-white/50 mt-1 mb-4">+ IVA</div>

                    <button className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold py-3 rounded-xl transition-colors shadow-lg shadow-green-900/20">
                        Solicitar Impresión
                    </button>
                </div>
            </div>

        </div>
    );
}
