import React, { useState } from 'react';
import { MechatronicLogo } from '../ui/MechatronicLogo';
import { Globe, CheckCircle2 } from 'lucide-react';

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
        <div className="fixed top-0 w-full z-50 flex flex-col font-sans">
            <style>{`
                /* --- ESTILOS BARRA SUPERIOR (Usuario) --- */
                .banner-container-fixed {
                    font-family: 'Montserrat', sans-serif;
                    background: linear-gradient(180deg, #121212 -50%, #6017b1 200%, #000000 250%);
                    padding: 8px 12px;
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
                }

                .unified-container {
                    display: grid;
                    grid-template-columns: 200px 1fr 200px;
                    align-items: center;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 12px 24px;
                    gap: 24px;
                }

                .logo-section {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    transition: opacity 0.3s;
                }

                .logo-section:hover {
                    opacity: 0.9;
                }

                .center-section {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 24px;
                }

                .buttons-section {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 12px;
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
                }

                .nav-items a {
                    color: #ffffff;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 6px; 
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    transition: opacity 0.2s;
                    font-size: 12px;
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

                .nav-item-divider {
                    width: 1px;
                    height: 20px;
                    background: rgba(255, 255, 255, 0.3);
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
                    transition: all 0.3s ease;
                }

                .social-btn:hover {
                    background-color: #ffffff;
                    color: #6017b1;
                    transform: translateY(-2px);
                }
                
                .social-btn:hover svg {
                    fill: #6017b1;
                }

                .store-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 12px;
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.4);
                    background: rgba(255,255,255,0.1);
                    color: #ffffff;
                    text-decoration: none;
                    font-size: 10.5px;
                    font-weight: 600;
                    transition: all 0.2s;
                }

                .store-btn:hover {
                    background: rgba(255,255,255,0.2);
                    border-color: rgba(255,255,255,0.6);
                    transform: translateY(-1px);
                }

                @media (max-width: 1200px) {
                    .unified-container {
                        grid-template-columns: 180px 1fr 180px;
                        gap: 16px;
                    }
                    .nav-items a span {
                        display: none;
                    }
                    .center-section {
                        gap: 16px;
                    }
                }

                @media (max-width: 850px) {
                    .unified-header {
                        display: none;
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
            <div className="unified-header">
                <div className="unified-container">

                    {/* IZQUIERDA: Logo */}
                    <div className="logo-section" onClick={handleLogoClick} title="Volver a MechatronicStore.cl">
                        <MechatronicLogo />
                    </div>

                    {/* CENTRO: Contacto + Cotización + Redes Sociales */}
                    <div className="center-section">
                        <ul className="nav-items">
                            {/* Ubicación Tienda */}
                            <li>
                                <a href="https://maps.google.com/?q=Rodriguez 212, Curicó" target="_blank" rel="noopener noreferrer" title="Rodriguez 212, Curicó">
                                    <svg className="icon-svg" viewBox="0 0 1024 1024" fill="#ffffff">
                                        <path transform="translate(0, 960) scale(1, -1)" d="M546.24 866.24c-124.992 124.992-327.488 124.992-452.512 0-124.992-124.928-124.992-327.616 0-452.48 0.032 0 226.272-221.76 226.272-477.76 0 256 226.24 477.76 226.24 477.76 125.024 124.864 125.024 327.552 0 452.48zM320 512c-70.752 0-128 57.248-128 128s57.248 128 128 128 128-57.248 128-128-57.248-128-128-128z" />
                                    </svg>
                                    <span>TIENDA</span>
                                </a>
                            </li>

                            <li className="nav-item-divider"></li>

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
                                <a href="tel:+56976167930" title="Llamar a +56 9 7616 7930">
                                    <svg className="icon-svg" viewBox="0 0 1024 1024" fill="#ffffff">
                                        <path transform="translate(0, 960) scale(1, -1)" d="M736 320c-64-64-64-128-128-128s-128 64-192 128-128 128-128 192 64 64 128 128-128 256-192 256-192-192-192-192c0-128 131.5-387.5 256-512s384-256 512-256c0 0 192 128 192 192s-192 256-256 192z" />
                                    </svg>
                                    <span>+56 9 7616 7930</span>
                                </a>
                            </li>

                            <li className="nav-item-divider"></li>

                            {/* Cotización */}
                            <li>
                                <div className="quote-wrapper">
                                    <a href="https://empresas.mechatronicstore.cl/" className="quote-btn">
                                        SOLICITAR COTIZACIÓN
                                    </a>
                                    <span className="badge-new">NUEVO</span>
                                </div>
                            </li>

                            <li className="nav-item-divider"></li>

                            {/* Redes Sociales */}
                            <li>
                                <div className="social-icons-wrapper">
                                    <a href="https://www.instagram.com/mechatronicstore.cl/" target="_blank" rel="noopener noreferrer" className="social-btn instagram" aria-label="Instagram">
                                        <svg className="icon-social" viewBox="0 0 1024 1024" fill="#ffffff">
                                            <path transform="translate(0, 960) scale(1, -1)" d="M512 867.8c136.8 0 153-0.6 206.8-3 50-2.2 77-10.6 95-17.6 23.8-9.2 41-20.4 58.8-38.2 18-18 29-35 38.4-58.8 7-18 15.4-45.2 17.6-95 2.4-54 3-70.2 3-206.8s-0.6-153-3-206.8c-2.2-50-10.6-77-17.6-95-9.2-23.8-20.4-41-38.2-58.8-18-18-35-29-58.8-38.4-18-7-45.2-15.4-95-17.6-54-2.4-70.2-3-206.8-3s-153 0.6-206.8 3c-50 2.2-77 10.6-95 17.6-23.8 9.2-41 20.4-58.8 38.2-18 18-29 35-38.4 58.8-7 18-15.4 45.2-17.6 95-2.4 54-3 70.2-3 206.8s0.6 153 3 206.8c2.2 50 10.6 77 17.6 95 9.2 23.8 20.4 41 38.2 58.8 18 18 35 29 58.8 38.4 18 7 45.2 15.4 95 17.6 53.8 2.4 70 3 206.8 3zM512 960c-139 0-156.4-0.6-211-3-54.4-2.4-91.8-11.2-124.2-23.8-33.8-13.2-62.4-30.6-90.8-59.2-28.6-28.4-46-57-59.2-90.6-12.6-32.6-21.4-69.8-23.8-124.2-2.4-54.8-3-72.2-3-211.2s0.6-156.4 3-211c2.4-54.4 11.2-91.8 23.8-124.2 13.2-33.8 30.6-62.4 59.2-90.8 28.4-28.4 57-46 90.6-59 32.6-12.6 69.8-21.4 124.2-23.8 54.6-2.4 72-3 211-3s156.4 0.6 211 3c54.4 2.4 91.8 11.2 124.2 23.8 33.6 13 62.2 30.6 90.6 59s46 57 59 90.6c12.6 32.6 21.4 69.8 23.8 124.2 2.4 54.6 3 72 3 211s-0.6 156.4-3 211c-2.4 54.4-11.2 91.8-23.8 124.2-12.6 34-30 62.6-58.6 91-28.4 28.4-57 46-90.6 59-32.6 12.6-69.8 21.4-124.2 23.8-54.8 2.6-72.2 3.2-211.2 3.2v0zM512 711c-145.2 0-263-117.8-263-263s117.8-263 263-263 263 117.8 263 263c0 145.2-117.8 263-263 263zM512 277.4c-94.2 0-170.6 76.4-170.6 170.6s76.4 170.6 170.6 170.6c94.2 0 170.6-76.4 170.6-170.6s-76.4-170.6-170.6-170.6zM846.8 721.4c0-33.91-27.49-61.4-61.4-61.4s-61.4 27.49-61.4 61.4c0 33.91 27.49 61.4 61.4 61.4s61.4-27.49 61.4-61.4z" />
                                        </svg>
                                    </a>
                                    <a href="https://www.tiktok.com/@mechatronicstore.cl" target="_blank" rel="noopener noreferrer" className="social-btn tiktok" aria-label="TikTok">
                                        <svg className="icon-social" viewBox="0 0 1024 1024" fill="#ffffff">
                                            <path transform="translate(0, 960) scale(1, -1)" d="M534.613 959.147c55.893 0.853 111.36 0.427 166.827 0.853 3.413-65.28 26.88-131.84 74.667-177.92 47.787-47.36 115.2-69.12 180.907-76.373v-171.947c-61.44 2.133-123.307 14.933-179.2 41.387-24.32 11.093-46.933 25.173-69.12 39.68-0.427-124.587 0.427-249.173-0.853-373.333-3.413-59.733-23.040-119.040-57.6-168.107-55.893-81.92-152.747-135.253-252.16-136.96-61.013-3.413-122.027 13.227-174.080 43.947-86.187 50.773-146.773 143.787-155.733 243.627-0.853 21.333-1.28 42.667-0.427 63.573 7.68 81.067 47.787 158.72 110.080 211.627 70.827 61.44 169.813 90.88 262.4 73.387 0.853-63.147-1.707-126.293-1.707-189.44-42.24 13.653-91.733 9.813-128.853-15.787-26.88-17.493-47.36-44.373-58.027-74.667-8.96-21.76-6.4-45.653-5.973-68.693 10.24-69.973 77.653-128.853 149.333-122.453 47.787 0.427 93.44 28.16 118.187 68.693 8.107 14.080 17.067 28.587 17.493 45.227 4.267 76.373 2.56 152.32 2.987 228.693 0.427 171.947-0.427 343.467 0.853 514.987z" />
                                        </svg>
                                    </a>
                                    <a href="https://www.youtube.com/channel/UCduHpxJBRrJBa2lgT0NPFbQ" target="_blank" rel="noopener noreferrer" className="social-btn youtube" aria-label="YouTube">
                                        <svg className="icon-social" viewBox="0 0 1024 1024" fill="#ffffff">
                                            <path transform="translate(0, 960) scale(1, -1)" d="M832 832h-640c-105.6 0-192-86.4-192-192v-384c0-105.6 86.4-192 192-192h640c105.6 0 192 86.4 192 192v384c0 105.6-86.4 192-192 192zM384 192v512l320-256-320-256z" />
                                        </svg>
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* DERECHA: Botón Ir a la Tienda */}
                    <div className="buttons-section">
                        <a href="https://www.mechatronicstore.cl/" className="store-btn">
                            <Globe size={16} />
                            <span>IR A LA TIENDA</span>
                        </a>
                    </div>

                </div>
            </div>

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
        </div>
    );
};
