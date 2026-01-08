import { motion } from 'framer-motion';

/**
 * Componente de fondo con patrón de circuito animado en tonos muy claros
 */
export default function CircuitBackground() {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {/* Fondo base - tono muy claro como la imagen */}
            <div className="absolute inset-0 bg-[#f8f9fa]" />

            {/* Patrón de circuito animado */}
            <motion.div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 19px,
                            rgba(203, 213, 225, 0.25) 19px,
                            rgba(203, 213, 225, 0.25) 20px,
                            transparent 20px,
                            transparent 39px,
                            rgba(203, 213, 225, 0.25) 39px,
                            rgba(203, 213, 225, 0.25) 40px
                        ),
                        repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 19px,
                            rgba(203, 213, 225, 0.25) 19px,
                            rgba(203, 213, 225, 0.25) 20px,
                            transparent 20px,
                            transparent 39px,
                            rgba(203, 213, 225, 0.25) 39px,
                            rgba(203, 213, 225, 0.25) 40px
                        ),
                        radial-gradient(
                            circle at 20px 20px,
                            rgba(148, 163, 184, 0.3) 2.5px,
                            transparent 2.5px
                        ),
                        radial-gradient(
                            circle at 40px 40px,
                            rgba(148, 163, 184, 0.3) 2.5px,
                            transparent 2.5px
                        )
                    `,
                    backgroundSize: '40px 40px, 40px 40px, 40px 40px, 40px 40px'
                }}
                animate={{
                    backgroundPosition: [
                        '0px 0px, 0px 0px, 0px 0px, 0px 0px',
                        '80px 80px, 80px 80px, 80px 80px, 80px 80px'
                    ]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />

            {/* Segundo layer con movimiento opuesto para más dinamismo */}
            <motion.div
                className="absolute inset-0"
                style={{
                    backgroundImage: `
                        radial-gradient(
                            circle at 0px 0px,
                            rgba(59, 130, 246, 0.08) 1.5px,
                            transparent 1.5px
                        ),
                        radial-gradient(
                            circle at 20px 20px,
                            rgba(59, 130, 246, 0.08) 1.5px,
                            transparent 1.5px
                        )
                    `,
                    backgroundSize: '40px 40px, 40px 40px'
                }}
                animate={{
                    backgroundPosition: [
                        '0px 0px, 0px 0px',
                        '-80px -80px, -80px -80px'
                    ]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />

            {/* Overlay muy sutil */}
            <div className="absolute inset-0 bg-white/10" />
        </div>
    );
}
