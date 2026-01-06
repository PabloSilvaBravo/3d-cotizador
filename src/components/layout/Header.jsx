import React, { useState, useRef, useEffect } from 'react';
import { MechatronicLogo } from '../ui/MechatronicLogo';
import { Mail, MessageCircle, ChevronDown, Globe, CheckCircle2 } from 'lucide-react';

export const Header = ({ isSimpleMode, onToggleSimpleMode, onHomeClick }) => {
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const helpRef = useRef(null);
    const [showCopyToast, setShowCopyToast] = useState(false);

    // Navegación: Reset interno si existe handler, sino ir a la web principal
    const handleLogoClick = () => {
        if (onHomeClick) {
            onHomeClick();
        } else {
            window.location.href = 'https://www.mechatronicstore.cl/';
        }
    };

    /**
     * Cierra el menú de ayuda si se hace clic fuera de su área.
     */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (helpRef.current && !helpRef.current.contains(event.target)) {
                setIsHelpOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEmailClick = (e) => {
        e.preventDefault();
        navigator.clipboard.writeText('ventas@mechatronicstore.cl');
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 2000);
    };

    return (
        <>
            {/* Toast de Copiado */}
            {showCopyToast && (
                <div className="fixed bottom-10 left-1/2 z-[100] -translate-x-1/2 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className="flex items-center gap-3 px-5 py-3 bg-zinc-900 text-white rounded-full border border-white/10 ring-1 ring-black/20">
                        <div className="bg-green-500 rounded-full p-0.5 shadow-sm shadow-green-500/50">
                            <CheckCircle2 size={16} className="text-white" strokeWidth={3} />
                        </div>
                        <span className="font-semibold text-sm tracking-wide">Correo copiado al portapapeles</span>
                    </div>
                </div>
            )}

            {/* Brand Header */}
            <header className="fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-xl bg-brand-primary border-b border-white/10 shadow-lg shadow-brand-primary/20">
                <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-0  flex items-center justify-between">

                    {/* Logo con Navegación y Efecto de Presión */}
                    <div
                        className="flex items-center gap-3 group cursor-pointer btn-press"
                        onClick={handleLogoClick}
                        title="Volver a MechatronicStore.cl"
                    >
                        <MechatronicLogo className="h-9 w-auto transition-all duration-300" />
                    </div>

                    <div className="flex items-center space-x-2 md:space-x-3">

                        {/* --- BOTÓN: IR A LA WEB --- */}
                        <a
                            href="https://www.mechatronicstore.cl/"
                            className="flex items-center gap-1.5 text-[10px] font-bold text-white/80 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/10 border border-transparent hover:border-white/10 transition-all"
                        >
                            <Globe size={12} className="text-brand-accent" />
                            <span className="hidden sm:inline">Ir a la Tienda</span>
                            <span className="sm:hidden">Tienda</span>
                        </a>

                        {/* --- DROPDOWN CENTRO DE AYUDA --- */}
                        <div className="relative" ref={helpRef}>
                            <button
                                onClick={() => setIsHelpOpen(!isHelpOpen)}
                                className={`
                    flex items-center gap-1.5 text-[10px] font-bold text-white/90 hover:text-white px-3 py-1.5 rounded-full transition-all border 
                    ${isHelpOpen ? 'bg-white/20 border-white/20' : 'hover:bg-white/10 border-transparent hover:border-white/10'}
                `}
                            >
                                <span className="hidden sm:inline">Centro de Ayuda</span>
                                <span className="sm:hidden">Ayuda</span>
                                <ChevronDown size={12} className={`transition-transform duration-300 ${isHelpOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isHelpOpen && (
                                <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-[60] animate-in fade-in zoom-in-95 origin-top-right ring-1 ring-black/5">

                                    {/* Header del Dropdown */}
                                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                                        <h3 className="font-bold text-brand-dark text-xs uppercase tracking-wide">Canales de Atención</h3>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Selecciona una opción para contactarnos</p>
                                    </div>

                                    {/* Lista de Opciones */}
                                    <div className="p-2 space-y-1">

                                        {/* Opción 1: Correo */}
                                        <a
                                            href="#"
                                            onClick={handleEmailClick}
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-brand-primary/5 transition-colors group"
                                        >
                                            <div className="bg-orange-100 text-orange-600 p-2 rounded-full shrink-0 group-hover:scale-110 transition-transform">
                                                <Mail size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700 group-hover:text-brand-primary transition-colors">Correo Electrónico</p>
                                                <p className="text-[10px] text-slate-500 font-medium">ventas@mechatronicstore.cl</p>
                                            </div>
                                        </a>

                                        {/* Opción 2: WhatsApp 1 */}
                                        <a
                                            href="https://wa.me/56992921801"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group"
                                        >
                                            <div className="bg-green-100 text-green-600 p-2 rounded-full shrink-0 group-hover:scale-110 transition-transform">
                                                <MessageCircle size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700 group-hover:text-green-700 transition-colors">WhatsApp Ventas 1</p>
                                                <p className="text-[10px] text-slate-500 font-medium">+56 9 9292 1801</p>
                                            </div>
                                        </a>

                                        {/* Opción 3: WhatsApp 2 */}
                                        <a
                                            href="https://wa.me/56976415188"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group"
                                        >
                                            <div className="bg-green-100 text-green-600 p-2 rounded-full shrink-0 group-hover:scale-110 transition-transform">
                                                <MessageCircle size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700 group-hover:text-green-700 transition-colors">WhatsApp Ventas 2</p>
                                                <p className="text-[10px] text-slate-500 font-medium">+56 9 7641 5188</p>
                                            </div>
                                        </a>

                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </header>
        </>
    );
};
