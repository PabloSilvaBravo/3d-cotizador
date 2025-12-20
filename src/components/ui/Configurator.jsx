import React from 'react';
import { MATERIALS, COLORS, QUALITIES } from '../../utils/constants';
import { InfillSelector } from './InfillSelector';

export const Configurator = ({ config, geometry, onChange }) => {

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

            {/* Color Selection (Visual Circles) */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-brand-accent rounded-full"></div>
                    <label className="text-sm font-extrabold text-brand-secondary uppercase tracking-wider">2. Color</label>
                </div>
                <div className="flex flex-wrap gap-3">
                    {COLORS.map((col) => (
                        <button
                            key={col.id}
                            onClick={() => onChange({ colorId: col.id })}
                            className={`
                group relative w-10 h-10 rounded-full shadow-sm transition-all duration-300
                ${config.colorId === col.id
                                    ? 'scale-110 ring-2 ring-offset-2 ring-brand-primary shadow-lg'
                                    : 'hover:scale-110 hover:shadow-md'
                                }
              `}
                            title={col.name}
                            style={{ backgroundColor: col.hex }}
                        >
                            {/* Checkmark overlay */}
                            <span className={`
                  absolute inset-0 flex items-center justify-center transition-opacity duration-200
                  ${config.colorId === col.id ? 'opacity-100' : 'opacity-0'}
              `}>
                                <svg className={`w-5 h-5 drop-shadow-sm ${col.id === 'white' || col.id === 'yellow' ? 'text-black' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                        </button>
                    ))}
                </div>
                <div className="text-xs font-medium text-brand-dark/60 bg-brand-light/50 px-3 py-1 rounded-lg inline-block">
                    Color seleccionado: <span className="text-brand-primary font-bold">{COLORS.find(c => c.id === config.colorId)?.name}</span>
                </div>
            </div>

            {/* Quality */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-1 h-5 bg-brand-accent rounded-full"></div>
                    <label className="text-sm font-extrabold text-brand-secondary uppercase tracking-wider">3. Calidad</label>
                </div>
                <div className="flex flex-col gap-2">
                    {QUALITIES.map((q) => (
                        <button
                            key={q.id}
                            onClick={() => onChange({ qualityId: q.id })}
                            className={`
                    w-full py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 border flex justify-between items-center
                    ${config.qualityId === q.id
                                    ? 'bg-brand-secondary text-white border-brand-secondary shadow-md transform translate-x-1'
                                    : 'bg-white text-brand-dark/60 border-brand-light hover:border-brand-secondary/30'
                                }
                `}
                        >
                            <span>{q.name.split(' ')[0]}</span>
                            <span className="opacity-70 font-mono">{q.layerHeight}mm</span>
                        </button>
                    ))}
                </div>
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
