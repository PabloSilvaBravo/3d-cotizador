import React from 'react';
import { MechatronicLogo } from '../ui/MechatronicLogo';
import { Globe } from 'lucide-react';

export const Header = () => {
    const handleLogoClick = () => {
        window.location.href = 'https://www.mechatronicstore.cl/';
    };

    return (
        <header className="fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-xl bg-brand-primary border-b border-white/10 shadow-lg shadow-brand-primary/20">
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-0  flex items-center justify-between">

                {/* Logo con Navegación */}
                <div
                    className="flex items-center gap-3 group cursor-pointer btn-press"
                    onClick={handleLogoClick}
                    title="Volver a MechatronicStore.cl"
                >
                    <MechatronicLogo className="h-9 w-auto transition-all duration-300" />
                </div>

                <div className="flex items-center space-x-2 md:space-x-3">
                    {/* Botón: Ir a la Tienda */}
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
    );
};
