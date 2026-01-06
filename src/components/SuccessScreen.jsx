import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, Mail, Clock } from 'lucide-react';

const SuccessScreen = ({ onReset }) => {
    // Volver al inicio con ESC
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onReset();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onReset]);

    // Animaciones 3D consistentes con otros modales
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
                delayChildren: 0.15
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

    // Usar Portal para renderizar en body y asegurar visibilidad (z-index/overflow)
    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ perspective: "1000px" }}>
                {/* Backdrop Premium Unificado */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                {/* Modal Container con Glassmorphism Premium */}
                <motion.div
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative max-w-lg w-full"
                    style={{ perspective: "1000px" }}
                >
                    <div
                        className="relative overflow-hidden p-8 md:p-12 text-center"
                        style={{
                            background: "rgba(255, 255, 255, 0.85)",
                            backdropFilter: "blur(24px)",
                            boxShadow: "0 25px 50px -12px rgba(96, 23, 177, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.6)",
                            border: "1px solid rgba(96, 23, 177, 0.1)",
                            borderRadius: "1.5rem", // rounded-3xl consistente
                            transformStyle: "preserve-3d",
                        }}
                    >
                        {/* Elementos Decorativos de Fondo */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />

                        {/* Icono Animado con Brand Colors */}
                        <div className="relative w-32 h-32 mx-auto mb-8 z-10">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                className="absolute inset-0 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-full shadow-2xl shadow-brand-primary/30 flex items-center justify-center group"
                            >
                                <CheckCircle className="w-14 h-14 text-white drop-shadow-md" strokeWidth={3} />
                            </motion.div>
                            {/* Anillos de pulso brand-colored */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0.5 }}
                                animate={{ scale: 1.5, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                className="absolute inset-0 border-2 border-brand-primary/30 rounded-full"
                            />
                        </div>

                        {/* Textos */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="relative z-10"
                        >
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 tracking-tight">
                                ¡Cotización <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Enviada!</span>
                            </h1>

                            <p className="text-slate-500 mb-8 font-medium leading-relaxed">
                                Hemos recibido tu solicitud correctamente.<br />
                                Nuestro equipo de ingeniería revisará tu archivo y te contactará en breve.
                            </p>

                            {/* Timeline de Pasos Siguientes Estilizado */}
                            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 mb-8 text-left space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm shrink-0 text-brand-primary">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 text-sm">Revisión Técnica</h4>
                                        <p className="text-xs text-slate-400">Analizaremos la viabilidad de tu modelo.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm shrink-0 text-brand-secondary">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 text-sm">Confirmación por Correo</h4>
                                        <p className="text-xs text-slate-400">Te enviaremos la cotización final.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Botón CTA Estilo Brand */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={onReset}
                            className="
                            group relative w-full py-4 rounded-xl font-black text-lg shadow-xl shadow-brand-primary/20
                            bg-gradient-to-r from-brand-secondary to-brand-primary text-white flex items-center justify-center gap-3 overflow-hidden
                        "
                        >
                            {/* Shine Effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"></div>

                            <span className="relative z-20 uppercase tracking-wide text-sm">Volver al Inicio</span>
                            <ArrowRight className="w-5 h-5 relative z-20 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default SuccessScreen;
