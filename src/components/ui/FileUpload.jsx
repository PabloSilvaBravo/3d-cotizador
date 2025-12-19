import React, { useRef, useState } from 'react';

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
        if (extension === 'stl') {
            if (file.size > 50 * 1024 * 1024) {
                alert("El archivo es muy grande. Máximo 50MB.");
                return;
            }
            onFileSelect(file);
        } else {
            alert("Solo se soportan archivos .STL actualmente.");
        }
    };

    return (
        <div
            className={`
        relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-500 cursor-pointer group
        ${isDragging
                    ? 'border-brand-primary bg-brand-primary/10 scale-[1.02] shadow-2xl'
                    : 'border-brand-primary/30 hover:border-brand-primary hover:bg-brand-primary/5 hover:shadow-xl'
                }
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                type="file"
                accept=".stl"
                className="hidden"
                ref={inputRef}
                onChange={handleChange}
            />

            <div className="flex flex-col items-center gap-6 relative z-10">
                <div className={`
          p-6 rounded-2xl transition-all duration-500 shadow-lg
          ${isDragging
                        ? 'bg-brand-primary text-white scale-110 shadow-brand-primary/40 rotate-12'
                        : 'bg-gradient-to-br from-brand-primary to-brand-secondary text-white group-hover:scale-110 group-hover:-rotate-6'
                    }
        `}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-2xl font-extrabold text-brand-secondary mb-2 tracking-tight">Sube tu Modelo 3D</h3>
                    <p className="text-brand-secondary/70 font-medium">Arrastra y suelta tu archivo <span className="font-mono text-brand-primary bg-brand-primary/10 px-1 rounded">.stl</span> aquí</p>
                    <p className="text-brand-secondary/50 text-sm mt-2 font-medium group-hover:text-brand-primary transition-colors">o haz clic para explorar</p>
                </div>
            </div>
        </div>
    );
};

export default FileUpload;
