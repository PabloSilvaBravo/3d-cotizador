import React, { useState } from 'react';

// Generador de patrón SVG para cada % de relleno
// Generador de patrón SVG más realista (Rejilla rotada 45°)
const InfillPattern = ({ percentage }) => {
    // Caso 0: Vacío
    if (percentage === 0) {
        return (
            <svg className="w-full h-full bg-white" viewBox="0 0 100 100">
                <rect x="2" y="2" width="96" height="96" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300" />
                <text x="50" y="55" textAnchor="middle" className="text-[10px] font-bold fill-gray-400">0%</text>
            </svg>
        );
    }

    // Caso 100: Sólido
    if (percentage === 100) {
        return (
            <svg className="w-full h-full bg-brand-primary" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="currentColor" className="text-brand-primary" />
                <text x="50" y="55" textAnchor="middle" className="text-[10px] font-bold fill-white">100%</text>
            </svg>
        );
    }

    // Caso Intermedio: Patrón de Rejilla Inclinada (Grid 45°)
    // Densidad visual: Ajustamos logarítmcamente para que 10% se vea poco y 80% muy denso.
    // Base: 6 líneas mínimas, max 30 líneas (más denso).
    const density = Math.floor(6 + (percentage / 100) * 24);
    const spacing = 100 / density;

    return (
        <svg className="w-full h-full bg-white overflow-hidden" viewBox="0 0 100 100">
            {/* Fondo / Perímetro */}
            <rect x="0" y="0" width="100" height="100" fill="white" />
            <rect x="2" y="2" width="96" height="96" fill="none" stroke="currentColor" strokeWidth="3" className="text-brand-primary" />

            {/* Grupo de líneas con rotación 45 grados desde el centro */}
            <g transform="rotate(45, 50, 50)">
                {/* Líneas Verticales (en el espacio rotado) */}
                {Array.from({ length: density * 2 }).map((_, i) => {
                    // Generamos más líneas de las necesarias para cubrir las esquinas al rotar
                    const pos = (i - density / 2) * spacing;
                    return (
                        <line
                            key={`v-${i}`}
                            x1={pos} y1="-50" x2={pos} y2="150"
                            stroke="currentColor"
                            strokeWidth={percentage > 50 ? 2.5 : 1.5}
                            className="text-brand-accent opacity-80"
                        />
                    );
                })}
                {/* Líneas Horizontales (para hacer cuadrícula) */}
                {Array.from({ length: density * 2 }).map((_, i) => {
                    const pos = (i - density / 2) * spacing;
                    return (
                        <line
                            key={`h-${i}`}
                            x1="-50" y1={pos} x2="150" y2={pos}
                            stroke="currentColor"
                            strokeWidth={percentage > 50 ? 2.5 : 1.5}
                            className="text-brand-accent opacity-80"
                        />
                    );
                })}
            </g>
        </svg>
    );
};

const INFILL_OPTIONS = [
    { value: 0, label: '0%', desc: 'Solo cáscaras', strength: 'Mínima' },
    { value: 10, label: '10%', desc: 'Decorativo', strength: 'Baja' },
    { value: 20, label: '20%', desc: 'Estándar', strength: 'Media', recommended: true },
    { value: 30, label: '30%', desc: 'Resistente', strength: 'Alta' },
    { value: 50, label: '50%', desc: 'Muy fuerte', strength: 'Muy Alta' },
    { value: 70, label: '70%', desc: 'Extra fuerte', strength: 'Extrema' },
    { value: 100, label: '100%', desc: 'Sólido', strength: 'Máxima' },
];

export const InfillSelector = ({ value, onChange }) => {
    const [hoveredOption, setHoveredOption] = useState(null);
    const selectedOption = INFILL_OPTIONS.find(opt => opt.value === value) || INFILL_OPTIONS[2];

    return (
        <div className="space-y-4">
            {/* Grid de opciones COMPACTO */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {INFILL_OPTIONS.map((option, index) => {
                    const isSelected = option.value === value;
                    const isHovered = hoveredOption === option.value;
                    const isFirst = index === 0;
                    const isLast = index === INFILL_OPTIONS.length - 1;

                    return (
                        <div key={option.value} className="relative">
                            <button
                                onClick={() => onChange(option.value)}
                                onMouseEnter={() => setHoveredOption(option.value)}
                                onMouseLeave={() => setHoveredOption(null)}
                                className={`
                  relative w-full aspect-square p-2 rounded-xl border-2 transition-all duration-300
                  hover:scale-105 hover:shadow-lg
                  ${isSelected
                                        ? 'border-brand-primary bg-brand-primary/5 shadow-md'
                                        : 'border-gray-200 bg-white hover:border-brand-primary/50'
                                    }
                `}
                            >
                                {/* Badge "Recomendado" */}
                                {option.recommended && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-accent rounded-full flex items-center justify-center">
                                        <span className="text-white text-xs">⭐</span>
                                    </div>
                                )}

                                {/* Patrón pequeño */}
                                <div className="w-full h-full">
                                    <InfillPattern percentage={option.value} />
                                </div>

                                {/* Indicador de selección */}
                                {isSelected && (
                                    <div className="absolute inset-0 rounded-xl border-2 border-brand-primary pointer-events-none" />
                                )}
                            </button>

                            {/* Label debajo */}
                            <div className="text-center mt-1">
                                <div className={`text-xs font-bold ${isSelected ? 'text-brand-primary' : 'text-gray-600'}`}>
                                    {option.label}
                                </div>
                            </div>

                            {/* PREVIEW EN HOVER - Tooltip arriba del botón */}
                            {isHovered && (
                                <div className={`
                  absolute bottom-full mb-2 z-[9999] pointer-events-none animate-fade-in
                  ${isFirst ? 'left-0' : isLast ? 'right-0' : 'left-1/2 -translate-x-1/2'}
                `}>
                                    <div className="bg-white border-2 border-brand-primary rounded-xl shadow-2xl p-3 w-48">
                                        {/* Preview pequeño */}
                                        <div className="w-20 h-20 mx-auto mb-2">
                                            <InfillPattern percentage={option.value} />
                                        </div>

                                        {/* Info compacta */}
                                        <div className="space-y-1 text-center">
                                            <h4 className="font-bold text-brand-primary text-xs">
                                                {option.label} - {option.desc}
                                            </h4>

                                            <div className="text-[10px] text-gray-600 space-y-0.5">
                                                <div>🔧 {option.strength}</div>
                                                <div>📦 ~{Math.round(37 + option.value)}% material</div>
                                                <div>⏱️ {
                                                    option.value === 0 ? 'Mín' :
                                                        option.value < 30 ? 'Rápido' :
                                                            option.value < 60 ? 'Medio' : 'Largo'
                                                }</div>
                                            </div>

                                            {option.recommended && (
                                                <div className="mt-1 px-2 py-0.5 bg-brand-accent/20 rounded text-[9px] font-semibold text-brand-accent">
                                                    ⭐ Recomendado
                                                </div>
                                            )}
                                        </div>

                                        {/* Flecha apuntando al botón */}
                                        <div className={`
                      absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-brand-primary
                      ${isFirst ? 'left-6' : isLast ? 'right-6' : 'left-1/2 -translate-x-1/2'}
                    `} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Resumen compacto de selección actual */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-brand-primary/5 to-transparent rounded-xl border border-brand-primary/20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg border-2 border-brand-primary p-1">
                        <InfillPattern percentage={selectedOption.value} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-brand-primary">
                            {selectedOption.label}
                        </div>
                        <div className="text-xs text-gray-600">
                            {selectedOption.desc} • {selectedOption.strength}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500">Material aprox.</div>
                    <div className="text-lg font-bold text-brand-accent">
                        {Math.round(37 + selectedOption.value)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InfillSelector;
