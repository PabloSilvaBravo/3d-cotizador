import { useState, useCallback } from 'react';

export const useBackendQuote = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quoteData, setQuoteData] = useState(null);

    const getQuote = useCallback(async (file, materialId, qualityId, infill) => {
        setIsLoading(true);
        setError(null);
        setQuoteData(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('material', materialId);
        formData.append('quality', qualityId); // Asegúrate de que tu backend reciba esto o usa mappings
        formData.append('infill', infill);     // Idem

        try {
            // Ajusta la URL si tu puerto es diferente
            const response = await fetch('http://localhost:3001/api/quote', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Error al conectar con el servidor de cotización');
            }

            const data = await response.json();

            // Adaptar respuesta del backend a lo que espera la UI nueva si es necesario
            // Backend devuelve típicamente: { price, volume, weight, time, details: {...} }
            setQuoteData(data);
            return data;

        } catch (err) {
            console.error(err);
            setError(err.message || 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resetQuote = () => {
        setQuoteData(null);
        setError(null);
    }

    return { getQuote, quoteData, isLoading, error, resetQuote };
};
