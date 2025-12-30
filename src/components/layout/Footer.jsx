import React, { useState } from 'react';
import { MechatronicLogo } from '../ui/MechatronicLogo';
import { Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';

export const Footer = () => {
    const [showCopyToast, setShowCopyToast] = useState(false);

    const handleEmailClick = (e) => {
        e.preventDefault();
        navigator.clipboard.writeText('ventas@mechatronicstore.cl');
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 2000);
    };

    return (
        <>
            {/* Toast de Copiado (Local to Footer if clicked here) */}
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

            <footer className="bg-brand-primary text-white border-t border-white/5 py-10 mt-auto relative overflow-hidden">
                {/* Decorative Top Line Gradient */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent"></div>

                <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-8">

                    {/* Logo Centrado con efecto sutil */}
                    <div className="opacity-90 hover:opacity-100 transition-opacity duration-300 transform hover:scale-105">
                        <MechatronicLogo className="h-9 w-auto" />
                    </div>

                    {/* Información de Contacto - Diseño limpio y espaciado */}
                    <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4 text-xs font-medium text-white/70 tracking-wide">

                        <div className="flex items-center gap-2.5 group cursor-default">
                            <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-brand-accent/20 transition-colors">
                                <MapPin size={14} className="text-brand-accent" />
                            </div>
                            <span className="group-hover:text-white transition-colors">Manuel Rodriguez 212, Curicó</span>
                        </div>

                        <a href="#" onClick={handleEmailClick} className="flex items-center gap-2.5 group">
                            <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-brand-accent/20 transition-colors">
                                <Mail size={14} className="text-brand-accent" />
                            </div>
                            <span className="group-hover:text-white transition-colors">ventas@mechatronicstore.cl</span>
                        </a>

                        <div className="flex items-center gap-2.5 group">
                            <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-brand-accent/20 transition-colors">
                                <Phone size={14} className="text-brand-accent" />
                            </div>
                            <div className="flex gap-4">
                                <a href="tel:+56992921801" className="hover:text-brand-accent transition-colors">+56 9 9292 1801</a>
                                <span className="text-white/20">|</span>
                                <a href="tel:+56976415188" className="hover:text-brand-accent transition-colors">+56 9 7641 5188</a>
                            </div>
                        </div>

                    </div>

                    {/* Copyright Section */}
                    <div className="w-full max-w-md border-t border-white/5 pt-5 mt-2 text-center">
                        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">
                            © {new Date().getFullYear()} MechatronicStore Chile
                        </p>
                    </div>

                </div>
            </footer>
        </>
    );
};
