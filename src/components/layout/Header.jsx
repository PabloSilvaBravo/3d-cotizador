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

                    </div>
                </div>
            </header>
        </>
    );
};
