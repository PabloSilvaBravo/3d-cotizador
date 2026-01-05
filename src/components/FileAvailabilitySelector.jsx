import { motion } from 'framer-motion';
import { Upload, BookOpen } from 'lucide-react';
import StepIndicator from './ui/StepIndicator';
import { useDropzone } from 'react-dropzone';
import { useCallback } from 'react';

/**
 * Componente de selección inicial con diseño de pestaña principal
 */
export default function FileAvailabilitySelector({ onHasFile, onNeedsHelp, onFileSelect }) {

    // Configuración Dropzone para carga directa
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles?.length > 0 && onFileSelect) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'model/stl': ['.stl'],
            'model/step': ['.step', '.stp'],
            'model/obj': ['.obj']
        },
        maxSize: 100 * 1024 * 1024, // 100MB
        multiple: false
    });

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
                staggerChildren: 0.15
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    const options = [
        {
            id: 'has-file',
            title: isDragActive ? '¡Suéltalo Aquí!' : 'Tengo mi archivo',
            description: isDragActive ? 'Liberar para cargar' : 'Arrastra o haz clic para subir STL/STEP',
            icon: Upload,
            isDropzone: true // Flag especial
            // action: removido, el dropzone maneja el click
        },
        {
            id: 'needs-help',
            title: 'No tengo el archivo',
            description: 'Ver tutorial y recursos para obtenerlo',
            icon: BookOpen,
            action: onNeedsHelp,
            isDropzone: false
        }
    ];

    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
            <motion.div
                className="w-full max-w-5xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header mejorado con subtítulo */}
                <motion.div variants={cardVariants} className="text-center mb-12">
                    <StepIndicator currentStep={1} totalSteps={2} />

                    <h2 className="text-3xl md:text-4xl font-bold text-slate-700 mb-3">
                        ¿Tienes el archivo 3D que deseas cotizar?
                    </h2>
                    <p className="text-slate-500 text-base max-w-2xl mx-auto leading-relaxed">
                        Selecciona la opción que mejor se adapte a tu situación, o si no tienes el archivo, puedes ver el tutorial y recursos para obtenerlo.
                    </p>
                </motion.div>

                {/* Options Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {options.map((option, index) => {
                        const Icon = option.icon;
                        const isDropzoneInfo = option.isDropzone;

                        // Props específicas si es Dropzone
                        const dropzoneProps = isDropzoneInfo ? getRootProps() : {};
                        const borderStyle = isDropzoneInfo ? 'border-dashed border-2 bg-brand-primary/5' : 'border-solid border-[3px] bg-white/40';
                        const hoverColor = isDropzoneInfo ? 'rgba(96, 23, 177, 0.05)' : 'rgba(59, 130, 246, 0.05)'; // Brand vs Blue
                        const activeClass = isDropzoneInfo && isDragActive ? '!border-brand-primary !bg-brand-primary/10 scale-105 shadow-2xl' : '';

                        return (
                            <motion.button
                                key={option.id}
                                variants={cardVariants}
                                onClick={!isDropzoneInfo ? option.action : undefined}
                                {...dropzoneProps} // Inject Dropzone props
                                className={`group relative rounded-[2rem] py-12 px-8 text-center transition-all duration-300 cursor-pointer overflow-hidden border-slate-300 hover:border-brand-primary hover:shadow-xl ${borderStyle} ${activeClass}`}
                                whileHover={{
                                    borderColor: 'var(--color-brand-primary)',
                                    backgroundColor: hoverColor,
                                    scale: 1.03,
                                    y: -5,
                                    transition: {
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 25
                                    }
                                }}
                                whileTap={{
                                    scale: 0.97,
                                    y: 0,
                                    transition: {
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 15
                                    }
                                }}
                            >
                                {isDropzoneInfo && <input {...getInputProps()} />}


                                {/* Shimmer effect sutil */}
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
                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                                        backgroundSize: '200% 100%'
                                    }}
                                />

                                {/* Content */}
                                <div className="flex flex-col items-center gap-5 relative z-10">
                                    {/* Icon Container con animaciones mejoradas */}
                                    <motion.div
                                        className="p-6 rounded-2xl transition-all duration-300 bg-slate-100 text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary relative"
                                        whileHover={{
                                            scale: 1.15,
                                            rotate: [0, -5, 5, 0],
                                            transition: {
                                                scale: { type: 'spring', stiffness: 300, damping: 20 },
                                                rotate: { duration: 0.5 }
                                            }
                                        }}
                                        whileTap={{
                                            scale: 0.9,
                                            transition: { duration: 0.1 }
                                        }}
                                    >
                                        {/* Anillo pulsante de fondo */}
                                        <motion.div
                                            className="absolute inset-0 rounded-2xl bg-brand-primary/20"
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                opacity: [0.3, 0, 0.3]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: 'easeOut'
                                            }}
                                        />
                                        <Icon className="h-14 w-14 relative z-10" strokeWidth={1.5} />
                                    </motion.div>

                                    {/* Text con animación */}
                                    <div className="space-y-2">
                                        <motion.h3
                                            className="text-xl font-bold text-slate-700 group-hover:text-brand-primary transition-colors duration-300"
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            {option.title}
                                        </motion.h3>
                                        <motion.p
                                            className="text-slate-500 font-medium text-sm"
                                            initial={{ opacity: 0.8 }}
                                            whileHover={{ opacity: 1 }}
                                        >
                                            {option.description}
                                        </motion.p>
                                    </div>

                                    {/* Badge "Continuar" mejorado */}
                                    <motion.div
                                        className="inline-flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-50 px-4 py-2 rounded-full border border-slate-100 group-hover:bg-brand-primary group-hover:text-white group-hover:border-brand-primary transition-all duration-300 shadow-sm group-hover:shadow-md"
                                        whileHover={{
                                            scale: 1.08,
                                            x: 5,
                                            transition: {
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 20
                                            }
                                        }}
                                        whileTap={{
                                            scale: 0.95
                                        }}
                                    >
                                        <span>Continuar</span>
                                        <motion.svg
                                            className="w-3 h-3"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2.5}
                                            animate={{
                                                x: [0, 3, 0]
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: 'easeInOut'
                                            }}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </motion.svg>
                                    </motion.div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Footer informativo */}
                <motion.div
                    variants={cardVariants}
                    className="text-center"
                >
                    <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Formatos aceptados: STL, STEP • Tamaño máximo: 100MB</span>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
