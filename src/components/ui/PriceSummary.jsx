import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import CubeLoader from './CubeLoader';

// Hook simple para animación de número (CountUp)
const useCountUp = (end, duration = 800) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime;
        let animationFrame;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // Easing Out Quart: 1 - (1 - t)^4
            const ease = 1 - Math.pow(1 - progress, 4);

            setCount(Math.floor(end * ease));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end); // Asegurar valor final exacto
            }
        };

        // Reset count if end changes significantly, or just animate from 0
        if (end > 0) {
            animationFrame = requestAnimationFrame(animate);
        }

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return count;
};

export const PriceSummary = ({ estimate, config, onAddToCart, onWooCommerceCart, isLoading, isCartLoading }) => {
    const [detailsOpen, setDetailsOpen] = useState(true);
    const [isAdvanced, setIsAdvanced] = useState(false);

    // Animación del precio final
    const animatedPrice = useCountUp(estimate ? estimate.totalPrice : 0);

    // Estado de carga inicial (sin datos previos)
    if (isLoading && !estimate) {
        return (
            <div className="mt-6 h-[300px] flex items-center justify-center relative z-10">
                {/* Contenedor transparente para que solo se vea el loader flotando */}
                <div className="bg-white p-8 rounded-2xl shadow-2xl shadow-brand-primary/10 border border-white/50 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <div className="mb-4 transform scale-110">
                        <CubeLoader size="md" />
                    </div>
                    <SummaryLoadingText />
                </div>
            </div>
        );
    }

    // Estado vacío / error (sin datos y sin cargar)
    if (!estimate) return (
        <div className="mt-8 p-6 bg-brand-light/30 rounded-2xl animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-brand-dark/5 rounded w-1/2"></div>
            <div className="h-8 bg-brand-dark/10 rounded w-full"></div>
        </div>
    );

    return (
        <div className="mt-6 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/10 overflow-hidden relative transition-all duration-300">

            {/* Loading Overlay Nuevo */}
            {isLoading && <SummaryLoadingOverlay />}

            {/* Contenido Principal */}
            <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>

                {/* Header con Switch "Simple / Avanzado" */}
                <div className="flex items-center justify-between p-5 bg-gradient-to-b from-white to-brand-light/20 border-b border-brand-secondary/5">
                    <button
                        className="flex items-center gap-2 text-xs font-bold text-brand-dark/50 uppercase tracking-widest hover:text-brand-primary transition-colors group"
                        onClick={() => setDetailsOpen(!detailsOpen)}
                    >
                        <span>Desglose</span>
                        <svg
                            className={`w-4 h-4 transition-transform duration-300 text-brand-dark/30 group-hover:text-brand-primary ${detailsOpen ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Switch Toggle */}
                    <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${!isAdvanced ? 'text-brand-secondary' : 'text-slate-400'}`}>Simple</span>

                        <label className="relative inline-block w-[52px] h-[28px] cursor-pointer">
                            <input
                                type="checkbox"
                                className="peer opacity-0 w-0 h-0"
                                checked={isAdvanced}
                                onChange={() => {
                                    setIsAdvanced(!isAdvanced);
                                    if (!detailsOpen) setDetailsOpen(true);
                                }}
                            />
                            {/* Track */}
                            <span className="absolute inset-0 rounded-full bg-slate-200 peer-checked:bg-brand-primary/20 transition-all duration-300"></span>

                            {/* Thumb */}
                            <span className="
                                absolute top-[3px] left-[3px]
                                h-[22px] w-[22px]
                                bg-white rounded-full shadow-md
                                transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                peer-checked:translate-x-[24px] peer-checked:bg-brand-primary
                            "></span>
                        </label>

                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isAdvanced ? 'text-brand-primary' : 'text-slate-400'}`}>Avanzado</span>
                    </div>
                </div>

                {/* Technical Specifications (Avanzado) */}
                <div className={`overflow-hidden transition-all duration-500 ease-in-out bg-slate-50/50 ${detailsOpen && isAdvanced ? 'max-h-96 opacity-100 border-b border-brand-secondary/5' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 py-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            Especificaciones Técnicas
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-slate-500 font-medium">Volumen</span>
                                <span className="font-mono font-bold text-slate-700">
                                    {estimate.volumeStlCm3 ? `${estimate.volumeStlCm3.toFixed(2)} cm³` : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <span className="text-slate-500 font-medium">Peso</span>
                                <span className="font-mono font-bold text-slate-700">
                                    {estimate.weightGrams ? `${estimate.weightGrams.toFixed(1)} g` : '—'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm col-span-2">
                                <span className="text-slate-500 font-medium">Dimensiones</span>
                                <span className="font-mono font-bold text-slate-700">
                                    {estimate.dimensions
                                        ? `${estimate.dimensions.x} × ${estimate.dimensions.y} × ${estimate.dimensions.z} mm`
                                        : '—'}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm col-span-2">
                                <span className="text-slate-500 font-medium">¿Requiere Soportes?</span>
                                <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${estimate.tieneSoportes ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {estimate.tieneSoportes ? 'SÍ' : 'NO'}
                                </span>
                            </div>


                            {estimate.gcodeUrl && (
                                <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm col-span-2">
                                    <span className="text-slate-500 font-medium">Archivo G-Code</span>
                                    <a
                                        href={`https://dashboard.mechatronicstore.cl${estimate.gcodeUrl}`}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold px-3 py-1.5 rounded-md text-[10px] tracking-wider uppercase border bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer no-underline"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Descargar
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Panel (Costos) */}
                <div
                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${detailsOpen ? 'max-h-52 mb-4 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                    <div className="space-y-2.5 text-sm text-brand-dark/70 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/40"></span>
                                Material ({estimate.weightGrams ? Math.ceil(estimate.weightGrams) : 0}g)
                            </span>
                            <span className="font-semibold text-brand-dark">${estimate.materialCost.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary/40"></span>
                                Tiempo (~{Math.ceil(estimate.estimatedTimeHours)}h)
                            </span>
                            <span className="font-semibold text-brand-dark">${estimate.timeCost.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                Tarifa Base ({estimate.platesNeeded || 1} {estimate.platesNeeded === 1 ? 'placa' : 'placas'})
                            </span>
                            <span className="font-semibold text-brand-dark">${estimate.startupFee.toLocaleString('es-CL')}</span>
                        </div>

                        {estimate.platesNeeded > 1 && (
                            <p className="text-[10px] text-amber-600 mt-1 pl-4 leading-relaxed bg-amber-50 rounded p-1 border border-amber-100">
                                <span className="font-bold">Info:</span> Se requieren {estimate.platesNeeded} camas de impresión debido al volumen de piezas. (+$1.000 por cama extra).
                            </p>
                        )}

                        {config.quantity > 1 && (
                            <div className="flex justify-between text-brand-primary font-bold pt-3 mt-1 border-t border-brand-secondary/5 text-xs">
                                <span>PRECIO UNITARIO</span>
                                <span>${estimate.unitPrice.toLocaleString('es-CL')}</span>
                            </div>
                        )}

                        {/* Disclaimer de Precio Referencial */}
                        <div className="mt-3 pt-3 border-t border-brand-secondary/5 flex gap-2 justify-center">
                            <p className="text-[10px] text-slate-400 leading-snug text-center italic max-w-[90%]">
                                *Existe la posibilidad de cancelación con modelos de alta complejidad.
                            </p>
                        </div>

                    </div>
                </div>

                {/* Main Action Bar */}
                <div className="p-6 bg-white border-t border-brand-secondary/5 flex flex-col gap-5">

                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] text-brand-dark/40 font-bold uppercase mb-1.5 tracking-widest">Entrega</p>
                            <p className="text-xs font-bold text-brand-secondary inline-flex items-center gap-1.5 bg-brand-light/30 px-3 py-1.5 rounded-lg border border-brand-light/50">
                                <svg className="w-4 h-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Depende de la complejidad técnica
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] text-brand-accent font-black uppercase tracking-widest mb-1">Total Final</div>
                            <div className="text-4xl font-black leading-none tracking-tight">
                                <span className="bg-gradient-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent filter drop-shadow-sm">
                                    ${animatedPrice.toLocaleString('es-CL')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Alerta de Precio Mínimo (Ubicación: Bajo Total) */}
                    <AnimatePresence>
                        {estimate.isMinimumPrice && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div className="pb-4 pt-1 px-1">
                                    <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border-2 border-amber-200/60 shadow-sm flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                                            <span className="text-amber-600 text-lg">⚠️</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-bold text-amber-900 tracking-tight leading-none mb-1">
                                                Precio Mínimo Aplicado
                                            </h4>
                                            <p className="text-[11px] text-amber-800 leading-tight">
                                                El pedido está bajo el mínimo de <span className="font-bold text-amber-900">$3.000</span>.
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-center text-amber-700/60 mt-1.5 italic">
                                        * El precio final será confirmado vía correo electrónico.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Botones de Acción (WooCommerce + Cotización) */}
                    <div className="flex flex-col gap-3">

                        {/* 1. AGREGAR AL CARRITO (Primary - WooCommerce) */}
                        <motion.button
                            whileHover={!isLoading && !isCartLoading && config.material ? { scale: 1.02 } : {}}
                            whileTap={!isLoading && !isCartLoading && config.material ? { scale: 0.96 } : {}}
                            onClick={onWooCommerceCart}
                            disabled={isLoading || isCartLoading || !config.material}
                            className={`
                                group w-full py-4 rounded-2xl font-black text-lg shadow-xl shadow-brand-primary/20
                                flex items-center justify-center gap-3 transform
                                relative overflow-hidden
                                ${isLoading || isCartLoading || !config.material
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-brand-secondary to-brand-primary text-white'
                                }
                            `}
                        >
                            {/* Shine Effect */}
                            {!isLoading && !isCartLoading && config.material && (
                                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"></div>
                            )}

                            <span className="relative z-20 uppercase tracking-wide text-sm md:text-base flex items-center gap-2">
                                {isCartLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Procesando...
                                    </>
                                ) : (!config.material ? 'Selecciona Material' : 'Agregar al Carrito')}
                            </span>

                            {!isLoading && !isCartLoading && config.material && (
                                <svg className="w-5 h-5 relative z-20 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            )}
                        </motion.button>


                    </div>
                </div>
            </div>
        </div>
    );
};

// Subcomponente de Loading para PriceSummary
// Subcomponente de texto rotativo
const SummaryLoadingText = () => {
    const [msgIndex, setMsgIndex] = useState(0);
    const messages = [
        "Calculando costos...",
        "Verificando dimensiones...",
        "Optimizando...",
        "Consultando tarifas...",
        "Finalizando cotización..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex(prev => (prev + 1) % messages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center w-40">
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-1">
                Calculando
            </span>
            <span key={msgIndex} className="text-xs text-slate-500 font-medium animate-[fadeIn_0.3s_ease-out] text-center whitespace-nowrap">
                {messages[msgIndex]}
            </span>
        </div>
    );
};

// Subcomponente de Loading Overlay (Para cuando ya hay contenido)
const SummaryLoadingOverlay = () => {
    return (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center transition-all duration-300">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-2xl shadow-brand-primary/10 border border-white flex flex-col items-center transform scale-100 animate-in fade-in zoom-in duration-300">
                <div className="scale-75 mb-2">
                    <CubeLoader size="sm" />
                </div>
                <SummaryLoadingText />
            </div>
        </div>
    );
};

export default PriceSummary;