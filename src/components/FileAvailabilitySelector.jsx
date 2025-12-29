import { motion } from 'framer-motion';
import { Upload, BookOpen, Sparkles, Zap } from 'lucide-react';

/**
 * Componente de selección con animaciones ultra mejoradas
 */
export default function FileAvailabilitySelector({ onHasFile, onNeedsHelp }) {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.25,
                delayChildren: 0.2
            }
        }
    };

    const titleVariants = {
        hidden: {
            opacity: 0,
            y: -30,
            scale: 0.8
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 200,
                damping: 15,
                duration: 0.8
            }
        }
    };

    const cardVariants = {
        hidden: {
            opacity: 0,
            y: 100,
            scale: 0.8,
            rotateX: -15
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            transition: {
                type: 'spring',
                stiffness: 150,
                damping: 12,
                duration: 1
            }
        }
    };

    // Animación de previsualización constante
    const floatingAnimation = {
        y: [-8, 8, -8],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    };

    const glowAnimation = {
        boxShadow: [
            '0 0 20px rgba(59, 130, 246, 0.2)',
            '0 0 40px rgba(59, 130, 246, 0.4)',
            '0 0 20px rgba(59, 130, 246, 0.2)'
        ],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    };

    const options = [
        {
            id: 'has-file',
            title: 'Tengo mi archivo',
            description: 'Subir archivo STL/STEP para cotizar',
            icon: Upload,
            gradient: 'from-blue-50 to-cyan-50',
            accentColor: 'text-blue-500',
            action: onHasFile
        },
        {
            id: 'needs-help',
            title: 'No tengo el archivo',
            description: 'Ver tutorial y recursos para obtenerlo',
            icon: BookOpen,
            gradient: 'from-purple-50 to-pink-50',
            accentColor: 'text-purple-500',
            action: onNeedsHelp
        }
    ];

    return (
        <div className="min-h-[50vh] flex items-center justify-center px-4 py-8">
            <motion.div
                className="w-full max-w-4xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header ultra-animado */}
                <motion.div variants={titleVariants} className="text-center mb-12 relative">
                    {/* Partículas flotantes decorativas */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-brand-primary/30 rounded-full"
                            style={{
                                left: `${20 + i * 12}%`,
                                top: `${Math.random() * 100}%`
                            }}
                            animate={{
                                y: [-20, 20, -20],
                                opacity: [0.3, 0.8, 0.3],
                                scale: [0.8, 1.2, 0.8]
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: i * 0.3,
                                ease: 'easeInOut'
                            }}
                        />
                    ))}

                    <motion.h2
                        className="text-3xl md:text-4xl font-bold text-slate-700 mb-3 relative inline-block"
                        animate={{
                            textShadow: [
                                '0 0 0px rgba(59, 130, 246, 0)',
                                '0 0 20px rgba(59, 130, 246, 0.3)',
                                '0 0 0px rgba(59, 130, 246, 0)'
                            ]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut'
                        }}
                    >
                        ¿Tienes un archivo 3D listo?
                        <motion.div
                            className="absolute -top-4 -right-10"
                            animate={{
                                rotate: [0, 360],
                                scale: [1, 1.3, 1]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                        >
                            <Sparkles className="w-7 h-7 text-brand-primary/50" />
                        </motion.div>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="text-slate-500 text-base max-w-xl mx-auto"
                    >
                        Selecciona la opción que mejor se adapte a tu situación
                    </motion.p>
                </motion.div>

                {/* Cards con animaciones mejoradas */}
                <div className="grid md:grid-cols-2 gap-8">
                    {options.map((option, index) => {
                        const Icon = option.icon;
                        return (
                            <motion.div
                                key={option.id}
                                variants={cardVariants}
                                animate={floatingAnimation}
                                style={{
                                    animationDelay: `${index * 0.2}s`
                                }}
                            >
                                <motion.button
                                    onClick={option.action}
                                    className={`
                                        group relative overflow-hidden w-full
                                        bg-white/50 backdrop-blur-md
                                        border-[3px] border-slate-300
                                        rounded-[2rem] p-12
                                        transition-all duration-700
                                    `}
                                    // Hover effects
                                    whileHover={{
                                        scale: 1.08,
                                        y: -15,
                                        borderColor: 'rgb(59, 130, 246)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.3)',
                                        transition: {
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 20
                                        }
                                    }}
                                    // Tap/Press effects
                                    whileTap={{
                                        scale: 0.92,
                                        y: 0,
                                        transition: {
                                            type: 'spring',
                                            stiffness: 500,
                                            damping: 15
                                        }
                                    }}
                                >
                                    {/* Gradiente de fondo animado */}
                                    <motion.div
                                        className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-100 rounded-[2rem]`}
                                        initial={{ scale: 0, rotate: 0 }}
                                        whileHover={{
                                            scale: 1.5,
                                            rotate: 180,
                                            transition: { duration: 0.8 }
                                        }}
                                    />

                                    {/* Ondas expansivas en click */}
                                    <motion.div
                                        className="absolute inset-0 bg-brand-primary/10 rounded-[2rem]"
                                        initial={{ scale: 0, opacity: 0 }}
                                        whileTap={{
                                            scale: [0, 1.5],
                                            opacity: [0.5, 0],
                                            transition: { duration: 0.6 }
                                        }}
                                    />

                                    {/* Shimmer effect mejorado */}
                                    <motion.div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100"
                                        animate={{
                                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: 'linear'
                                        }}
                                        style={{
                                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
                                            backgroundSize: '200% 100%'
                                        }}
                                    />

                                    {/* Content */}
                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        {/* Icon con animaciones múltiples */}
                                        <motion.div
                                            className="mb-7 relative"
                                            whileHover={{
                                                scale: 1.3,
                                                rotate: [0, -10, 10, -10, 0],
                                                transition: {
                                                    scale: { type: 'spring', stiffness: 300 },
                                                    rotate: { duration: 0.5 }
                                                }
                                            }}
                                            whileTap={{
                                                scale: 0.8,
                                                rotate: -180,
                                                transition: { duration: 0.3 }
                                            }}
                                        >
                                            {/* Anillos pulsantes */}
                                            <motion.div
                                                className="absolute inset-0 rounded-2xl"
                                                animate={{
                                                    scale: [1, 1.4, 1],
                                                    opacity: [0.5, 0, 0.5]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: 'easeOut'
                                                }}
                                                style={{
                                                    border: '3px solid rgb(59, 130, 246)',
                                                    filter: 'blur(4px)'
                                                }}
                                            />

                                            <motion.div
                                                className="bg-slate-100 group-hover:bg-brand-primary/20 rounded-2xl p-7 relative"
                                                animate={glowAnimation}
                                            >
                                                {/* Rayo de energía en hover */}
                                                <motion.div
                                                    className="absolute top-0 right-0"
                                                    initial={{ scale: 0, rotate: -45 }}
                                                    whileHover={{
                                                        scale: 1,
                                                        transition: { type: 'spring', stiffness: 500 }
                                                    }}
                                                >
                                                    <Zap className="w-5 h-5 text-yellow-400" />
                                                </motion.div>

                                                <Icon className="w-20 h-20 text-slate-400 group-hover:text-brand-primary transition-all duration-500" />
                                            </motion.div>
                                        </motion.div>

                                        {/* Text */}
                                        <motion.h3
                                            className="text-2xl font-bold text-slate-700 mb-3 group-hover:text-brand-primary transition-colors duration-500"
                                            whileHover={{
                                                scale: 1.08,
                                                y: -3
                                            }}
                                        >
                                            {option.title}
                                        </motion.h3>

                                        <motion.p
                                            className="text-slate-500 text-sm mb-7 px-4"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            {option.description}
                                        </motion.p>

                                        {/* CTA Button ultra-animado */}
                                        <motion.div
                                            className="inline-flex items-center gap-3 px-8 py-4 bg-slate-100 group-hover:bg-brand-primary text-slate-600 group-hover:text-white rounded-xl font-bold text-base shadow-lg group-hover:shadow-2xl transition-all duration-500"
                                            whileHover={{
                                                scale: 1.12,
                                                x: 8
                                            }}
                                            whileTap={{
                                                scale: 0.95,
                                                x: 0
                                            }}
                                        >
                                            <span>Continuar</span>
                                            <motion.svg
                                                className="w-5 h-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                animate={{
                                                    x: [0, 5, 0]
                                                }}
                                                transition={{
                                                    duration: 1.2,
                                                    repeat: Infinity,
                                                    ease: 'easeInOut'
                                                }}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </motion.svg>
                                        </motion.div>
                                    </div>

                                    {/* Borde brillante animado */}
                                    <motion.div
                                        className="absolute inset-0 rounded-[2rem] pointer-events-none"
                                        initial={{ opacity: 0 }}
                                        whileHover={{ opacity: 1 }}
                                    >
                                        <motion.div
                                            className="absolute inset-[-3px] rounded-[2rem] blur-sm"
                                            animate={{
                                                background: [
                                                    'linear-gradient(45deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                                                    'linear-gradient(45deg, #ec4899 0%, #3b82f6 50%, #8b5cf6 100%)',
                                                    'linear-gradient(45deg, #8b5cf6 0%, #ec4899 50%, #3b82f6 100%)',
                                                    'linear-gradient(45deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)'
                                                ]
                                            }}
                                            transition={{
                                                duration: 4,
                                                repeat: Infinity,
                                                ease: 'linear'
                                            }}
                                        />
                                    </motion.div>
                                </motion.button>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
