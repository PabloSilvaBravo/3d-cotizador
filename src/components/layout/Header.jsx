import React from 'react';
import { MechatronicLogo } from '../ui/MechatronicLogo';
import { Home } from 'lucide-react';

export const Header = () => {
    const handleLogoClick = () => {
        window.location.href = 'https://www.mechatronicstore.cl/';
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
                    min-height: 28px;
                    padding: 0;
                }

                .unified-container {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    max-width: 64rem;
                    margin: 0 auto;
                    padding: 4px 10px;
                }

                .logo-section {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    transform-origin: left center;
                    transform: scale(0.8);
                }

                .logo-section:hover {
                    opacity: 0.9;
                }

                .buttons-section {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .store-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 12px;
                    border-radius: 100px;
                    border: 1.5px solid rgba(255,255,255,0.5);
                    background: transparent;
                    color: #ffffff;
                    text-decoration: none;
                    font-size: 12px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    overflow: hidden;
                }

                .store-btn:hover {
                    background: rgba(255,255,255,0.2);
                    border-color: rgba(255,255,255,0.6);
                    transform: translateY(-1px);
                }

                @media (max-width: 1200px) {
                    .unified-container {
                        padding: 4px 16px; 
                    }
                }

                @media (max-width: 768px) {
                    .unified-container {
                        padding: 8px 12px !important;
                    }

                    .store-btn {
                        padding: 0 !important;
                        width: 32px !important;
                        height: 32px !important;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(255,255,255,0.1); 
                        border: 1px solid rgba(255,255,255,0.2);
                    }

                    .store-btn span {
                        display: none !important;
                    }
                }


            `}</style>

            {/* 1. Banner Envio Gratis */}
            <div className="banner-container-fixed">
                <p style={{ margin: 0, lineHeight: 1.4, color: '#fff', fontWeight: 400, textAlign: 'center' }}>
                    ¡<span style={{ color: '#ffef37' }}>Envío gratis</span> a todo Chile en compras sobre <span style={{ color: '#ffef37' }}>$19.990</span>!
                </p>
            </div>

            {/* 2. BARRA UNIFICADA: Logo + Contacto + Botones */}
            <div className="unified-header">
                <div className="unified-container">

                    {/* IZQUIERDA: Logo */}
                    <div className="logo-section" onClick={handleLogoClick} title="Volver a MechatronicStore.cl">
                        <MechatronicLogo />
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


        </div>
    );
};
