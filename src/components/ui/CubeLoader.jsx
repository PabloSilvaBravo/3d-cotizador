import React from 'react';

const CubeLoader = ({ size = 'md' }) => {
    // Escala del spinner según tamaño (opcional, por ahora fijo en CSS pero podemos usar scale)
    const scale = size === 'sm' ? 0.5 : size === 'lg' ? 1.5 : 1;

    return (
        <div style={{ transform: `scale(${scale})` }} className="flex justify-center items-center p-8">
            <div className="cube-spinner">
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
            </div>
        </div>
    );
};

export default CubeLoader;
