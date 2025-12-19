// src/components/UploadZone.jsx
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileBox } from 'lucide-react'; // Iconos

export default function UploadZone({ onFileLoaded }) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'model/stl': ['.stl'] },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                const url = URL.createObjectURL(file);
                onFileLoaded(url, file.name);
            }
        },
    });

    return (
        <div
            {...getRootProps()}
            className={`
        absolute top-4 left-4 z-50 
        backdrop-blur-md bg-white/10 border-2 border-dashed rounded-2xl
        p-6 cursor-pointer transition-all duration-300 group
        hover:border-[#22c55e] hover:bg-white/15 hover:scale-105
        ${isDragActive ? 'border-[#22c55e] bg-white/20' : 'border-white/20'}
      `}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3 text-white/80 group-hover:text-white">
                {isDragActive ? (
                    <FileBox size={40} className="animate-bounce text-[#22c55e]" />
                ) : (
                    <UploadCloud size={40} />
                )}
                <div className="text-center">
                    <p className="font-bold text-sm">Arrastra tu STL aquí</p>
                    <p className="text-xs opacity-60">o haz clic para explorar</p>
                </div>
            </div>
        </div>
    );
}
