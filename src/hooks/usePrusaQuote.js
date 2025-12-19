// src/hooks/usePrusaQuote.js
import { useState } from 'react';

export function usePrusaQuote() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [slicerData, setSlicerData] = useState(null);

    const getQuote = async (file, config) => {
        setLoading(true);
        setError(null);
        setSlicerData(null); // Resetear datos anteriores

        const formData = new FormData();
        formData.append('file', file);
        // Enviamos configuración dinámica al backend
        formData.append('material', config.material);
        formData.append('infill', config.infill || '15%');
        formData.append('layerHeight', '0.2');
        formData.append('supports', config.hasSupports); // Backend debe recibir string 'true'/'false'

        try {
            // Ajusta la URL a tu entorno local
            const response = await fetch('http://localhost:3001/api/quote', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Error en el servicio de Slicing');

            const data = await response.json();
            setSlicerData(data); // { volumen, peso, tiempoHoras, ... }
            return data;

        } catch (err) {
            console.error(err);
            setError('No se pudo calcular la cotización exacta.');
        } finally {
            setLoading(false);
        }
    };

    return { getQuote, slicerData, loading, error };
}
