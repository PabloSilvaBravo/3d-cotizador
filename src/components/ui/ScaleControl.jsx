import React from 'react';

/**
 * Control de escala para ajustar tamaño del modelo
 * @param {number} scale - Factor de escala actual (0.25 - 2.0)
 * @param {function} onChange - Callback cuando cambia la escala
 * @param {object} scaleInfo - Información de auto-escalado
 * @param {object} dimensions - Dimensiones actuales del modelo
 */
export const ScaleControl = ({ scale, onChange, scaleInfo, dimensions }) => {
    const scalePercent = Math.round(scale * 100);

    const handleSliderChange = (e) => {
        const newScale = parseFloat(e.target.value);
        onChange(newScale);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-brand-secondary/10 p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-brand-dark uppercase tracking-wide">
                    📏 Escala del Modelo
                </label>
                <span className="text-2xl font-black text-brand-primary">
                    {scalePercent}%
                </span>
            </div>

            {/* Auto-scale warning */}
            {scaleInfo?.needsScaling && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs">
                    <div className="flex items-start gap-2">
                        <span className="text-amber-600">⚠️</span>
                        <div>
                            <p className="font-semibold text-amber-800">{scaleInfo.reason}</p>
                            <p className="text-amber-600 mt-1">
                                Auto-escalado al {Math.round(scaleInfo.scaleFactor * 100)}% para ajustar a cama de impresión
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Slider */}
            <div className="space-y-2">
                <input
                    type="range"
                    min="0.25"
                    max="2.0"
                    step="0.05"
                    value={scale}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-brand-secondary/20 rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-5
                        [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-brand-primary
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:shadow-lg
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:hover:scale-110
                        [&::-moz-range-thumb]:w-5
                        [&::-moz-range-thumb]:h-5
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-brand-primary
                        [&::-moz-range-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:border-0"
                />

                {/* Range labels */}
                <div className="flex justify-between text-xs text-brand-dark/50">
                    <span>25%</span>
                    <span className="font-semibold text-brand-primary">100%</span>
                    <span>200%</span>
                </div>
            </div>

            {/* Dimensions display */}
            {dimensions && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-brand-secondary/10">
                    <div className="text-center">
                        <div className="text-xs text-brand-dark/50 mb-1">Ancho</div>
                        <div className="font-mono font-bold text-sm text-brand-dark">
                            {(dimensions.x * scale).toFixed(0)}mm
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-brand-dark/50 mb-1">Profund.</div>
                        <div className="font-mono font-bold text-sm text-brand-dark">
                            {(dimensions.y * scale).toFixed(0)}mm
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-brand-dark/50 mb-1">Altura</div>
                        <div className="font-mono font-bold text-sm text-brand-dark">
                            {(dimensions.z * scale).toFixed(0)}mm
                        </div>
                    </div>
                </div>
            )}

            {/* Quick presets */}
            <div className="flex gap-2 pt-2">
                <button
                    onClick={() => onChange(0.5)}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-dark transition-colors"
                >
                    50%
                </button>
                <button
                    onClick={() => onChange(1.0)}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary transition-colors"
                >
                    100%
                </button>
                <button
                    onClick={() => onChange(1.5)}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-dark transition-colors"
                >
                    150%
                </button>
            </div>
        </div>
    );
};

export default ScaleControl;
