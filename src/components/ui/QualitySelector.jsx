import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QUALITIES } from '../../utils/constants';

// Generador de previsualización de capas
const LayerPreview = ({ layerHeight }) => {
    const baseHeight = 8;
    const visualLayerHeight = (layerHeight / 0.2) * baseHeight;
    const numLayers = Math.floor(80 / visualLayerHeight);

    return (
        <svg className="w-full h-full" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="#f8fafc" rx="8" />
            <g transform="translate(50, 90) scale(1, -1)">
                {Array.from({ length: numLayers }).map((_, i) => {
                    const y = i * visualLayerHeight;
                    const radius = 40;
                    let width = 0;
                    if (y < radius) {
                        width = Math.sqrt(radius * radius - y * y) * 2;
                    }
                    if (width <= 0) return null;
                    return (
                        <rect
                            key={i}
                            x={-width / 2}
                            y={y}
                            width={width}
                            height={visualLayerHeight - 0.5}
                            rx="1"
                            fill="currentColor"
                            className="text-brand-accent"
                            opacity={0.8 + (i / numLayers) * 0.2}
                        />
                    );
                })}
            </g>
        </svg>
    );
};

export const QualitySelector = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const selectedOption = QUALITIES.find(q => q.id === value) || QUALITIES[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative z-30" ref={containerRef}>
            {/* Toggle Button Compacto */}
            <motion.button
                layout
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center justify-between p-2 pl-3 bg-white border 
                    rounded-2xl shadow-sm transition-all duration-300 group
                    ${isOpen ? 'border-brand-accent ring-1 ring-brand-accent/20' : 'border-brand-light hover:border-brand-accent/50'}
                `}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {/* Icono Mini Preview */}
                    <div className="w-10 h-10 min-w-[2.5rem] bg-slate-50 rounded-xl p-1 border border-brand-light group-hover:scale-105 transition-transform">
                        <LayerPreview layerHeight={selectedOption.layerHeight} />
                    </div>
                    <div className="text-left flex flex-col items-start min-w-0">
                        <div className="text-xs font-black text-brand-dark uppercase tracking-wide truncate w-full">
                            {selectedOption.name}
                        </div>
                        <div className="text-[10px] text-brand-secondary/80 leading-tight w-full pr-1">
                            {selectedOption.description}
                        </div>
                    </div>
                </div>

                {/* Chevron */}
                <div className="flex items-center gap-2 pr-2">
                    <span className="text-[9px] font-black text-brand-accent uppercase tracking-widest bg-brand-accent/5 px-2 py-1 rounded-md hidden sm:block">
                        Cambiar
                    </span>
                    <div className="text-brand-accent">
                        <motion.svg
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            className="w-5 h-5"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                    </div>
                </div>
            </motion.button>

            {/* Panel Desplegable Overlay (HACIA ARRIBA) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute bottom-full left-0 right-0 mb-3 z-50 bg-white rounded-2xl border border-brand-light/50 shadow-2xl p-3 overflow-hidden"
                    >
                        <div className="text-[10px] font-bold text-brand-dark/40 uppercase mb-2 tracking-widest text-center">Seleccionar Calidad</div>
                        <div className="flex flex-col gap-2">
                            {QUALITIES.map((q) => {
                                const isSelected = value === q.id;
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => {
                                            onChange({ qualityId: q.id });
                                            setIsOpen(false);
                                        }}
                                        className={`
                                            relative flex items-start gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left
                                            ${isSelected
                                                ? 'border-brand-accent bg-brand-accent/5'
                                                : 'border-transparent bg-slate-50 hover:bg-slate-100 hover:border-brand-light'
                                            }
                                        `}
                                    >
                                        <div className="flex-shrink-0 w-24 h-24 p-2 bg-white rounded-lg border border-brand-light/30 shadow-sm">
                                            <LayerPreview layerHeight={q.layerHeight} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-xs font-black text-brand-dark uppercase tracking-wide">
                                                    {q.name.split(' (')[0]}
                                                </span>
                                                <span className="text-[10px] font-bold text-brand-secondary bg-brand-secondary/5 px-1.5 py-0.5 rounded">
                                                    {q.layerHeight}mm
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-brand-dark/70 leading-relaxed font-medium">
                                                {q.description}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute top-3 right-3 w-2 h-2 bg-brand-accent rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
