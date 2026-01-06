import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const QuoteCart = ({ items, onRemove, onCheckout, onQuote, isProcessing }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!items || items.length === 0) return null;

    const total = items.reduce((sum, item) => sum + (item.price || 0), 0);

    return (
        <>
            {/* PANEL DEL CARRITO (EXPANDIDO) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed bottom-24 right-6 z-50 w-full max-w-[380px] bg-white/95 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[75vh]"
                    >
                        {/* Header con Colores de Marca */}
                        <div className="p-5 border-b border-brand-primary/5 bg-gradient-to-r from-brand-primary/[0.05] via-transparent to-white flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-brand-secondary uppercase tracking-wide flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
                                    Tu Pedido
                                </h3>
                                <p className="text-[10px] text-brand-primary font-bold ml-4 opacity-80">
                                    {items.length} {items.length === 1 ? 'modelo configurado' : 'modelos configurados'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 -mr-2 text-brand-primary/40 hover:text-brand-primary hover:bg-brand-primary/5 rounded-full transition-colors cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Lista de Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-brand-light/20">
                            <AnimatePresence mode="popLayout">
                                {items.map((item, idx) => {
                                    const dims = item.payload?.dimensions || "N/A";
                                    return (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="relative group bg-white border border-brand-primary/5 rounded-2xl p-3 flex gap-3 shadow-sm hover:shadow-brand-primary/10 hover:border-brand-primary/10 transition-all"
                                        >
                                            {/* Icono / Miniatura con Color Dinámico */}
                                            {/* Icono / Miniatura con Color Sólido */}
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner border border-black/10 transition-all transform group-hover:scale-105"
                                                style={{
                                                    backgroundColor: item.colorHex || '#94a3b8',
                                                    color: '#ffffff'
                                                }}
                                            >
                                                <svg className="w-6 h-6 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                                                </svg>
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="text-xs font-bold text-slate-700 truncate pr-2 max-w-[140px]" title={item.fileName}>{item.fileName}</h4>
                                                    <span className="text-xs font-black text-brand-secondary shrink-0 bg-brand-primary/5 px-1.5 py-0.5 rounded-md border border-brand-primary/10">
                                                        ${item.price.toLocaleString('es-CL')}
                                                    </span>
                                                </div>

                                                {/* Detalles Técnicos Compactos */}
                                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-500 leading-tight">
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-brand-primary/40"></span>
                                                        <span className="truncate">{item.material} <span className="text-slate-300">|</span> {item.color}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="w-1 h-1 rounded-full bg-brand-primary/40"></span>
                                                        <span className="">Cant: <strong>{item.quantity}</strong></span>
                                                    </div>
                                                    {dims !== "N/A" && (
                                                        <div className="flex items-center gap-1 col-span-2 opacity-70">
                                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                                            <span className="truncate">{dims}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Botón Eliminar (Visible solo hover) */}
                                            <button
                                                onClick={() => onRemove(item.id)}
                                                className="absolute -top-1.5 -right-1.5 bg-white text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-full shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Footer Totales */}
                        <div className="p-5 bg-white border-t border-brand-primary/5 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                            <div className="flex justify-between items-end mb-4 px-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Estimado</span>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-brand-secondary tracking-tight">${total.toLocaleString('es-CL')}</span>
                                    {total < 3000 && <p className="text-[9px] text-brand-accent font-bold text-right mt-1">Mínimo no alcanzado</p>}
                                </div>
                            </div>

                            {/* Alerta de Retraso por Impresión */}
                            <div className="mb-4 bg-amber-50 rounded-lg p-3 border border-amber-100 flex items-start gap-2">
                                <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-[10px] text-amber-800 leading-tight">
                                    <strong>Importante:</strong> Incluir impresiones 3D en el carrito de MechatronicStore podría aumentar el tiempo de despacho de tu pedido, sujeto a la complejidad de fabricación.
                                </p>
                            </div>

                            <button
                                onClick={onCheckout}
                                disabled={isProcessing}
                                className="w-full bg-brand-primary text-white py-3.5 rounded-xl font-bold hover:bg-brand-secondary transition-all shadow-lg hover:shadow-brand-primary/30 active:scale-95 flex items-center justify-center gap-2 group relative overflow-hidden"
                            >
                                {isProcessing ? (
                                    <svg className="animate-spin h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <>
                                        <span>Confirmar Pedido</span>
                                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </>
                                )}
                            </button>

                            {/* Botón Solicitar Cotización (Restaurado Función Original) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); if (onQuote) onQuote(); }}
                                className="mt-3 group w-full py-4 rounded-2xl font-black text-sm md:text-base tracking-wide text-slate-500 bg-white border-2 border-slate-200 hover:border-brand-primary hover:text-brand-primary hover:shadow-xl hover:shadow-brand-primary/10 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5 text-slate-400 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Solicitar Cotización
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOTÓN FLOTANTE (FAB) REDISEÑADO CON COLORES DE MARCA */}
            <motion.button
                layout
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(96, 23, 177, 0.4)" }} // Sombra Brand Primary
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-white text-brand-primary ring-4 ring-brand-primary/20' : 'bg-gradient-to-tr from-brand-secondary to-brand-primary text-white'}`}
            >
                <div className="relative">
                    {/* Icono Cambiante */}
                    <AnimatePresence mode='wait'>
                        {isOpen ? (
                            <motion.svg key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></motion.svg>
                        ) : (
                            <motion.svg key="cart" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></motion.svg>
                        )}
                    </AnimatePresence>

                    {/* Badge Contador Pulsante */}
                    {!isOpen && items.length > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1.5 -right-1.5"
                        >
                            <span className="relative flex h-5 w-5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-5 w-5 bg-brand-accent border-2 border-brand-primary items-center justify-center text-[9px] font-bold text-brand-secondary">
                                    {items.length}
                                </span>
                            </span>
                        </motion.div>
                    )}
                </div>
            </motion.button>
        </>
    );
};
