import { useState, useCallback, useRef } from 'react';

export const useBackendQuote = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quoteData, setQuoteData] = useState(null);
    const debounceTimerRef = useRef(null);
    const abortControllerRef = useRef(null);

    const getQuote = useCallback(async (file, materialId, qualityId, infill, rotation = [0, 0, 0], scale = 1.0) => {
        // Cancelar timer anterior
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Cancelar petición anterior
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        setIsLoading(true);
        setError(null);

        // Debouncing: esperar 500ms después del último cambio
        return new Promise((resolve, reject) => {
            debounceTimerRef.current = setTimeout(async () => {
                setQuoteData(null);

                const formData = new FormData();
                formData.append('file', file);
                formData.append('material', materialId);
                formData.append('quality', qualityId);
                formData.append('infill', infill);

                // Añadir transformaciones
                formData.append('rotationX', rotation[0]);
                formData.append('rotationY', rotation[1]);
                formData.append('rotationZ', rotation[2]);
                formData.append('scaleFactor', scale);

                try {
                    abortControllerRef.current = new AbortController();
                    const backendHost = window.location.hostname;
                    const backendUrl = `http://${backendHost}:3001/api/quote`;

                    const response = await fetch(backendUrl, {
                        method: 'POST',
                        body: formData,
                        signal: abortControllerRef.current.signal
                    });

                    if (!response.ok) {
                        let errorMessage = 'Error al conectar con el servidor de cotización';
                        try {
                            const errorData = await response.json();
                            if (errorData.error) errorMessage = errorData.error;
                        } catch (e) {
                            // Si no es JSON, tomamos statusText
                            errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
                        }
                        throw new Error(errorMessage);
                    }

                    const data = await response.json();
                    setQuoteData(data);
                    setIsLoading(false);
                    resolve(data);

                } catch (err) {
                    if (err.name === 'AbortError') {
                        return;
                    }
                    console.error(err);
                    setError(err.message || 'Error desconocido');
                    setIsLoading(false);
                    reject(err);
                }
            }, 500); // 500ms debounce
        });
    }, []);

    const resetQuote = () => {
        setQuoteData(null);
        setError(null);
    }

    return { getQuote, quoteData, isLoading, error, resetQuote };
};
