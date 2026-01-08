import React from 'react';
import { motion } from 'framer-motion';

/**
 * Control de escala para ajustar tamaño del modelo
 * @param {number} scale - Factor de escala actual (0.25 - 2.0)
 * @param {function} onChange - Callback cuando cambia la escala
 * @param {object} scaleInfo - Información de auto-escalado
 * @param {object} dimensions - Dimensiones actuales del modelo
 */
export const ScaleControl = ({ scale, onChange, scaleInfo, dimensions }) => {
    // Límites de la cama de impresión (mm)
    const MAX_BED_X = 320;
    const MAX_BED_Y = 320;
    const MAX_BED_Z = 350;

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
        <div className="space-y-4">
            {/* Header minimalista */}
            <div className="flex items-baseline justify-between">
                <label className="text-xs font-bold text-brand-dark/60 uppercase tracking-wider">
                    Tamaño
                </label>
                <div className="flex items-baseline gap-1">
                    <motion.span
                        key={scalePercent}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        className="text-3xl font-black text-brand-primary tabular-nums"
                    >
                        {scalePercent}
                    </motion.span>
                    <span className="text-sm font-bold text-brand-dark/40">%</span>
                </div>
            </div>

            {/* Auto-scale warning - compacto */}
            {scaleInfo?.needsScaling && (
                <div className="bg-orange-100/100 rounded-lg px-3 py-2 text-xs text-orange-600 border-orange-600">
                    <span className="text-orange-600/80 ml-1">⚠️ Auto-ajustado a {Math.round(scaleInfo.scaleFactor * 100)}%, ya que su modelo supera los límites de la cama de impresión.</span>
                    <span className="text-orange-600/80 ml-1">• {scaleInfo.reason}</span>
                    <span className="font-semibold ml-1"> Si requiere un tamaño mayor, seleccione que dice "Solicitar cotización" para que uno de nuestros ingenieros verifique la viabilidad de su modelo.</span>
                </div>
            )}

            {/* Slider moderno con track fill */}
            <div className="space-y-3 py-2">
                <div className="relative">
                    {/* Track background con fill progresivo */}
                    <div className="absolute inset-0 h-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-light to-brand-light rounded-full" />
                    <div
                        className="absolute h-1 top-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-primary to-brand-accent rounded-full transition-all duration-200"
                        style={{
                            width: `${((scale - 0.25) / (Math.min(maxAllowedScale, 5.0) - 0.25)) * 100}%`
                        }}
                    />

                    {/* Marcador de 100% */}
                    {(() => {
                        const min = 0.25;
                        const max = Math.min(maxAllowedScale, 5.0);
                        if (1.0 >= min && 1.0 <= max) {
                            const pos = ((1.0 - min) / (max - min)) * 100;
                            return (
                                <div
                                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-brand-dark/20"
                                    style={{ left: `${pos}%` }}
                                />
                            );
                        }
                        return null;
                    })()}

                    {/* Slider input */}
                    <input
                        type="range"
                        min="0.25"
                        max={Math.min(maxAllowedScale, 5.0)}
                        step="0.01"
                        value={scale}
                        onChange={handleSliderChange}
                        className="relative w-full h-1 bg-transparent appearance-none cursor-pointer z-10
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-4
                            [&::-webkit-slider-thumb]:h-4
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-white
                            [&::-webkit-slider-thumb]:border-2
                            [&::-webkit-slider-thumb]:border-brand-primary
                            [&::-webkit-slider-thumb]:cursor-grab
                            [&::-webkit-slider-thumb]:shadow-md
                            [&::-webkit-slider-thumb]:transition-all
                            [&::-webkit-slider-thumb]:hover:scale-125
                            [&::-webkit-slider-thumb]:active:cursor-grabbing
                            [&::-webkit-slider-thumb]:active:scale-110
                            [&::-moz-range-thumb]:w-4
                            [&::-moz-range-thumb]:h-4
                            [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-white
                            [&::-moz-range-thumb]:border-2
                            [&::-moz-range-thumb]:border-brand-primary
                            [&::-moz-range-thumb]:cursor-grab
                            [&::-moz-range-thumb]:shadow-md"
                    />
                </div>
            </div>

            {/* Dimensiones - Grid limpio */}
            {dimensions && (
                <div className="grid grid-cols-3 gap-2">
                    <DimensionInput
                        label="X"
                        value={(dimensions.x * scale).toFixed(1)}
                        originalValue={dimensions.x}
                        maxScale={maxAllowedScale}
                        onChange={onChange}
                    />
                    <DimensionInput
                        label="Y"
                        value={(dimensions.y * scale).toFixed(1)}
                        originalValue={dimensions.y}
                        maxScale={maxAllowedScale}
                        onChange={onChange}
                    />
                    <DimensionInput
                        label="Z"
                        value={(dimensions.z * scale).toFixed(1)}
                        originalValue={dimensions.z}
                        maxScale={maxAllowedScale}
                        onChange={onChange}
                    />
                </div>
            )}

            {/* Quick presets minimalistas */}
            <div className="flex gap-1.5 pt-1">
                {[0.5, 1.0, 1.5, 2.0].filter(val => val <= maxAllowedScale).map((val, index) => (
                    <motion.button
                        key={val}
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                            delay: index * 0.05,
                            type: "spring",
                            stiffness: 400,
                            damping: 15
                        }}
                        onClick={() => onChange(val)}
                        whileHover={{ scale: 1.05, y: -1, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex-1 px-2 py-1.5 text-[11px] font-bold rounded-lg transition-colors border ${Math.abs(scale - val) < 0.05
                            ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                            : 'bg-white text-brand-dark/60 border-brand-light/50 hover:border-brand-primary/30 hover:text-brand-primary'
                            }`}
                    >
                        {Math.round(val * 100)}%
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

const DimensionInput = ({ label, value, originalValue, maxScale, onChange }) => {
    const [localValue, setLocalValue] = React.useState(value);

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
            const newScale = numValue / originalValue;
            const clampedScale = Math.max(0.1, Math.min(newScale, maxScale));
            console.log(`DimensionInput ${label}: Aplicando nuevo scale ${clampedScale.toFixed(2)}`);
            onChange(clampedScale);
        } else {
            setLocalValue(value);
        }
    };

    return (
        <div className="relative">
            <motion.input
                whileFocus={{ scale: 1.05, borderColor: "rgba(96, 23, 177, 0.5)", backgroundColor: "rgba(255,255,255,1)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                type="number"
                step="0.1"
                className="w-full bg-brand-light/30 border border-brand-light rounded-lg px-2 py-2 pr-12 text-sm font-mono font-bold text-brand-dark placeholder:text-brand-dark/30 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-colors"
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={label}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-baseline gap-0.5 pointer-events-none">
                <span className="text-[9px] text-brand-dark/30 font-bold uppercase">{label}</span>
                <span className="text-[8px] text-brand-dark/30">mm</span>
            </div>
        </div>
    );
};

export default ScaleControl;
