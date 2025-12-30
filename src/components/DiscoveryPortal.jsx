import React from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { Search, Download, Box, ExternalLink, X, Hexagon, Triangle, Circle } from 'lucide-react';

const Card = ({ title, description, badge, color, icon, href, isLarge = false, isCompact = false }) => {
    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`
                relative group overflow-hidden rounded-2xl border border-slate-200 flex 
                ${isCompact ? 'flex-row items-center gap-4 p-4 !aspect-auto bg-white/60' : 'flex-col justify-between p-6 bg-white aspect-square'}
                backdrop-blur-xl hover:bg-white hover:border-slate-300 transition-all duration-300 shadow-sm hover:shadow-xl
                ${isLarge ? 'col-span-1 md:col-span-3 aspect-[2/1] md:!aspect-[3/1]' : ''}
                ${isCompact ? 'col-span-1' : ''}
                cursor-pointer
            `}
        >
            {/* Glow Effect on Hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${color}`} />

            <div className={`relative z-10 flex ${isCompact ? 'items-center' : 'justify-between items-start w-full'}`}>
                {/* Icono 3D / Figura */}
                <div className={`
                    relative flex items-center justify-center 
                    ${isCompact ? 'w-12 h-12 rounded-xl' : 'w-14 h-14 rounded-2xl'} 
                    bg-gradient-to-br ${color} 
                    shadow-lg text-white
                    group-hover:scale-110 transition-transform duration-300
                    ${isLarge && !isCompact ? 'scale-110' : ''}
                `}>
                    {/* Sombra de color (Glow) */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${color} blur-lg opacity-40`} />

                    {/* Icono rotado */}
                    <div className="relative z-10 transform -rotate-6 group-hover:rotate-0 transition-transform duration-300">
                        {icon}
                    </div>
                </div>

                {badge && (
                    <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full shadow-lg shadow-brand-primary/20 ml-auto self-start">
                        {badge}
                    </span>
                )}
                {!badge && !isCompact && <ExternalLink className="w-5 h-5 text-slate-300 group-hover:text-brand-primary transition-colors self-start" />}
            </div>

            <div className={`relative z-10 ${isCompact ? '' : 'mt-4'}`}>
                <h3 className={`font-bold text-slate-800 group-hover:text-brand-primary transition-colors ${isCompact ? 'text-sm' : 'text-xl mb-1'}`}>
                    {title}
                </h3>
                {description && !isCompact && (
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        {description}
                    </p>
                )}
                {isCompact && <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-brand-primary ml-auto transition-colors" />}
            </div>
        </motion.a>
    );
};

const Step = ({ number, text, subtext }) => (
    <div className="flex flex-col items-center text-center gap-2 max-w-[140px]">
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm font-bold text-white mb-1">
            {number}
        </div>
        <p className="text-sm font-bold text-white">{text}</p>
        <p className="text-xs text-slate-400">{subtext}</p>
    </div>
);

const DiscoveryPortal = ({ onClose, onUploadClick }) => {
    // Cerrar con tecla ESC
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop con Blur y oscurecido para contraste (Spotlight Effect) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Contenedor Principal Unificado con Design System */}
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-5xl bg-white/90 backdrop-blur-2xl border border-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col md:flex-row h-auto max-h-[85vh] font-sans ring-4 ring-white/40"
            >
                {/* Botón Cerrar (Estilo UI Unificado) */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-400 hover:text-brand-primary transition-all border border-slate-200 shadow-sm hover:shadow-md"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Columna Izquierda: Inspiración & Pasos */}
                <div className="w-full md:w-1/3 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-200/50 flex flex-col relative overflow-y-auto custom-scrollbar bg-gradient-to-br from-white to-slate-50">
                    {/* Elemento decorativo de fondo */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none" />

                    <div className="relative z-10 flex-1 flex flex-col justify-center min-h-min">
                        <div className="mb-6">
                            <motion.div
                                initial={{ y: 0 }}
                                animate={{ y: -10 }}
                                transition={{ repeat: Infinity, repeatType: "mirror", duration: 3 }}
                                className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-brand-primary/10 mb-4 border border-slate-100"
                            >
                                <Search className="w-7 h-7 text-brand-primary" strokeWidth={2.5} />
                            </motion.div>
                            <h2 className="text-2xl font-black text-slate-800 leading-tight mb-2 hidden md:block">
                                Explora el <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                                    Universo 3D
                                </span>
                            </h2>
                            <h2 className="text-xl font-black text-slate-800 leading-tight mb-3 md:hidden">
                                Explora el Univero 3D
                            </h2>
                            <p className="text-slate-500 leading-relaxed text-xs font-medium">
                                ¿No tienes un archivo? <br />
                                Hay millones de objetos útiles listos para descargar.
                            </p>
                        </div>
                    </div>

                    {/* Pasos Rápidos (Timeline Visual Simplificada & Compacta) */}
                    <div className="relative z-10 pt-6 border-t border-slate-200 mt-auto">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">SIGUE ESTOS 3 PASOS</p>

                        <div className="relative space-y-6 pl-2">
                            {/* Línea conectora */}
                            <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-brand-primary/20 via-brand-secondary/20 to-transparent -z-10" />

                            {/* Paso 1 */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex items-center gap-3 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-white border-2 border-brand-primary/30 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform relative z-10 shrink-0">
                                    <Search className="w-4 h-4 text-brand-primary" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700 text-xs">1. Elige tu Modelo</h4>
                                    <p className="text-[10px] text-slate-500">Entra a una de las páginas.</p>
                                </div>
                            </motion.div>

                            {/* Paso 2 */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="flex items-center gap-3 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-white border-2 border-brand-secondary/30 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform relative z-10 shrink-0">
                                    <Download className="w-4 h-4 text-brand-secondary" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700 text-xs">2. Descargar Archivo</h4>
                                    <p className="text-[10px] text-slate-500">Busca <span className="font-bold text-brand-secondary">Download STL</span>.</p>
                                </div>
                            </motion.div>

                            {/* Paso 3 */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 }}
                                className="flex items-center gap-3 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform relative z-10 shrink-0">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                                    <Box className="w-4 h-4 text-slate-500 absolute" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700 text-xs">3. Tráelo aquí</h4>
                                    <p className="text-[10px] text-slate-500">Sube ese archivo.</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>


                    {/* Botón CTA Final (Compacto & Estilizado) */}
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ delay: 0.2 }}
                        onClick={onUploadClick}
                        className="relative z-50 group w-full mt-6 py-3 px-4 rounded-xl font-black text-sm uppercase tracking-wide shadow-lg shadow-brand-primary/20 bg-gradient-to-r from-brand-secondary to-brand-primary text-white flex items-center justify-center gap-2 transform overflow-hidden"
                    >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"></div>

                        <div className="relative z-20 flex items-center justify-center gap-2">
                            <span>¡Listo! Subir Archivo</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                        </div>
                    </motion.button>
                </div>

                {/* Columna Derecha: El Grid de Cards */}
                <div className="flex-1 p-6 md:p-8 bg-slate-50/50 overflow-y-auto custom-scrollbar">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span>
                        Recomendados por Nosotros
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* MakerWorld - Destacado */}
                        <Card
                            title="MakerWorld"
                            description="Nuestra Recomendación. Modelos verificados para máxima compatibilidad con nuestras impresoras."
                            badge="Recomendado"
                            color="from-slate-400 to-slate-600"
                            icon={<Box className="w-8 h-8" strokeWidth={1.5} />}
                            href="https://makerworld.com/en"
                            isLarge={true}
                        />

                        {/* Printables */}
                        <Card
                            title="Printables"
                            color="from-orange-500 to-red-500"
                            icon={<Triangle className="w-6 h-6 fill-current" strokeWidth={2} />}
                            href="https://www.printables.com/"
                            isCompact={true}
                        />

                        {/* Thingiverse */}
                        <Card
                            title="Thingiverse"
                            color="from-blue-500 to-indigo-600"
                            icon={<Circle className="w-6 h-6" strokeWidth={2.5} />}
                            href="https://www.thingiverse.com/"
                            isCompact={true}
                        />

                        {/* Cults3D */}
                        <Card
                            title="Cults3D"
                            color="from-purple-500 to-fuchsia-600"
                            icon={<Hexagon className="w-6 h-6 fill-current" strokeWidth={1.5} />}
                            href="https://cults3d.com/"
                            isCompact={true}
                        />
                    </div>

                    <div className="mt-8 p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start gap-4">
                        <div className="p-2 bg-slate-100 rounded-full shrink-0">
                            <Download className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-800 font-bold mb-1">Tip</p>
                            <p className="text-xs text-slate-500 italic">
                                Al descargar, busca siempre el botón "Download STL". Si hay varios archivos, busca el que represente la pieza completa.
                            </p>
                        </div>
                    </div>
                </div >
            </motion.div >
        </div >,
        document.body
    );
};

export default DiscoveryPortal;
