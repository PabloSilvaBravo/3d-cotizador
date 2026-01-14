import React, { useState } from 'react';
import { MechatronicLogo } from '../ui/MechatronicLogo';
import { Home, CheckCircle2 } from 'lucide-react';

export const Header = () => {
    const [showCopyToast, setShowCopyToast] = useState(false);


    const handleLogoClick = () => {
        window.location.href = 'https://www.mechatronicstore.cl/';
    };

    const handleEmailClick = (e) => {
        e.preventDefault();
        navigator.clipboard.writeText('ventas@mechatronicstore.cl');
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 2000);
    };

    return (
        <div className="fixed top-0 w-full z-[99999] flex flex-col font-sans">
            <style>{`
                /* --- ESTILOS BARRA SUPERIOR (Usuario) --- */
                .banner-container-fixed {
                    font-family: 'Montserrat', sans-serif;
                    background: linear-gradient(180deg, #121212 -50%, #6017b1 200%, #000000 250%);
                    padding: 10px 12px;
                    font-size: 15px;
                }

                /* BARRA UNIFICADA - Logo + Contacto + Botones */
                .unified-header {
                    background-color: #6017b1; 
                    color: #ffffff;
                    font-family: 'Montserrat', sans-serif;
                    font-size: 13px;
                    font-weight: 400; 
                    width: 100%;
                    border-bottom: 2px solid rgba(255,255,255,0.1);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    min-height: 60px;
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* Estado Compacto */
                .unified-header.compact {
                    min-height: 28px;
                    padding: 0;
                }

                .unified-container {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr; /* Grid simétrico para centrado perfecto */
                    align-items: center;
                    width: 100%;
                    max-width: 64rem; /* 5xl para alinearse con el contenido principal */
                    margin: 0 auto;
                    padding: 12px 10px;
                    gap: 24px;
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .unified-header.compact .unified-container {
                    padding: 2px 10px;
                }

                .logo-section {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    transform-origin: left center;
                    justify-self: start; /* Alinear a la izquierda del primer 1fr */
                    min-width: max-content; /* Evitar que el grid lo aplaste */
                }



                .unified-header.compact .logo-section {
                    transform: scale(0.8);
                }

                .logo-section:hover {
                    opacity: 0.9;
                }

                .center-section {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 24px;
                    justify-self: center; /* Centrado absoluto */
                }

                .buttons-section {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 12px;
                    justify-self: end; /* Alinear a la derecha del último 1fr */
                }

                .nav-items {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .nav-items li {
                    display: flex;
                    align-items: center;
                    height: 100%;
                }

                .nav-items a {
                    color: #ffffff;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    height: 100%;
                    gap: 6px; 
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    transition: all 0.4s ease;
                    font-size: 12px;
                }
                
                .unified-header.compact .nav-items a {
                    gap: 0;
                }

                .nav-items a span {
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    max-width: 350px;
                    opacity: 1;
                    height: auto;
                    overflow: hidden;
                    white-space: nowrap;
                    display: inline-block;
                }
                
                .unified-header.compact .nav-items a span {
                    max-width: 0;
                    opacity: 0;
                    margin: 0;
                    padding: 0;
                }

                .nav-items a:hover {
                    opacity: 0.85;
                }

                .icon-svg {
                    width: 16px;
                    height: 16px;
                    display: block;
                    flex-shrink: 0;
                }
                
                .icon-social {
                    width: 14px;
                    height: 14px;
                    display: block;
                }

                .unified-header.compact .nav-item-divider {
                    opacity: 1;
                    width: 1px;
                    height: 14px;
                    margin: 0 4px;
                    background: rgba(255, 255, 255, 0.2);
                }

                /* Separador especial entre contacto y redes */
                .spacer-div {
                    width: 24px;
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                /* En compacto, el spacer se convierte en otro divisor */
                .unified-header.compact .spacer-div {
                    width: 1px;
                    height: 14px;
                    background: rgba(255, 255, 255, 0.2);
                    margin: 0 4px;
                }

                .quote-wrapper {
                    position: relative;
                    display: inline-block;
                }

                .quote-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    height: 32px;
                    padding: 0 14px;
                    border: 1px solid #ffffff;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    background: transparent;
                    white-space: nowrap;
                    color: #ffffff;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .quote-btn:hover {
                    background-color: rgba(255,255,255,0.15);
                    transform: translateY(-1px);
                }

                .badge-new {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background-color: #FFD700;
                    color: #1a1a1a;
                    font-size: 8px;
                    font-weight: 700;
                    line-height: 1;
                    padding: 3px 6px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    pointer-events: none;
                    white-space: nowrap;
                    z-index: 1;
                }

                .social-icons-wrapper {
                    display: flex;
                    gap: 6px;
                }

                .social-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    border-radius: 50%;
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                /* Redes sociales en modo compacto: Solo icono, alineado */
                .unified-header.compact .social-btn {
                    border: none;
                    background: transparent;
                    width: 20px; /* Ancho fijo para alineación */
                    height: 20px;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .unified-header.compact .social-icons-wrapper {
                    gap: 8px; /* Espaciado uniforme */
                    align-items: center;
                    display: flex;
                }

                /* Divisores entre redes sociales */
                .social-divider {
                    display: none;
                    width: 0;
                }
                .unified-header.compact .social-divider {
                    display: block;
                    width: 1px;
                    height: 14px;
                    background: rgba(255, 255, 255, 0.2);
                    margin: 0 4px;
                }
                .unified-header.compact:hover .social-divider {
                    display: none;
                }
                
                /* Ocultar divisor adyacente al hacer hover en un botón social */
                .unified-header.compact .social-btn:hover + .social-divider,
                .unified-header.compact .social-divider:has(+ .social-btn:hover) {
                    opacity: 0;
                }

                /* Ajuste fino de iconos para alineación óptica */
                .unified-header.compact .icon-svg,
                .unified-header.compact .social-btn svg,
                .unified-header.compact .nav-items a svg { /* Selector más específico */
                    width: 16px; 
                    height: 16px;
                    display: block;
                    margin: 0; /* Asegurar sin márgenes */
                    transform: translateY(0); /* Resetear cualquier transform previo */
                }
                
                /* Resetear paddings en enlaces compactos para evitar desalineación */
                .unified-header.compact .nav-items a {
                    padding: 0;
                    height: auto;
                }

                /* Ajuste específico para el icono de teléfono en modo compacto */
                .unified-header.compact .phone-link {
                    transform: translateY(-0.5px);
                }

                .unified-header.compact .social-btn.tiktok {
                    transform: translateY(-0.5px);
                }
                
                /* Restaurar círculos en todos los botones al hacer hover sobre el header */
                .unified-header.compact:hover .social-btn {
                    width: 28px;
                    height: 28px;
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    padding: 0;
                }

                /* Efecto hover específico del botón: Colores de marca y Texto blanco */
                .unified-header.compact .social-btn:hover {
                    color: #ffffff;
                    transform: translateY(-2px);
                    border-color: transparent; /* El fondo define el borde */
                }

                /* Instagram Gradient */
                .unified-header.compact .social-btn.instagram:hover,
                .social-btn.instagram:hover {
                    background-color: #2ebea3;
                    border-color: transparent;
                    color: white;
                }

                /* TikTok Black */
                .unified-header.compact .social-btn.tiktok:hover,
                .social-btn.tiktok:hover {
                    background-color: #000000;
                    border-color: #000000;
                    color: white;
                }

                /* YouTube Red */
                .unified-header.compact .social-btn.youtube:hover,
                .social-btn.youtube:hover {
                    background-color: #FF0000;
                    border-color: #FF0000;
                    color: white;
                }
                
                .unified-header.compact .social-btn:hover svg,
                .social-btn:hover svg {
                    fill: #ffffff;
                }

                /* --- TOOLTIPS --- */
                .social-btn {
                    position: relative;
                }

                /* Tooltip Body */
                .social-btn::before {
                    content: attr(data-tooltip);
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%) translateY(10px);
                    background: #000;
                    color: #fff;
                    padding: 5px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-family: 'Inter', sans-serif;
                    font-weight: 500;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-bottom: 8px; 
                    z-index: 1000;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }

                /* Tooltip Arrow */
                .social-btn::after {
                    content: '';
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%) translateY(10px);
                    border-width: 5px;
                    border-style: solid;
                    border-color: #000 transparent transparent transparent;
                    opacity: 0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-bottom: -1px;
                    z-index: 1000;
                    pointer-events: none;
                }

                .social-btn:hover::before,
                .social-btn:hover::after {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }

                .store-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 20px;
                    border-radius: 100px;
                    border: 1.5px solid rgba(255,255,255,0.5);
                    background: rgba(255,255,255,0);
                    color: #ffffff;
                    text-decoration: none;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    white-space: nowrap;
                    overflow: hidden;
                }
                
                .unified-header.compact .store-btn {
                    padding: 4px;
                    width: 24px;
                    height: 24px;
                    border-radius: 100px;
                    justify-content: center;
                    gap: 0;
                }
                
                .unified-header.compact .store-btn span {
                    max-width: 0;
                    opacity: 0;
                    display: none;
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }

                /* --- HOVER EN MODO COMPACTO: Mostrar textos pero mantener altura --- */
                
                /* Restaurar textos */
                .unified-header.compact:hover .nav-items a span {
                    max-width: 350px;
                    opacity: 1;
                    margin: 0;
                }
                
                .unified-header.compact:hover .nav-items a {
                    gap: 6px;
                }

                /* Restaurar divisores */
                .unified-header.compact:hover .nav-item-divider {
                    opacity: 1;
                    width: 1px;
                }
                
                /* Restaurar separadores */
                .unified-header.compact:hover .spacer-div {
                    width: 24px;
                    background: transparent;
                }

                /* Restaurar botón store (expandir a píldora) */
                .unified-header.compact:hover .store-btn {
                    width: auto;
                    height: auto;
                    padding: 4px 12px; /* Un poco menos de padding que el full para caber en 28px */
                    border-radius: 99px;
                    background: rgba(255,255,255,);
                    gap: 10px;
                }
                
                .unified-header.compact:hover .store-btn span {
                    display: inline-block;
                    max-width: 200px;
                    opacity: 1;
                    transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .store-btn:hover {
                    background: rgba(255,255,255,0.2);
                    border-color: rgba(255,255,255,0.6);
                    transform: translateY(-1px);
                }

                @media (max-width: 1200px) {
                    /* Grid adaptativo, reducimos gaps si es necesario, pero la estructura 1fr auto 1fr se mantiene */
                    .unified-container {
                        padding: 12px 16px; 
                        gap: 12px;
                    }
                    .center-section {
                        gap: 16px;
                    }
                }

                @media (max-width: 768px) {
                    /* El bloque central con contactos y redes sociales se elimina del flujo */
                    .center-section {
                        display: none;
                    }

                    .unified-container {
                        display: flex; /* Cambiamos de Grid a Flex */
                        justify-content: space-between; /* Empuja el Logo a la izq y Botones a la der */
                        padding: 8px 12px !important; /* Reducimos padding lateral */
                        gap: 12px;
                    }

                    .store-btn {
                        padding: 0 !important;      /* Quitamos padding lateral de texto */
                        width: 32px !important;     /* Ancho fijo cuadrado */
                        height: 32px !important;    /* Alto fijo cuadrado */
                        display: flex;
                        align-items: center;
                        justify-content: center;    /* Centrado perfecto del icono */
                        
                        /* UX Móvil: Fondo semitransparente para que parezca "tocable" */
                        background: rgba(255,255,255,0.1); 
                        border: 1px solid rgba(255,255,255,0.2);
                    }

                    /* Prevenimos que el botón crezca al tocarlo en móviles */
                    .unified-header.compact:hover .store-btn {
                        width: 32px !important;
                        padding: 0 !important;
                        background: rgba(255,255,255,0.1);
                        border-radius: 100px; /* Mantener borde redondeado */
                        height: 32px !important;
                    }

                    /* Aseguramos que el texto (span) siga oculto */
                    .unified-header.compact:hover .store-btn span {
                        display: none !important;
                    }
                }


            `}</style>

            {/* 1. Banner Envio Gratis */}
            <div className="banner-container-fixed">
                <p style={{ margin: 0, lineHeight: 1.4, color: '#fff', fontWeight: 400, textAlign: 'center' }}>
                    ¡<span style={{ color: '#ffef37' }}>Envío gratis</span> a todo Chile en compras sobre <span style={{ color: '#ffef37' }}>$19.990</span> (solo web)!
                </p>
            </div>

            {/* 2. BARRA UNIFICADA: Logo + Contacto + Botones */}
            <div className="unified-header compact">
                <div className="unified-container">

                    {/* IZQUIERDA: Logo */}
                    <div className="logo-section" onClick={handleLogoClick} title="Volver a MechatronicStore.cl">
                        <MechatronicLogo />
                    </div>

                    {/* CENTRO: Contacto + Cotización + Redes Sociales */}
                    <div className="center-section">
                        <ul className="nav-items">
                            {/* Email */}
                            <li>
                                <a href="mailto:ventas@mechatronicstore.cl" title="ventas@mechatronicstore.cl" onClick={handleEmailClick}>
                                    <svg className="icon-svg" viewBox="0 0 1024 1024" fill="#ffffff">
                                        <path transform="translate(0, 960) scale(1, -1)" d="M928 832h-832c-52.8 0-96-43.2-96-96v-640c0-52.8 43.2-96 96-96h832c52.8 0 96 43.2 96 96v640c0 52.8-43.2 96-96 96zM398.741 409.627l-270.741-210.891v501.641l270.741-290.75zM176.379 704h671.241l-335.621-252-335.621 252zM409.289 398.302l102.711-110.302 102.711 110.302 210.553-270.302h-626.528l210.553 270.302zM625.259 409.627l270.741 290.75v-501.641l-270.741 210.891z" />
                                    </svg>
                                    <span>VENTAS@MECHATRONICSTORE.CL</span>
                                </a>
                            </li>

                            <li className="nav-item-divider"></li>

                            {/* Teléfono */}
                            <li>
                                <a href="tel:+56976167930" title="Llamar a +56 9 7616 7930" className="phone-link">
                                    <svg className="icon-svg" viewBox="0 0 1024 1024" fill="#ffffff">
                                        <path transform="translate(0, 960) scale(1, -1)" d="M736 320c-64-64-64-128-128-128s-128 64-192 128-128 128-128 192 64 64 128 128-128 256-192 256-192-192-192-192c0-128 131.5-387.5 256-512s384-256 512-256c0 0 192 128 192 192s-192 256-256 192z" />
                                    </svg>
                                    <span>+56 9 7616 7930</span>
                                </a>
                            </li>

                            {/* Separador Grande entre Contacto y Redes */}
                            <li className="spacer-div"></li>



                            {/* Redes Sociales */}
                            <li>
                                <div className="social-icons-wrapper">
                                    <a href="https://www.instagram.com/mechatronicstore.cl/" target="_blank" rel="noopener noreferrer" className="social-btn instagram" aria-label="Instagram" data-tooltip="Síguenos en Instagram">
                                        <svg className="icon-social" viewBox="0 0 1024 1024" fill="#ffffff">
                                            <path transform="translate(0, 960) scale(1, -1)" d="M512 867.8c136.8 0 153-0.6 206.8-3 50-2.2 77-10.6 95-17.6 23.8-9.2 41-20.4 58.8-38.2 18-18 29-35 38.4-58.8 7-18 15.4-45.2 17.6-95 2.4-54 3-70.2 3-206.8s-0.6-153-3-206.8c-2.2-50-10.6-77-17.6-95-9.2-23.8-20.4-41-38.2-58.8-18-18-35-29-58.8-38.4-18-7-45.2-15.4-95-17.6-54-2.4-70.2-3-206.8-3s-153 0.6-206.8 3c-50 2.2-77 10.6-95 17.6-23.8 9.2-41 20.4-58.8 38.2-18 18-29 35-38.4 58.8-7 18-15.4 45.2-17.6 95-2.4 54-3 70.2-3 206.8s0.6 153 3 206.8c2.2 50 10.6 77 17.6 95 9.2 23.8 20.4 41 38.2 58.8 18 18 35 29 58.8 38.4 18 7 45.2 15.4 95 17.6 53.8 2.4 70 3 206.8 3zM512 960c-139 0-156.4-0.6-211-3-54.4-2.4-91.8-11.2-124.2-23.8-33.8-13.2-62.4-30.6-90.8-59.2-28.6-28.4-46-57-59.2-90.6-12.6-32.6-21.4-69.8-23.8-124.2-2.4-54.8-3-72.2-3-211.2s0.6-156.4 3-211c2.4-54.4 11.2-91.8 23.8-124.2 13.2-33.8 30.6-62.4 59.2-90.8 28.4-28.4 57-46 90.6-59 32.6-12.6 69.8-21.4 124.2-23.8 54.6-2.4 72-3 211-3s156.4 0.6 211 3c54.4 2.4 91.8 11.2 124.2 23.8 33.6 13 62.2 30.6 90.6 59s46 57 59 90.6c12.6 32.6 21.4 69.8 23.8 124.2 2.4 54.6 3 72 3 211s-0.6 156.4-3 211c-2.4 54.4-11.2 91.8-23.8 124.2-12.6 34-30 62.6-58.6 91-28.4 28.4-57 46-90.6 59-32.6 12.6-69.8 21.4-124.2 23.8-54.8 2.6-72.2 3.2-211.2 3.2v0zM512 711c-145.2 0-263-117.8-263-263s117.8-263 263-263 263 117.8 263 263c0 145.2-117.8 263-263 263zM512 277.4c-94.2 0-170.6 76.4-170.6 170.6s76.4 170.6 170.6 170.6c94.2 0 170.6-76.4 170.6-170.6s-76.4-170.6-170.6-170.6zM846.8 721.4c0-33.91-27.49-61.4-61.4-61.4s-61.4 27.49-61.4 61.4c0 33.91 27.49 61.4 61.4 61.4s61.4-27.49 61.4-61.4z" />
                                        </svg>
                                    </a>

                                    <span className="social-divider"></span>

                                    <a href="https://www.tiktok.com/@mechatronicstore.cl" target="_blank" rel="noopener noreferrer" className="social-btn tiktok" aria-label="TikTok" data-tooltip="Síguenos en TikTok">
                                        <svg className="icon-social" viewBox="0 0 1024 1024" fill="#ffffff">
                                            <path transform="translate(0, 960) scale(1, -1)" d="M534.613 959.147c55.893 0.853 111.36 0.427 166.827 0.853 3.413-65.28 26.88-131.84 74.667-177.92 47.787-47.36 115.2-69.12 180.907-76.373v-171.947c-61.44 2.133-123.307 14.933-179.2 41.387-24.32 11.093-46.933 25.173-69.12 39.68-0.427-124.587 0.427-249.173-0.853-373.333-3.413-59.733-23.040-119.040-57.6-168.107-55.893-81.92-152.747-135.253-252.16-136.96-61.013-3.413-122.027 13.227-174.080 43.947-86.187 50.773-146.773 143.787-155.733 243.627-0.853 21.333-1.28 42.667-0.427 63.573 7.68 81.067 47.787 158.72 110.080 211.627 70.827 61.44 169.813 90.88 262.4 73.387 0.853-63.147-1.707-126.293-1.707-189.44-42.24 13.653-91.733 9.813-128.853-15.787-26.88-17.493-47.36-44.373-58.027-74.667-8.96-21.76-6.4-45.653-5.973-68.693 10.24-69.973 77.653-128.853 149.333-122.453 47.787 0.427 93.44 28.16 118.187 68.693 8.107 14.080 17.067 28.587 17.493 45.227 4.267 76.373 2.56 152.32 2.987 228.693 0.427 171.947-0.427 343.467 0.853 514.987z" />
                                        </svg>
                                    </a>

                                    <span className="social-divider"></span>

                                    <a href="https://www.youtube.com/channel/UCduHpxJBRrJBa2lgT0NPFbQ" target="_blank" rel="noopener noreferrer" className="social-btn youtube" aria-label="YouTube" data-tooltip="Síguenos en Youtube">
                                        <svg className="icon-social" viewBox="0 0 1024 1024" fill="#ffffff">
                                            <path transform="translate(0, 960) scale(1, -1)" d="M832 832h-640c-105.6 0-192-86.4-192-192v-384c0-105.6 86.4-192 192-192h640c105.6 0 192 86.4 192 192v384c0 105.6-86.4 192-192 192zM384 192v512l320-256-320-256z" />
                                        </svg>
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* DERECHA: Botón Ir a la Web */}
                    <div className="buttons-section">
                        <a href="https://www.mechatronicstore.cl/" className="store-btn" title="Ir a la web">
                            <Home size={16} />
                            <span>Tienda</span>
                        </a>
                    </div>

                </div>
            </div>

            {/* Toast de Copiado */}
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
        </div>
    );
};
