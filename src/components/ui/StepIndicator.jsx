import { motion } from 'framer-motion';

/**
 * Componente de indicador de pasos del proceso de cotización
 */
export default function StepIndicator({ currentStep, totalSteps = 3 }) {
    return (
        <motion.div
            className="inline-block"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
        >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-primary/10 text-brand-primary text-xs font-semibold rounded-full border border-brand-primary/20">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Paso {currentStep} de {totalSteps}
            </span>
        </motion.div>
    );
}
