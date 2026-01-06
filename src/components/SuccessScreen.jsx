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

    // Usar Portal para renderizar en body y asegurar visibilidad (z-index/overflow)
    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Backdrop Dark Glass */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 25 }}
                    className="relative max-w-lg w-full bg-white/90 backdrop-blur-2xl border border-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(79,70,229,0.15)] p-8 md:p-12 text-center ring-4 ring-white/40 overflow-hidden"
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
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default SuccessScreen;
