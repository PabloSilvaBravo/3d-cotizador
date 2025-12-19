import React, { useState } from 'react';

export const PriceSummary = ({ estimate, config, onAddToCart, isLoading }) => {
    const [detailsOpen, setDetailsOpen] = useState(true);

    if (!estimate) return (
        <div className="mt-8 p-6 bg-brand-light/30 rounded-2xl animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-brand-dark/5 rounded w-1/2"></div>
            <div className="h-8 bg-brand-dark/10 rounded w-full"></div>
        </div>
    );

    return (
        <div className="mt-6 bg-brand-secondary/5 rounded-2xl border border-brand-secondary/10 overflow-hidden relative transition-all duration-300">

            {/* Details Header Toggle */}
            <button
                className="w-full flex items-center justify-between p-4 text-xs font-bold text-brand-dark/50 uppercase tracking-widest hover:bg-brand-secondary/5 transition-colors"
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
    );
};

export default PriceSummary;
