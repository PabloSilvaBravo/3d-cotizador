import React, { useEffect } from 'react';
import { MATERIALS, QUALITIES } from '../../utils/constants';
import { InfillSelector } from './InfillSelector';
import { QualitySelector } from './QualitySelector';
import { useAvailableColors } from '../../hooks/useAvailableColors';

export const Configurator = ({ config, geometry, onChange }) => {
    // 1. Cargar colores dinámicos
    const { colors: availableColors, loading, error } = useAvailableColors(config.material);

    // 2. Efecto para seleccionar el primer color disponible si el actual no existe en la nueva lista
    useEffect(() => {
        if (!loading && availableColors.length > 0) {
            const currentColorExists = availableColors.find(c => c.id === config.colorId);
            if (!currentColorExists) {
                // Seleccionar automáticamente el primero
                onChange({ colorId: availableColors[0].id, colorData: availableColors[0] });
            }
        }
    }, [availableColors, loading, config.colorId, onChange]);

    return (
        <div className="flex flex-col gap-8 animate-fade-in-up">

            {/* Material Selection (Pills Style) */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-brand-accent rounded-full"></div>
                    <label className="text-sm font-extrabold text-brand-secondary uppercase tracking-wider">1. Material</label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(MATERIALS).map((mat) => (
                        <button
                            key={mat.id}
                            onClick={() => onChange({ material: mat.id })}
                            className={`
                relative px-4 py-3 rounded-2xl border-2 text-left transition-all duration-300 group
                ${config.material === mat.id
                                    ? 'border-brand-primary bg-brand-primary/5 shadow-md scale-[1.02]'
                                    : 'border-brand-light bg-white hover:border-brand-primary/30 hover:shadow-sm'
                                }
              `}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-bold text-sm ${config.material === mat.id ? 'text-brand-primary' : 'text-brand-dark'}`}>
                                    {mat.name}
                                </span>
                                {config.material === mat.id && (
                                    <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></div>
                                )}
                            </div>
                            <p className="text-xs text-brand-dark/50 leading-relaxed line-clamp-2 group-hover:text-brand-dark/70 transition-colors">
                                {mat.description}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Selection (Visual Circles - Dynamic) */}
            <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-brand-accent rounded-full"></div>
                        <label className="text-sm font-extrabold text-brand-secondary uppercase tracking-wider">2. Color</label>
                    </div>
                    {/* Contador de Stock */}
                    {!loading && !error && (
                        <span className="text-[10px] bg-brand-light px-2 py-0.5 rounded-full text-brand-dark/60 font-medium">
                            {availableColors.length} disponibles
                        </span>
                    )}
                </div>

                {loading ? (
                    // Estado de Carga Skeleton
                    <div className="flex flex-wrap gap-3 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full bg-gray-200"></div>
                        ))}
                    </div>
                ) : error ? (
                    // Estado de Error
                    <div className="text-xs text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
                        Error cargando colores. Intenta recargar.
                    </div>
                ) : availableColors.length === 0 ? (
                    // Estado Vacío
                    <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                        No hay stock disponible para este material.
                    </div>
                ) : (
                    // Lista de Colores Real
                    <div className="flex flex-wrap gap-3 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent p-1">
                        {availableColors.map((col) => (
                            <button
                                key={col.id}
                                onClick={() => onChange({ colorId: col.id, colorData: col })}
                                className={`
                    group relative w-10 h-10 rounded-full shadow-sm transition-all duration-300 border-2
                    ${config.colorId === col.id
                                        ? 'scale-110 border-brand-primary ring-2 ring-offset-2 ring-brand-primary/20 shadow-lg z-10'
                                        : 'border-gray-200/80 hover:scale-110 hover:shadow-md hover:border-gray-300'
                                    }
                  `}
                                title={`${col.name} (Stock: ${col.stock})`}
                                style={{ backgroundColor: col.hex }}
                            >
                                {/* Checkmark overlay */}
                                <span className={`
                      absolute inset-0 flex items-center justify-center transition-opacity duration-200
                      ${config.colorId === col.id ? 'opacity-100' : 'opacity-0'}
                  `}>
                                    <svg className={`w-5 h-5 drop-shadow-sm ${['#ffffff', '#fff13f', '#eac642', '#f4f9ff'].includes(col.hex) ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>

                                {/* Badge de stock bajo (< 5 unidades) */}
                                {col.stock < 5 && (
                                    <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-white"></span>
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Info del color seleccionado */}
                {!loading && !error && config.colorId && availableColors.find(c => c.id === config.colorId) && (
                    <div className="flex items-center justify-between text-xs font-medium bg-brand-light/30 px-3 py-2 rounded-lg border border-brand-light">
                        <span className="text-brand-dark/60">Seleccionado:</span>
                        <div className="flex items-center gap-2">
                            <span className="text-brand-primary font-bold">{availableColors.find(c => c.id === config.colorId)?.name}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Quality Selector - NEW */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-brand-accent rounded-full"></div>
                    <label className="text-sm font-extrabold text-brand-secondary uppercase tracking-wider">3. Calidad</label>
                </div>
                <QualitySelector
                    value={config.qualityId}
                    onChange={onChange}
                />
            </div>

            {/* Infill Selector - NEW */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-brand-accent rounded-full"></div>
                    <label className="text-sm font-extrabold text-brand-secondary uppercase tracking-wider">4. Relleno</label>
                </div>
                <InfillSelector
                    value={config.infill}
                    onChange={(newInfill) => onChange({ infill: newInfill })}
                />
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between pt-4 border-t border-dashed border-brand-light/60">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-brand-accent rounded-full"></div>
                    <label className="text-sm font-extrabold text-brand-secondary uppercase tracking-wider">Copias</label>
                </div>
                <div className="flex items-center gap-1 bg-white border-2 border-brand-light rounded-xl p-1 shadow-sm">
                    <button
                        className="w-8 h-8 rounded-lg bg-brand-light/50 hover:bg-brand-primary hover:text-white text-brand-dark transition-all flex items-center justify-center font-bold active:scale-90"
                        onClick={() => onChange({ quantity: Math.max(1, config.quantity - 1) })}
                    >-</button>
                    <span className="w-10 text-center font-bold text-brand-secondary text-lg">{config.quantity}</span>
                    <button
                        className="w-8 h-8 rounded-lg bg-brand-light/50 hover:bg-brand-primary hover:text-white text-brand-dark transition-all flex items-center justify-center font-bold active:scale-90"
                        onClick={() => onChange({ quantity: config.quantity + 1 })}
                    >+</button>
                </div>
            </div>

        </div>
    );
};

export default Configurator;
