import React, { useEffect } from 'react';
import { MATERIALS, QUALITIES } from '../../utils/constants';
import { InfillSelector } from './InfillSelector';
import { QualitySelector } from './QualitySelector';
import { useAvailableColors } from '../../hooks/useAvailableColors';

export const Configurator = ({ config, geometry, onChange }) => {
    // 1. Cargar colores dinámicos
    const { colors: availableColors, loading, error } = useAvailableColors(config.material);

    // 2. Efecto para seleccionar el primer color disponible si el actual NO es explícitamente null y no existe
    useEffect(() => {
        if (!loading && availableColors.length > 0) {
            const currentColorExists = availableColors.find(c => c.id === config.colorId);
            // Solo auto-corregir si hay un ID definido pero inválido (ej: cambio de material)
            // Si es null, respetamos la decisión del usuario de no tener color
            if (config.colorId !== null && !currentColorExists) {
                onChange({ colorId: availableColors[0].id, colorData: availableColors[0] });
            }
            // Opcional: Si es undefined (carga inicial), seleccionar el primero
            if (config.colorId === undefined) {
                onChange({ colorId: availableColors[0].id, colorData: availableColors[0] });
            }
        }
    }, [availableColors, loading, config.colorId, onChange]);

    return (
        <div className="flex flex-col gap-8 animate-fade-in-up">

            {/* Material Selection (Pills Style) */}
            <div className="space-y-3">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold ring-1 ring-brand-primary/20">1</div>
                    <label className="text-sm font-bold text-gray-800 tracking-wide">Material</label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(MATERIALS).map((mat) => {
                        const isSelected = config.material === mat.id;
                        return (
                            <button
                                key={mat.id}
                                onClick={() => onChange({ material: isSelected ? null : mat.id })}
                                className={`
                                    relative px-4 rounded-2xl border-2 text-left transition-all duration-300 group overflow-hidden
                                    ${isSelected
                                        ? 'border-brand-primary bg-brand-primary/5 shadow-md scale-[1.02] py-4'
                                        : 'border-brand-light bg-white hover:border-brand-primary/30 hover:shadow-sm py-3 hover:py-4'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-center relative z-10">
                                    <span className={`font-bold text-sm transition-colors ${isSelected ? 'text-brand-primary' : 'text-brand-dark group-hover:text-brand-primary'}`}>
                                        {mat.name}
                                    </span>
                                    {isSelected ? (
                                        <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shadow-[0_0_8px_rgba(var(--color-primary),0.5)]"></div>
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-gray-200 group-hover:bg-brand-primary/30 transition-colors"></div>
                                    )}
                                </div>

                                {/* Descripción Expandible (Acordeón) */}
                                <div className={`
                                    transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] origin-top
                                    ${isSelected
                                        ? 'max-h-32 opacity-100 mt-2'
                                        : 'max-h-0 opacity-0 mt-0 group-hover:max-h-32 group-hover:opacity-100 group-hover:mt-2'
                                    }
                                `}>
                                    <p className={`text-xs leading-relaxed transition-colors duration-300 ${isSelected ? 'text-brand-primary/90 font-medium' : 'text-brand-dark/60'}`}>
                                        {mat.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Color Selection (Visual Circles - Dynamic) */}
            <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold ring-1 ring-brand-primary/20">2</div>
                        <label className="text-sm font-bold text-gray-800 tracking-wide">Color</label>
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
                    // Lista de Colores Real - Diseño GRID Mejorado
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-4 max-h-[250px] overflow-y-auto overflow-x-hidden px-2 py-1 custom-scrollbar">
                        {availableColors.map((col) => {
                            const isSelected = config.colorId === col.id;
                            return (
                                <button
                                    key={col.id}
                                    onClick={() => {
                                        // Toggle logic: Deseleccionar si ya estaba seleccionado
                                        if (isSelected) {
                                            onChange({ colorId: null, colorData: null });
                                        } else {
                                            onChange({ colorId: col.id, colorData: col });
                                        }
                                    }}
                                    className="group relative flex items-center justify-center outline-none"
                                >
                                    {/* Círculo Principal */}
                                    <div
                                        className={`
                                            w-10 h-10 rounded-full shadow-sm transition-all duration-300 border-2 relative
                                            ${isSelected
                                                ? 'scale-105 border-white z-10'
                                                : 'border-white/50 hover:scale-110 hover:shadow-md hover:border-white ring-1 ring-gray-200'
                                            }
                                        `}
                                        style={{
                                            backgroundColor: col.hex,
                                            // Sin glow, usamos anillo dashed
                                            boxShadow: 'none',
                                            borderColor: isSelected ? 'white' : 'rgba(0,0,0,0.1)'
                                        }}
                                    >
                                        {/* Anillo Dashed EXTERNO (Gris) */}
                                        {isSelected && (
                                            <div className="absolute -inset-[5px] rounded-full border-[2px] border-dashed border-gray-400 pointer-events-none animate-[spin_12s_linear_infinite]"></div>
                                        )}

                                        {/* Icono Check (solo si seleccionado) */}
                                        <span className={`
                                            absolute inset-0 flex items-center justify-center transition-all duration-300
                                            ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
                                        `}>
                                            <svg className={`w-5 h-5 drop-shadow-md ${['#ffffff', '#fff13f', '#eac642', '#f4f9ff'].includes(col.hex) ? 'text-black/70' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </span>
                                    </div>

                                    {/* Tooltip Flotante */}
                                    <div className={`
                                        absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 
                                        bg-brand-secondary text-white text-[10px] font-bold rounded-md 
                                        opacity-0 group-hover:opacity-100 transition-all duration-200 
                                        translate-y-2 group-hover:translate-y-0
                                        pointer-events-none whitespace-nowrap z-50 shadow-xl
                                    `}>
                                        {col.name}
                                        {/* Triángulo tooltip */}
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-secondary rotate-45"></div>
                                    </div>

                                    {/* Badge Stock Crítico */}
                                    {col.stock < 5 && (
                                        <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5 translate-x-1 translate-y-1">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quality Selector - NEW */}
            <div className="space-y-3">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold ring-1 ring-brand-primary/20">3</div>
                    <label className="text-sm font-bold text-gray-800 tracking-wide">Calidad</label>
                </div>
                <QualitySelector
                    value={config.qualityId}
                    onChange={onChange}
                />
            </div>

            {/* Infill Selector - NEW */}
            <div className="space-y-3">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold ring-1 ring-brand-primary/20">4</div>
                    <label className="text-sm font-bold text-gray-800 tracking-wide">Relleno</label>
                </div>
                <InfillSelector
                    value={config.infill}
                    onChange={(newInfill) => onChange({ infill: newInfill })}
                />
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between pt-4 border-t border-dashed border-brand-light/60">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-bold ring-1 ring-brand-accent/20">#</div>
                    <label className="text-sm font-bold text-gray-800 tracking-wide">Copias</label>
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
