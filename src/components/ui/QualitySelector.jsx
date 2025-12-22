import React, { useState } from 'react';
import { QUALITIES } from '../../utils/constants';

// Generador de previsualización de capas
const LayerPreview = ({ layerHeight }) => {
    // Normalizamos para visualizar: 0.28 -> Grueso (pocas capas), 0.12 -> Fino (muchas capas)
    // Usamos una exageración para que se note en el icono pequeño
    // Hacemos que la altura total sea fija (ej: 80px)
    // Numero de capas = AlturaTotal / AlturaCapaSimulada

    const baseHeight = 8; // Altura visual base para 0.2mm
    const visualLayerHeight = (layerHeight / 0.2) * baseHeight;

    // Generamos capas para llenar 80px de altura
    const numLayers = Math.floor(80 / visualLayerHeight);

    return (
        <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Fondo suave */}
            <rect width="100" height="100" fill="#f8fafc" rx="8" />

            {/* Dibujamos una esfera/cúpula "sliceada" para mostrar el aliasing (escalones) */}
            <g transform="translate(50, 90) scale(1, -1)"> {/* Origen abajo centro */}
                {Array.from({ length: numLayers }).map((_, i) => {
                    const y = i * visualLayerHeight;
                    // Formula de circulo: x^2 + y^2 = r^2 -> x = sqrt(r^2 - y^2)
                    const radius = 40;
                    // Usamos la altura del TOP de la capa para calcular el ancho (peor caso de escalón)
                    // O el centro para promedio. Usaremos bottom para que se vea piramidal.
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
                            height={visualLayerHeight - 0.5} // -0.5 para pequeña separación visual
                            rx="1"
                            fill="currentColor"
                            className="text-brand-primary"
                            opacity={0.8 + (i / numLayers) * 0.2} // Gradiente sutil
                        />
                    );
                })}
            </g>
        </svg>
    );
};

export const QualitySelector = ({ value, onChange }) => {
    const [hoveredOption, setHoveredOption] = useState(null);

    return (
        <div className="grid grid-cols-3 gap-3">
            {QUALITIES.map((q, index) => {
                const isSelected = value === q.id;
                const isHovered = hoveredOption === q.id;
                const isFirst = index === 0;
                const isLast = index === QUALITIES.length - 1;

                return (
                    <div key={q.id} className="relative group">
                        <button
                            onClick={() => onChange({ qualityId: q.id })}
                            onMouseEnter={() => setHoveredOption(q.id)}
                            onMouseLeave={() => setHoveredOption(null)}
                            className={`
                                relative w-full flex flex-col items-center p-2 rounded-xl border-2 transition-all duration-300
                                ${isSelected
                                    ? 'border-brand-primary bg-brand-primary/5 shadow-md scale-[1.02]'
                                    : 'border-brand-light bg-white hover:border-brand-primary/30 hover:shadow-sm'
                                }
                            `}
                        >
                            {/* Visual Preview */}
                            <div className="w-full aspect-[4/3] mb-2 p-2 bg-white rounded-lg border border-brand-light/30">
                                <LayerPreview layerHeight={q.layerHeight} />
                            </div>

                            {/* Label */}
                            <div className="text-center">
                                <div className={`text-xs font-bold truncate w-full ${isSelected ? 'text-brand-primary' : 'text-brand-dark'}`}>
                                    {q.name.split(' ')[0]} {/* Mostrar solo primera palabra (Borrador, Estándar...) */}
                                </div>
                                <div className="text-[10px] text-brand-secondary font-mono">
                                    {q.layerHeight}mm
                                </div>
                            </div>

                            {/* Checkmark selection indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-4 h-4 bg-brand-primary rounded-full flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>

                        {/* HOVER TOOLTIP */}
                        {isHovered && (
                            <div className={`
                                absolute bottom-full mb-3 z-[9999] pointer-events-none animate-fade-in w-48
                                ${isFirst ? 'left-0' : isLast ? 'right-0' : 'left-1/2 -translate-x-1/2'}
                            `}>
                                <div className="bg-white border-2 border-brand-primary rounded-xl shadow-2xl p-3">
                                    <h4 className="font-bold text-brand-primary text-xs mb-1 border-b border-brand-light pb-1">
                                        {q.name}
                                    </h4>

                                    <div className="space-y-2 text-[10px] text-gray-600">
                                        <div className="flex justify-between items-center">
                                            <span>Detalle:</span>
                                            <div className="flex gap-0.5">
                                                {/* Estrellas simulas */}
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <div key={i} className={`w-1.5 h-4 rounded-sm ${i < (q.id === 'draft' ? 2 : q.id === 'standard' ? 3 : 5) ? 'bg-brand-accent' : 'bg-gray-200'}`}></div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Tiempo:</span>
                                            <span className="font-bold text-brand-secondary">
                                                {q.id === 'draft' ? 'Rápido' : q.id === 'standard' ? 'Normal' : 'Lento'}
                                            </span>
                                        </div>
                                        <p className="italic text-brand-dark/70 leading-tight">
                                            {q.id === 'draft' ? 'Capas visibles. Bueno para pruebas mecánicas rápidas.' :
                                                q.id === 'standard' ? 'Balance ideal entre acabado y velocidad.' :
                                                    'Superficies suaves. Máximo detalle para piezas finales.'}
                                        </p>
                                    </div>

                                    {/* Flecha */}
                                    <div className={`
                                        absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-brand-primary
                                        ${isFirst ? 'left-8' : isLast ? 'right-8' : 'left-1/2 -translate-x-1/2'}
                                    `} />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
