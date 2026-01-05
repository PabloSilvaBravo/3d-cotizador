import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FileUpload from './ui/FileUpload';
import CircuitBackground from './CircuitBackground';
import { Header } from './layout/Header';

const UploadPage = ({ onFileSelect }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col bg-brand-light font-sans text-brand-dark overflow-hidden relative">
            <CircuitBackground />
            <Header />

            <div className="flex-1 flex flex-col justify-center items-center px-4 relative z-10 pt-24 pb-12">
                {/* Fondo decorativo igual a Home */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[100px]"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-4xl bg-white/60 backdrop-blur-xl p-3 rounded-[2rem] shadow-2xl border border-white"
                >
                    <FileUpload
                        onFileSelect={onFileSelect}
                        onBack={() => navigate('/')}
                    />
                </motion.div>
            </div>
        </div>
    );
};
export default UploadPage;
