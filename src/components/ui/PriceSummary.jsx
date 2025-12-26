import React, { useState, useEffect } from 'react';

// Hook simple para animación de número (CountUp)
const useCountUp = (end, duration = 800) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // Easing Out Quart: 1 - (1 - t)^4
            const ease = 1 - Math.pow(1 - progress, 4);

            setCount(Math.floor(end * ease));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end); // Asegurar valor final exacto
            }
        };

        // Reset count if end changes significantly, or just animate from 0
        if (end > 0) {
            animationFrame = requestAnimationFrame(animate);
        }

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return count;
};

export const PriceSummary = ({ estimate, config, onAddToCart, isLoading }) => {
    const [detailsOpen, setDetailsOpen] = useState(true);
    const [isAdvanced, setIsAdvanced] = useState(false);

    // Animación del precio final
    const animatedPrice = useCountUp(estimate ? estimate.totalPrice : 0);

    if (!estimate) return (
        <div className="mt-8 p-6 bg-brand-light/30 rounded-2xl animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-brand-dark/5 rounded w-1/2"></div>
            <div className="h-8 bg-brand-dark/10 rounded w-full"></div>
        </div>
    );

    return (
        <div className="mt-6 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl shadow-brand-primary/5 hover:shadow-brand-primary/10 overflow-hidden relative transition-all duration-300">

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center transition-all duration-300">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mb-2"></div>
                        <span className="text-xs font-bold text-brand-primary animate-pulse">ACTUALIZANDO...</span>
                    </div>
                </div>
            )}

            {/* Contenido Principal */}
            <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>

                {/* Header con Switch "Simple / Avanzado" */}
                <div className="flex items-center justify-between p-5 bg-gradient-to-b from-white to-brand-light/20 border-b border-brand-secondary/5">
                    <button
                        className="flex items-center gap-2 text-xs font-bold text-brand-dark/50 uppercase tracking-widest hover:text-brand-primary transition-colors group"
                        onClick={() => setDetailsOpen(!detailsOpen)}
                    >
                        <span>Desglose</span>
                        <svg
                            className={`w-4 h-4 transition-transform duration-300 text-brand-dark/30 group-hover:text-brand-primary ${detailsOpen ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Switch Toggle */}
                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${!isAdvanced ? 'text-brand-secondary' : 'text-slate-400'}`}>Simple</span>

                        <label className="relative inline-block w-[52px] h-[28px] cursor-pointer">
                            <input
                                type="checkbox"
                                className="peer opacity-0 w-0 h-0"
                                checked={isAdvanced}
                                onChange={() => {
                                    setIsAdvanced(!isAdvanced);
                                    if (!detailsOpen) setDetailsOpen(true);
                                }}
                            />
                            {/* Track */}
                            <span className="absolute inset-0 rounded-full bg-slate-200 peer-checked:bg-brand-primary/20 transition-all duration-300"></span>

                            {/* Thumb */}
                            <span className="
                                absolute top-[3px] left-[3px]
                                h-[22px] w-[22px]
                                bg-white rounded-full shadow-md
                                transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                peer-checked:translate-x-[24px] peer-checked:bg-brand-primary
                            "></span>
                        </label>

                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isAdvanced ? 'text-brand-primary' : 'text-slate-400'}`}>Avanzado</span>
                    </div>
                </div>

                {/* Technical Specifications (Avanzado) */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out bg-slate-50/50 ${detailsOpen && isAdvanced ? 'max-h-96 opacity-100 border-b border-brand-secondary/5' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 py-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            Especificaciones Técnicas
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-slate-500 font-medium">Volumen</span>
                                <span className="font-mono font-bold text-slate-700">
                                    {estimate.volumeStlCm3 ? `${estimate.volumeStlCm3.toFixed(2)} cm³` : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-slate-500 font-medium">Peso</span>
                                <span className="font-mono font-bold text-slate-700">
                                    {estimate.weightGrams ? `${estimate.weightGrams.toFixed(1)} g` : '—'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm col-span-2">
                                <span className="text-slate-500 font-medium">Dimensiones</span>
                                <span className="font-mono font-bold text-slate-700">
                                    {estimate.dimensions
                                        ? `${estimate.dimensions.x} × ${estimate.dimensions.y} × ${estimate.dimensions.z} mm`
                                        : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Panel (Costos) */}
                <div
                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${detailsOpen ? 'max-h-52 mb-4 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <div className="space-y-2.5 text-sm text-brand-dark/70 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/40"></span>
                                Material ({estimate.weightGrams ? Math.ceil(estimate.weightGrams) : 0}g)
                            </span>
                            <span className="font-semibold text-brand-dark">${estimate.materialCost.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary/40"></span>
                                Tiempo (~{Math.ceil(estimate.estimatedTimeHours)}h)
                            </span>
                            <span className="font-semibold text-brand-dark">${estimate.timeCost.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                Tarifa Base
                            </span>
                            <span className="font-semibold text-brand-dark">${estimate.startupFee.toLocaleString('es-CL')}</span>
                        </div>

                        {config.quantity > 1 && (
                            <div className="flex justify-between text-brand-primary font-bold pt-3 mt-1 border-t border-brand-secondary/5 text-xs">
                                <span>PRECIO UNITARIO</span>
                                <span>${estimate.unitPrice.toLocaleString('es-CL')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Action Bar */}
                <div className="p-6 bg-white border-t border-brand-secondary/5 flex flex-col gap-5">

                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] text-brand-dark/40 font-bold uppercase mb-1.5 tracking-widest">Entrega Estimada</p>
                            <p className="text-xs font-bold text-brand-secondary flex items-center gap-1.5 bg-brand-light/30 px-3 py-1.5 rounded-lg border border-brand-light/50 inline-block">
                                <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                3-5 días hábiles
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-brand-primary font-black uppercase tracking-widest mb-1">Total Final</div>
                            <div className="text-4xl font-black leading-none tracking-tight">
                                <span className="bg-gradient-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent filter drop-shadow-sm">
                                    ${animatedPrice.toLocaleString('es-CL')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onAddToCart}
                        disabled={isLoading}
                        className={`
                            group w-full py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-primary/20 transition-all duration-300
                            flex items-center justify-center gap-3 transform
                            relative overflow-hidden
                            ${isLoading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                : 'bg-gradient-to-r from-brand-secondary to-brand-primary hover:from-brand-primary hover:to-brand-secondary hover:scale-[1.02] hover:shadow-brand-primary/40 text-white'
                            }
                        `}
                    >
                        {/* Shine Effect */}
                        {!isLoading && (
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"></div>
                        )}

                        <span className="relative z-20 uppercase tracking-wide text-sm md:text-base">
                            {isLoading ? 'Calculando...' : 'Añadir al Carrito'}
                        </span>

                        {!isLoading && (
                            <svg className="w-5 h-5 relative z-20 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PriceSummary;
