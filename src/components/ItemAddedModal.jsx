import React from 'react';
import { motion } from 'framer-motion';

const ItemAddedModal = ({ isOpen, onClose, onUploadAnother, onConfigureSame, onGoToCart, itemName }) => {
    if (!isOpen) return null;

    // Animaciones 3D consistentes con OrderModal
    const modalVariants = {
        hidden: { opacity: 0, rotateX: -15, y: 80, scale: 0.92 },
        visible: {
            opacity: 1,
            rotateX: 0,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 25,
                mass: 1.2,
                staggerChildren: 0.08,
                delayChildren: 0.1
            }
        },
        exit: {
            opacity: 0,
            rotateX: 15,
            y: 80,
            scale: 0.92,
            transition: { duration: 0.25, ease: "easeInOut" }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20, rotateX: -8 },
        visible: {
            opacity: 1,
            y: 0,
            rotateX: 0,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ perspective: "1000px" }}>
            {/* Backdrop Premium Consistente */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Container con Glassmorphism Premium */}
            <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative w-full max-w-sm"
                style={{ perspective: "1000px" }}
            >
                <div
                    className="relative overflow-hidden p-7 text-center"
                    style={{
                        background: "rgba(255, 255, 255, 0.85)",
                        backdropFilter: "blur(24px)",
                        boxShadow: "0 25px 50px -12px rgba(96, 23, 177, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.6)",
                        border: "1px solid rgba(96, 23, 177, 0.1)",
                        borderRadius: "1.5rem", // rounded-3xl consistente
                        transformStyle: "preserve-3d",
                    }}
                >
                    {/* Header Éxito - Mejorado */}
                    <motion.div
                        variants={itemVariants}
                        className="w-16 h-16 bg-gradient-to-br from-green-50 to-emerald-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-100 shadow-lg shadow-green-500/20"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </motion.div>

                    <motion.h3
                        variants={itemVariants}
                        className="text-2xl font-black text-brand-secondary mb-2 tracking-tight"
                    >
                        ¡Agregado al Pedido!
                    </motion.h3>

                    <motion.p
                        variants={itemVariants}
                        className="text-xs text-slate-500 mb-6 px-1 leading-relaxed"
                    >
                        <strong className="text-brand-primary font-bold">{itemName}</strong> está en tu carrito.
                        <br />¿Qué deseas hacer ahora?
                    </motion.p>

                    {/* Botones con estilos premium consistentes */}
                    <div className="space-y-2.5">
                        {/* Opción 1: Subir Nuevo (Botón Principal) */}
                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onUploadAnother}
                            className="w-full bg-gradient-to-r from-brand-secondary to-brand-primary text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group text-sm shadow-lg shadow-brand-primary/30 hover:shadow-xl hover:shadow-brand-primary/40"
                        >
                            <svg className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span>Subir Otro Archivo</span>
                        </motion.button>

                        {/* Opción 2: Mismo Archivo (Botón Secundario) */}
                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onConfigureSame}
                            style={{
                                background: "rgba(255, 255, 255, 0.6)",
                                borderColor: "rgba(96, 23, 177, 0.15)"
                            }}
                            className="w-full text-brand-secondary py-3.5 rounded-xl font-bold transition-all border hover:border-brand-primary/30 hover:bg-white/80 backdrop-blur-sm flex items-center justify-center gap-2 text-sm shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Reutilizar Mismo Modelo</span>
                        </motion.button>

                        {/* Opción 3: Ir al Carrito (Botón Terciario) */}
                        <motion.button
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={onGoToCart}
                            className="w-full bg-white/40 border border-slate-200/60 text-slate-500 py-3 rounded-xl font-bold hover:text-brand-dark hover:border-slate-300/80 hover:bg-white/60 transition-all text-xs uppercase tracking-wide mt-3 backdrop-blur-sm"
                        >
                            Continuar con el Carrito
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ItemAddedModal;
