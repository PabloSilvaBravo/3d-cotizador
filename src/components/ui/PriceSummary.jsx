import React, { useState } from 'react';

export const PriceSummary = ({ estimate, config, onAddToCart, isLoading }) => {
    const [detailsOpen, setDetailsOpen] = useState(true);
    const [isAdvanced, setIsAdvanced] = useState(false);

    if (!estimate) return (
        <div className="mt-8 p-6 bg-brand-light/30 rounded-2xl animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-brand-dark/5 rounded w-1/2"></div>
            <div className="h-8 bg-brand-dark/10 rounded w-full"></div>
        </div>
    );

    return (
        <div className="mt-6 bg-brand-secondary/5 rounded-2xl border border-brand-secondary/10 overflow-hidden relative transition-all duration-300">

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-brand-primary/20 border-t-brand-primary mb-3"></div>
                        <p className="text-sm text-brand-dark/70 font-medium animate-pulse">Recalculando precio...</p>
                    </div>
                </div>
            )}

            {/* Contenido con transición suave */}
            <div className={`transition-opacity duration-500 ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
                {/* Header con Switch "Simple / Avanzado" */}
                <div className="flex items-center justify-between p-4 bg-white border-b border-brand-secondary/5">
                    <button
                        className="flex items-center gap-2 text-xs font-bold text-brand-dark/50 uppercase tracking-widest hover:text-brand-primary transition-colors"
                        onClick={() => setDetailsOpen(!detailsOpen)}
                    >
                        <span>Desglose de Costos</span>
                        <svg
                            className={`w-4 h-4 transition-transform duration-300 ${detailsOpen ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Custom Tailwind Switch con Animación Elástica Exacta */}
                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${!isAdvanced ? 'text-brand-secondary' : 'text-slate-400'}`}>Simple</span>

                        <label className="relative inline-block w-[60px] h-[34px]">
                            <input
                                type="checkbox"
                                className="peer opacity-0 w-0 h-0"
                                checked={isAdvanced}
                                onChange={() => {
                                    setIsAdvanced(!isAdvanced);
                                    if (!detailsOpen) setDetailsOpen(true);
                                }}
                            />
                            {/* Slider Background */}
                            <span className="
                                absolute inset-0.5 cursor-pointer rounded-[50px]
                                bg-slate-400 peer-checked:bg-brand-primary
                                transition-all duration-400 ease-[cubic-bezier(0.23,1,0.320,1)]
                            "></span>

                            {/* Slider Knob (Circle) */}
                            <span className="
                                absolute content-['']
                                h-[24px] w-[24px]
                                left-[5px] bottom-[5px]
                                bg-white rounded-[50px] shadow-sm
                                transition-all duration-400 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
                                ring-1 ring-gray-400
                                
                                peer-checked:translate-x-[26px]
                                peer-checked:w-[32px]
                                peer-checked:h-[32px]
                                peer-checked:bottom-[1px]
                            "></span>
                        </label>

                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isAdvanced ? 'text-brand-primary' : 'text-slate-400'}`}>Avanzado</span>
                    </div>
                </div>

                {/* Technical Specifications (Avanzado) */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${detailsOpen && isAdvanced ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                            Especificaciones Técnicas
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                <span className="text-slate-500">Volumen STL:</span>
                                <span className="font-mono font-semibold text-slate-700">
                                    {estimate.volumeStlCm3 ? `${estimate.volumeStlCm3.toFixed(2)} cm³` : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                                <span className="text-slate-500">Peso Total:</span>
                                <span className="font-mono font-semibold text-slate-700">
                                    {estimate.weightGrams ? `${estimate.weightGrams.toFixed(1)} g` : '—'}
                                </span>
                            </div>

                            {/* Visualización de Soportes */}
                            {/* Visualización de Soportes (OCULTO POR CLIENTE) */}
                            {/* 
                            {estimate.supportsInfo && (
                                <div className={`flex justify-between items-center p-2 border rounded-lg col-span-2 ${estimate.supportsInfo.percentage > 0 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium flex items-center gap-1 ${estimate.supportsInfo.percentage > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            Soportes:
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-mono font-bold block ${estimate.supportsInfo.percentage > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                            {estimate.supportsInfo.percentage.toFixed(1)}%
                                        </span>
                                        <span className={`text-[10px] ${estimate.supportsInfo.percentage > 0 ? 'text-amber-600/80' : 'text-slate-400/60'}`}>
                                            ~{estimate.supportsInfo.weight?.toFixed(1) || 0}g
                                        </span>
                                    </div>
                                </div>
                            )}
                            */}

                            <div className="flex justify-between items-center p-2 bg-white rounded-lg col-span-2">
                                <span className="text-slate-500">Dimensiones:</span>
                                <span className="font-mono font-semibold text-slate-700">
                                    {estimate.dimensions
                                        ? `${estimate.dimensions.x} × ${estimate.dimensions.y} × ${estimate.dimensions.z} cm`
                                        : '— × — × — cm'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Panel */}
                <div
                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${detailsOpen ? 'max-h-52 mb-4 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <div className="space-y-2 text-sm text-brand-dark/70 pt-2 border-t border-dashed border-brand-secondary/10">
                        <div className="flex justify-between">
                            <span>Material ({estimate.weightGrams ? Math.ceil(estimate.weightGrams) : 0}g)</span>
                            <span className="font-medium">${estimate.materialCost.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tiempo (~{Math.ceil(estimate.estimatedTimeHours)}h)</span>
                            <span className="font-medium">${estimate.timeCost.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tarifa Base</span>
                            <span className="font-medium">${estimate.startupFee.toLocaleString('es-CL')}</span>
                        </div>

                        {config.quantity > 1 && (
                            <div className="flex justify-between text-brand-primary font-bold pt-2 mt-2 border-t border-brand-secondary/5 text-xs">
                                <span>Precio unitario</span>
                                <span>${estimate.unitPrice.toLocaleString('es-CL')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Action Bar */}
                <div className="p-5 bg-white border-t border-brand-secondary/10 flex flex-col gap-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-xs text-brand-dark/40 font-bold uppercase mb-1">Tiempo de entrega estimado</p>
                            <p className="text-sm font-semibold text-brand-secondary flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                3-5 días hábiles
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-brand-dark/40 uppercase font-bold tracking-widest mb-0.5">Total Estimado</div>
                            <div className="text-3xl font-black text-brand-secondary leading-none tracking-tight">
                                ${estimate.totalPrice.toLocaleString('es-CL')}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onAddToCart}
                        disabled={isLoading}
                        className={`
            w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-300
            flex items-center justify-center gap-3 transform hover:-translate-y-1 active:translate-y-0
            ${isLoading
                                ? 'bg-brand-dark/10 text-brand-dark/30 cursor-not-allowed shadow-none'
                                : 'bg-brand-primary text-white hover:bg-brand-secondary hover:shadow-brand-primary/30'
                            }
          `}
                    >
                        {isLoading ? 'Calculando...' : 'Añadir al Carrito'}
                        {!isLoading && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                    </button>
                </div>
            </div>
            {/* Cierre del div de transición */}
        </div>
    );
};

export default PriceSummary;
