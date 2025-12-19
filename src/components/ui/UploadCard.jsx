import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';

export default function UploadCard({ onFileUpload }) {
    const inputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onFileUpload(e.target.files[0]);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border-l-4 border-brand-primary transform transition-all hover:scale-[1.02] duration-300">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 bg-purple-100 rounded-full">
                    <UploadCloud size={48} className="text-brand-primary" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-brand-dark mb-1">Sube tu diseño</h3>
                    <p className="text-brand-text opacity-70 text-sm">Soporta archivos .STL</p>
                </div>
                <div className="relative group w-full">
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".stl"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    <button className="w-full py-3 px-6 bg-brand-primary text-white font-bold rounded-lg shadow-lg group-hover:bg-brand-dark transition-colors z-10 relative">
                        Seleccionar Archivo
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Máximo 50MB</p>
            </div>
        </div>
    );
}
