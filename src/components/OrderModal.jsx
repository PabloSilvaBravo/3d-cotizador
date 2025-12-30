import { X, Send, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrderModal({ isOpen, onClose, orderData, onSubmit }) {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', comments: '' });
    const [sending, setSending] = useState(false);

    // Cerrar con ESC
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isOpen && e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Variantes para el contenedor principal (Modal)
    // Efecto de aparición elástica (Spring) + Stagger (Cascada)
    const modalVariants = {
        hidden: { opacity: 0, rotateX: -20, y: 100, scale: 0.9 },
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
                staggerChildren: 0.1, // Retraso entre la aparición de cada hijo
                delayChildren: 0.1
            }
        },
        exit: {
            opacity: 0,
            rotateX: 20,
            y: 100,
            scale: 0.9,
            transition: { duration: 0.3, ease: "easeInOut" }
        }
    };

    // Variantes para los elementos internos (Inputs, Textos)
    const itemVariants = {
        hidden: { opacity: 0, y: 30, rotateX: -10 },
        visible: {
            opacity: 1,
            y: 0,
            rotateX: 0,
            transition: { type: "spring", stiffness: 300, damping: 24 }
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        await onSubmit({ ...formData, phone: `+56${formData.phone}`, ...orderData });
        setSending(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center perspective-1000 overflow-y-auto overflow-x-hidden p-4">

                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* 3D Container Theme: Light Glass + Purple Accents */}
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="relative w-full max-w-lg z-10"
                        style={{ perspective: "1000px" }}
                    >
                        <div
                            className="
                                relative flex flex-col gap-6 p-8 rounded-3xl overflow-hidden
                                transition-all duration-300
                            "
                            style={{
                                background: "rgba(255, 255, 255, 0.85)", // Light Glass Background
                                backdropFilter: "blur(24px)",
                                boxShadow: "0 25px 50px -12px rgba(96, 23, 177, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.6)",
                                border: "1px solid rgba(96, 23, 177, 0.1)", // Borde morado suave
                                transformStyle: "preserve-3d",
                            }}
                        >
                            {/* Close Button */}
                            <motion.button
                                variants={itemVariants}
                                onClick={onClose}
                                className="absolute top-4 right-4 text-slate-400 hover:text-brand-primary transition-colors z-20"
                            >
                                <X size={24} />
                            </motion.button>

                            {/* Header */}
                            <motion.div variants={itemVariants} className="text-center space-y-2">
                                <h2 className="text-3xl font-black text-brand-secondary tracking-tight drop-shadow-sm">
                                    Finalizar Pedido
                                </h2>
                                <p className="text-sm text-slate-500 font-medium">Estás a un paso de materializar tu idea.</p>
                            </motion.div>

                            {/* Order Summary Card */}
                            <motion.div variants={itemVariants} className="bg-white/60 rounded-xl p-4 border border-brand-primary/10 space-y-2 text-sm text-slate-600 backdrop-blur-sm shadow-sm">
                                <div className="flex justify-between">
                                    <span>Archivo:</span>
                                    <span className="text-brand-dark font-bold truncate max-w-[200px]">{orderData.fileName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Material:</span>
                                    <span className="text-brand-primary font-bold">{orderData.material || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-brand-primary/10">
                                    <span className="font-bold text-brand-secondary uppercase tracking-wider text-xs">Total Estimado</span>
                                    <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-brand-accent drop-shadow-sm">
                                        ${orderData.price.toLocaleString('es-CL')}
                                    </span>
                                </div>
                            </motion.div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <motion.input
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02, rotateX: 2, borderColor: "rgba(96, 23, 177, 0.4)", backgroundColor: "rgba(255,255,255,1)" }}
                                    whileFocus={{ scale: 1.02, borderColor: "rgba(96, 23, 177, 0.8)", backgroundColor: "rgba(255,255,255,1)", outline: "none", boxShadow: "0 0 0 4px rgba(96, 23, 177, 0.1)" }}
                                    style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "rgba(96, 23, 177, 0.1)" }}
                                    type="text"
                                    placeholder="Nombre Completo"
                                    className="w-full text-brand-dark placeholder-slate-400 p-4 rounded-xl border shadow-sm transition-all font-medium"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <motion.input
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02, rotateX: 2, borderColor: "rgba(96, 23, 177, 0.4)", backgroundColor: "rgba(255,255,255,1)" }}
                                    whileFocus={{ scale: 1.02, borderColor: "rgba(96, 23, 177, 0.8)", backgroundColor: "rgba(255,255,255,1)", outline: "none", boxShadow: "0 0 0 4px rgba(96, 23, 177, 0.1)" }}
                                    style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "rgba(96, 23, 177, 0.1)" }}
                                    type="email"
                                    placeholder="Email de contacto"
                                    className="w-full text-brand-dark placeholder-slate-400 p-4 rounded-xl border shadow-sm transition-all font-medium"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                                {/* Input de Teléfono Controlado con +56 Fijo */}
                                <motion.div variants={itemVariants} className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold border-r border-slate-300 pr-2 pointer-events-none z-10 transition-colors group-focus-within:text-brand-primary group-focus-within:border-brand-primary/50">
                                        +56
                                    </span>
                                    <motion.input
                                        whileHover={{ scale: 1.02, rotateX: 2, borderColor: "rgba(96, 23, 177, 0.4)", backgroundColor: "rgba(255,255,255,1)" }}
                                        whileFocus={{ scale: 1.02, borderColor: "rgba(96, 23, 177, 0.8)", backgroundColor: "rgba(255,255,255,1)", outline: "none", boxShadow: "0 0 0 4px rgba(96, 23, 177, 0.1)" }}
                                        style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "rgba(96, 23, 177, 0.1)" }}
                                        type="tel"
                                        name="phone"
                                        autoComplete="tel"
                                        placeholder="9 1234 5678"
                                        className="w-full text-brand-dark placeholder-slate-300 p-4 pl-16 rounded-xl border shadow-sm transition-all font-medium tracking-wide"
                                        required
                                        value={formData.phone}
                                        onChange={e => {
                                            let val = e.target.value.replace(/\D/g, '');
                                            // Si el navegador autocompleta con 569..., quitamos el 56
                                            if (val.startsWith('56') && val.length > 9) {
                                                val = val.substring(2);
                                            }
                                            // Limitamos a 9 dígitos
                                            if (val.length > 9) val = val.substring(0, 9);

                                            setFormData({ ...formData, phone: val });
                                        }}
                                    />
                                </motion.div>

                                <motion.textarea
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.02, rotateX: 2, borderColor: "rgba(96, 23, 177, 0.4)", backgroundColor: "rgba(255,255,255,1)" }}
                                    whileFocus={{ scale: 1.02, borderColor: "rgba(96, 23, 177, 0.8)", backgroundColor: "rgba(255,255,255,1)", outline: "none", boxShadow: "0 0 0 4px rgba(96, 23, 177, 0.1)" }}
                                    style={{ backgroundColor: "rgba(255,255,255,0.6)", borderColor: "rgba(96, 23, 177, 0.1)" }}
                                    placeholder="Notas adicionales o instrucciones especiales..."
                                    className="w-full text-brand-dark placeholder-slate-400 p-4 rounded-xl border shadow-sm min-h-[100px] resize-none transition-all font-medium"
                                    value={formData.comments}
                                    onChange={e => setFormData({ ...formData, comments: e.target.value })}
                                />

                                <motion.button
                                    variants={itemVariants}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    disabled={sending}
                                    animate={{
                                        width: sending ? "60px" : "100%",
                                        borderRadius: sending ? "50%" : "0.75rem"
                                    }}
                                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }} // Curva Bezier suave
                                    className={`
                                        bg-gradient-to-r from-brand-secondary to-brand-primary text-white
                                        group relative mt-2 py-4 font-black text-lg uppercase tracking-widest shadow-lg
                                        flex items-center justify-center overflow-hidden mx-auto
                                        transition-colors duration-300
                                        ${sending ? 'cursor-wait' : 'hover:shadow-brand-primary/40'}
                                    `}
                                    style={{
                                        boxShadow: "0 10px 20px -5px rgba(96, 23, 177, 0.4)",
                                        height: "60px" // Altura fija para evitar saltos al transformarse
                                    }}
                                >
                                    <motion.div
                                        layout
                                        className="flex items-center justify-center gap-3 relative z-10 w-full h-full"
                                    >
                                        {/* ICONO PERSISTENTE */}
                                        <motion.div
                                            layout
                                            className={`relative z-10 filter drop-shadow-sm transition-all duration-500 ease-in-out ${!sending ? 'group-hover:translate-x-14 group-hover:scale-125' : ''}`}
                                            animate={sending ? {
                                                y: [0, -3, 0, 3, 0],
                                                rotate: [0, -2, 0, 2, 0],
                                                scale: [1, 1.1, 1]
                                            } : {
                                                y: 0, rotate: 0, scale: 1
                                            }}
                                            transition={sending ? {
                                                duration: 0.4,
                                                repeat: Infinity,
                                                ease: "linear"
                                            } : { duration: 0.3 }}
                                        >
                                            <Send size={sending ? 24 : 22} className={`text-white ${sending ? 'rotate-[-45deg]' : ''}`} style={sending ? { transform: 'rotate(-45deg)' } : {}} />
                                        </motion.div>

                                        {/* TEXTO COLAPSABLE */}
                                        <AnimatePresence>
                                            {!sending && (
                                                <motion.span
                                                    layout
                                                    initial={{ opacity: 1, width: "auto", scale: 1 }}
                                                    exit={{ opacity: 0, width: 0, scale: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="whitespace-nowrap transition-all duration-500 ease-in-out group-hover:opacity-0 group-hover:translate-x-10 filter drop-shadow-md overflow-hidden"
                                                >
                                                    Enviar Cotización
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>

                                    {/* ESTELAS (Solo visibles cuando enviando) */}
                                    <AnimatePresence>
                                        {sending && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute inset-0 pointer-events-none"
                                            >
                                                <motion.div
                                                    className="absolute right-3 top-1/2 w-8 h-0.5 bg-white/50 rounded-full"
                                                    animate={{ x: [-10, -30], opacity: [0, 1, 0] }}
                                                    transition={{ duration: 0.4, repeat: Infinity, delay: 0.1 }}
                                                />
                                                <motion.div
                                                    className="absolute right-4 bottom-1/3 w-6 h-0.5 bg-white/30 rounded-full"
                                                    animate={{ x: [-10, -25], opacity: [0, 1, 0] }}
                                                    transition={{ duration: 0.3, repeat: Infinity, delay: 0 }}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
