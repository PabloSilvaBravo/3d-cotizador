import React from 'react';
import { motion } from 'framer-motion';

const ItemAddedModal = ({ isOpen, onClose, onUploadAnother, onConfigureSame, onGoToCart, itemName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center border border-white/50"
            >
                {/* Header Exito */}
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-100">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>

                <h3 className="text-xl font-black text-brand-secondary mb-2">¡Agregado al Pedido!</h3>
                <p className="text-xs text-slate-500 mb-6 px-1 leading-relaxed">
                    <strong className="text-brand-primary">{itemName}</strong> está en tu carrito.
                    <br />¿Qué deseas hacer ahora?
                </p>

                <div className="space-y-2.5">
                    {/* Opción 1: Subir Nuevo (Reset Total) */}
                    <button
                        onClick={onUploadAnother}
                        className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-secondary transition-all shadow-lg hover:shadow-brand-primary/20 flex items-center justify-center gap-2 group text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span>Subir Otro Archivo</span>
                    </button>

                    {/* Opción 2: Mismo Archivo (Solo cerrar modal) */}
                    <button
                        onClick={onConfigureSame}
                        className="w-full bg-brand-light text-brand-secondary py-3 rounded-xl font-bold hover:bg-brand-primary/10 transition-all border border-transparent hover:border-brand-primary/20 flex items-center justify-center gap-2 text-sm"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        <span>Reutilizar Mismo Modelo</span>
                    </button>

                    {/* Opción 3: Ir al Pago */}
                    <button
                        onClick={onGoToCart}
                        className="w-full bg-white border border-slate-200 text-slate-500 py-3 rounded-xl font-bold hover:text-brand-dark hover:border-slate-300 transition-colors text-xs uppercase tracking-wide mt-2"
                    >
                        Continuar con el Carrito
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ItemAddedModal;
