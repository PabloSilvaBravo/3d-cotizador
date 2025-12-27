import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

                <motion.div
                    layout
                    className={`
                        grid gap-3
                        ${config.material
                            ? 'grid-cols-1 sm:grid-cols-[1.3fr_0.7fr] items-stretch'
                            : 'grid-cols-1 sm:grid-cols-2 items-start'
                        }
                    `}
                >
                    {Object.values(MATERIALS).map((mat) => {
                        const isSelected = config.material === mat.id;
                        return (
                            <motion.button
                                layout
                                key={mat.id}
                                onClick={() => onChange({ material: isSelected ? null : mat.id })}
                                style={{ order: isSelected ? -1 : 1 }}
                                initial={false}
                                animate={{
                                    backgroundColor: isSelected ? 'rgba(241, 196, 15, 0.05)' : '#ffffff',
                                    borderColor: isSelected ? 'var(--color-brand-accent)' : '#cbd5e1'
                                }}
                                whileHover={{ scale: 1.02, borderColor: isSelected ? 'var(--color-brand-accent)' : 'var(--color-brand-accent)' }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 120, damping: 20 }} // Ultra smooth
                                className={`
                                    relative px-4 rounded-2xl border-2 text-left group overflow-hidden flex flex-col justify-center
                                    ${isSelected ? 'py-6 sm:row-span-3 h-full shadow-md' : 'py-3 hover:shadow-md'}
                                `}
                            >
                                <motion.div layout="position" className="flex justify-between items-center relative z-10 w-full mb-1">
                                    <motion.span
                                        layout="position"
                                        className={`font-bold text-sm ${isSelected ? 'text-brand-primary text-lg mb-1' : 'text-brand-dark group-hover:text-brand-primary'}`}
                                    >
                                        {mat.name}
                                    </motion.span>

                                    <motion.div layout="position">
                                        {isSelected ? (
                                            <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shadow-[0_0_8px_rgba(var(--color-primary),0.5)] self-start mt-2"></div>
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-brand-primary/30 transition-colors"></div>
                                        )}
                                    </motion.div>
                                </motion.div>

                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0, y: 10 }} // Empieza abajo e invisible
                                            animate={{ opacity: 1, height: "auto", y: 0 }} // Sube y aparece
                                            exit={{ opacity: 0, height: 0, y: -10, transition: { duration: 0.2 } }} // Sale rápido
                                            transition={{
                                                duration: 0.4,
                                                delay: 0.2, // ESPERAR a que la tarjeta se expanda
                                                ease: "easeOut"
                                            }}
                                            className="overflow-hidden"
                                        >
                                            <p className="text-xs leading-relaxed text-brand-primary/90 font-medium pt-2">
                                                {mat.description}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        );
                    })}
                </motion.div>
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
                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-4 max-h-[250px] overflow-y-scroll overflow-x-hidden px-2 pt-1 pb-12 custom-scrollbar">
                        {availableColors.map((col) => {
                            const isSelected = config.colorId === col.id;
                            return (
                                <motion.button
                                    key={col.id}
                                    layout
                                    whileHover={{ scale: 1.25, zIndex: 20 }}
                                    whileTap={{ scale: 0.85 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    onClick={() => {
                                        if (isSelected) {
                                            onChange({ colorId: null, colorData: null });
                                        } else {
                                            onChange({ colorId: col.id, colorData: col });
                                        }
                                    }}
                                    className="group relative flex items-center justify-center outline-none p-1"
                                >
                                    {/* Círculo Principal */}
                                    <div
                                        className={`
                                            w-10 h-10 rounded-full shadow-sm transition-all duration-300 border-2 relative
                                            ${isSelected
                                                ? 'border-white z-10 shadow-lg'
                                                : 'border-white/50 ring-1 ring-gray-200'
                                            }
                                        `}
                                        style={{
                                            backgroundColor: col.hex,
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                        }}
                                    >
                                        {/* Anillo Morado Punteado (Selección) */}
                                        {isSelected && (
                                            <motion.div
                                                layoutId="color-ring"
                                                className="absolute -inset-[4px] rounded-full z-[-1] border-2 border-dashed border-brand-primary"
                                                initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{ duration: 0.3, ease: "backOut" }}
                                            />
                                        )}
                                        {/* Icono Check (Motion) */}
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.span
                                                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                                                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                                    exit={{ scale: 0, opacity: 0, transition: { duration: 0.1 } }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                    className={`
                                                        absolute inset-0 flex items-center justify-center
                                                    `}
                                                >
                                                    <svg className={`w-6 h-6 drop-shadow-sm ${['#ffffff', '#fff13f', '#eac642', '#f4f9ff'].includes(col.hex) ? 'text-brand-primary' : 'text-[#e9d5ff]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Tooltip Flotante */}
                                    <div className={`
                                        absolute left-1/2 -translate-x-1/2 px-1.5 py-0.5
                                        bg-brand-secondary text-white text-[10px] font-bold rounded text-center
                                        opacity-0 group-hover:opacity-100 transition-all duration-200 
                                        pointer-events-none whitespace-nowrap z-50 shadow-sm
                                        top-full mt-1.5 translate-y-[-2px] group-hover:translate-y-0
                                    `}>
                                        {col.name}
                                        <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-secondary rotate-45 -top-1"></div>
                                    </div>

                                    {/* Badge Stock Crítico */}
                                    {col.stock < 5 && (
                                        <span className="absolute bottom-0 right-0 flex h-2.5 w-2.5 translate-x-1 translate-y-1 z-30 pointer-events-none">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                                        </span>
                                    )}
                                </motion.button>
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
                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        className="w-8 h-8 rounded-lg bg-brand-light/50 hover:bg-brand-primary hover:text-white text-brand-dark transition-colors flex items-center justify-center font-bold"
                        onClick={() => onChange({ quantity: Math.max(1, config.quantity - 1) })}
                    >-</motion.button>
                    <span className="w-10 text-center font-bold text-brand-secondary text-lg">{config.quantity}</span>
                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        className="w-8 h-8 rounded-lg bg-brand-light/50 hover:bg-brand-primary hover:text-white text-brand-dark transition-colors flex items-center justify-center font-bold"
                        onClick={() => onChange({ quantity: config.quantity + 1 })}
                    >+</motion.button>
                </div>
            </div>

        </div>
    );
};

export default Configurator;
