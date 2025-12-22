import React from 'react';

/**
 * Control de escala para ajustar tamaño del modelo
 * @param {number} scale - Factor de escala actual (0.25 - 2.0)
 * @param {function} onChange - Callback cuando cambia la escala
 * @param {object} scaleInfo - Información de auto-escalado
 * @param {object} dimensions - Dimensiones actuales del modelo
 */
export const ScaleControl = ({ scale, onChange, scaleInfo, dimensions }) => {
    // Límites de la cama de impresión (mm)
    const MAX_BED_X = 350;
    const MAX_BED_Y = 320;
    const MAX_BED_Z = 325;

    // Calcular escala máxima permitida basada en las dimensiones originales
    const maxAllowedScale = React.useMemo(() => {
        if (!dimensions) return 2.0;
        const scaleX = MAX_BED_X / dimensions.x;
        const scaleY = MAX_BED_Y / dimensions.y;
        const scaleZ = MAX_BED_Z / dimensions.z;
        // Tomamos el menor de los límites para asegurar que quepa en todo
        return Math.min(scaleX, scaleY, scaleZ);
    }, [dimensions]);

    const scalePercent = Math.round(scale * 100);

    const handleSliderChange = (e) => {
        let newScale = parseFloat(e.target.value);
        // Limitar al máximo permitido
        if (newScale > maxAllowedScale) newScale = maxAllowedScale;
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
                    max={Math.min(maxAllowedScale, 5.0)}
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

            {/* Dimensions Input */}
            {dimensions && (
                <div className="grid grid-cols-3 gap-3 pt-2 border-t border-brand-secondary/10">
                    <DimensionInput
                        label="Ancho (X)"
                        value={(dimensions.x * scale).toFixed(1)}
                        originalValue={dimensions.x}
                        maxScale={maxAllowedScale}
                        onChange={onChange}
                    />
                    <DimensionInput
                        label="Largo (Y)"
                        value={(dimensions.y * scale).toFixed(1)}
                        originalValue={dimensions.y}
                        maxScale={maxAllowedScale}
                        onChange={onChange}
                    />
                    <DimensionInput
                        label="Alto (Z)"
                        value={(dimensions.z * scale).toFixed(1)}
                        originalValue={dimensions.z}
                        maxScale={maxAllowedScale}
                        onChange={onChange}
                    />
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

const DimensionInput = ({ label, value, originalValue, maxScale, onChange }) => {
    // Estado local para permitir edición sin saltos
    const [localValue, setLocalValue] = React.useState(value);

    // Sincronizar cuando cambia el valor externo (por slider u otro input)
    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = (e) => {
        setLocalValue(e.target.value);
    };

    const handleBlur = () => {
        applyChange();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
            applyChange();
        }
    };

    const applyChange = () => {
        const numValue = parseFloat(localValue);
        if (!isNaN(numValue) && numValue > 0 && originalValue > 0) {
            // Calcular nuevo scale factor
            // nuevoScale = nuevoDim / originalDim
            const newScale = numValue / originalValue;
            // Limitar escala a 10% - Maximo permitido
            const clampedScale = Math.max(0.1, Math.min(newScale, maxScale));
            onChange(clampedScale);
        } else {
            // Revertir si es inválido
            setLocalValue(value);
        }
    };

    return (
        <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-brand-dark/50 mb-1">{label}</span>
            <div className="relative">
                <input
                    type="number"
                    step="0.1"
                    className="w-full bg-brand-light/50 border border-brand-secondary/20 rounded-lg px-2 py-1 text-sm font-mono font-bold text-brand-dark focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                    value={localValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-brand-dark/40 font-bold pointer-events-none">mm</span>
            </div>
        </div>
    );
};

export default ScaleControl;
