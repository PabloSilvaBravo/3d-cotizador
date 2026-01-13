import React, { useState } from 'react';
import { MechatronicLogo } from './MechatronicLogoExport';
import { Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';

export const FooterExport: React.FC = () => {
    const [showCopyToast, setShowCopyToast] = useState(false);

    const handleEmailClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        navigator.clipboard.writeText('ventas@mechatronicstore.cl');
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 2000);
    };

    return (
        <>
            {/* Toast de Copiado (Local to Footer if clicked here) */}
            {showCopyToast && (
                <div className="fixed bottom-10 left-1/2 z-[100000] -translate-x-1/2 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none">
                    <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full border border-white/20 ring-1 ring-black/20 shadow-lg backdrop-blur-md">
                        <div className="bg-white/20 rounded-full p-1 shadow-inner">
                            <CheckCircle2 size={16} className="text-white" strokeWidth={3} />
                        </div>
                        <span className="font-semibold text-sm tracking-wide">Correo copiado al portapapeles</span>
                    </div>
                </div>
            )}

            <footer className="bg-brand-primary text-white border-t border-white/5 py-6 mt-auto relative overflow-hidden font-sans">
                {/* Decorative Top Line Gradient */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent"></div>

                <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-5">

                    {/* Logo Centrado con efecto sutil */}
                    <div className="opacity-90 hover:opacity-100 transition-opacity duration-300 transform hover:scale-105">
                        <MechatronicLogo className="h-8 w-auto" />
                    </div>

                    {/* Información de Contacto - Diseño limpio y espaciado */}
                    <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-[11px] font-medium text-white/70 tracking-wide">

                        <div className="flex items-center gap-2 group cursor-default">
                            <div className="p-1 rounded-full bg-white/5 group-hover:bg-brand-accent/20 transition-colors">
                                <MapPin size={13} className="text-brand-accent" />
                            </div>
                            <span className="group-hover:text-white transition-colors">Manuel Rodriguez 212, Curicó</span>
                        </div>

                        <a href="#" onClick={handleEmailClick} className="flex items-center gap-2 group">
                            <div className="p-1 rounded-full bg-white/5 group-hover:bg-brand-accent/20 transition-colors">
                                <Mail size={13} className="text-brand-accent" />
                            </div>
                            <span className="group-hover:text-white transition-colors">ventas@mechatronicstore.cl</span>
                        </a>

                        <div className="flex items-center gap-2 group">
                            <div className="p-1 rounded-full bg-white/5 group-hover:bg-brand-accent/20 transition-colors">
                                <Phone size={13} className="text-brand-accent" />
                            </div>
                            <div className="flex gap-3">
                                <a href="tel:+56992921801" className="hover:text-brand-accent transition-colors">+56 9 9292 1801</a>
                                <span className="text-white/20">|</span>
                                <a href="tel:+56976415188" className="hover:text-brand-accent transition-colors">+56 9 7641 5188</a>
                            </div>
                        </div>

                    </div>

                    {/* Copyright Section */}
                    <div className="w-full max-w-md border-t border-white/5 pt-4 mt-1 text-center">
                        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
                            © {new Date().getFullYear()} MechatronicStore Chile
                        </p>
                    </div>

                </div>
            </footer>
        </>
    );
};
