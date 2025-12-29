import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export const FileUpload = ({ onFileSelect }) => {
    const [isDragging, setIsDragging] = useState(false);
    const inputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndUpload(e.target.files[0]);
        }
    };

    const validateAndUpload = (file) => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (['stl', 'step', 'stp'].includes(extension)) {
            if (file.size > 100 * 1024 * 1024) {
                alert("El archivo es muy grande. Máximo 100MB.");
                return;
            }
            onFileSelect(file);
        } else {
            alert("Solo se soportan archivos .STL y .STEP actualmente.");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ borderColor: 'var(--color-brand-primary)', backgroundColor: 'rgba(255,255,255,0.8)' }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}

            className={`
                relative border-[3px] border-dashed rounded-[2rem] py-16 px-8 text-center transition-all duration-300 cursor-pointer group w-full
                ${isDragging
                    ? 'border-brand-primary bg-brand-primary/5 scale-[1.01]'
                    : 'border-slate-300 bg-white/40 hover:shadow-xl'
                }
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                type="file"
                accept=".stl, .step, .stp"
                className="hidden"
                ref={inputRef}
                onChange={handleChange}
            />

            <div className="flex flex-col items-center gap-6 relative z-10 w-full max-w-2xl mx-auto">
                {/* Icono más sobrio */}
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`
                        p-6 rounded-2xl transition-all duration-300
                        ${isDragging ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary'}
                    `}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                </motion.div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-700">Arrastra tu archivo STL o STEP aquí</h3>
                    <p className="text-slate-500 font-medium">o haz clic para buscar en tu equipo</p>
                </div>

                <div className="text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    Máx. 100MB • Formatos .STL, .STEP
                </div>
            </div>
        </motion.div>
    );
};

export default FileUpload;
