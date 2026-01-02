import { useState, useCallback, useRef } from 'react';

export const useBackendQuote = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [quoteData, setQuoteData] = useState(null);
    const debounceTimerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const lastRequestHash = useRef('');

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

                // Generar hash único de la petición
                const currentHash = `${file.name}_${file.size}_${materialId}_${qualityId}_${infill}_${rotation.join(',')}_${scale}`;

                // Evitar repetir exactamente la misma petición si ya tenemos datos
                if (lastRequestHash.current === currentHash && quoteData) {
                    console.log("⚡ [Circuit Breaker] Petición idéntica detectada. Usando caché local.");
                    setIsLoading(false);
                    resolve(quoteData);
                    return;
                }

                setQuoteData(null);
                lastRequestHash.current = currentHash;

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
                    // const backendHost = window.location.hostname;
                    // const backendUrl = `http://${backendHost}:3001/api/quote`;

                    // TEMPORAL: Forzar uso de 127.0.0.1 (IP Loopback) en lugar de localhost para evitar bloqueos de algunos navegadores/extensiones
                    const backendUrl = "http://127.0.0.1:3001/api/quote";

                    const response = await fetch(backendUrl, {
                        method: 'POST',
                        body: formData,
                        signal: abortControllerRef.current.signal
                    });

                    if (!response.ok) {
                        lastRequestHash.current = ''; // Reset hash on error para permitir reintento
                        let errorMessage = 'Error al conectar con el servidor de cotización';
                        try {
                            const errorData = await response.json();
                            if (errorData.error) errorMessage = errorData.error;

                            // === DETECCIÓN MODELOS GIGANTES ===
                            // Si el error es por tamaño, no fallamos, retornamos flag para estimación manual
                            // Ahora el backend devuelve status 200 con { oversized: true }, pero si devolviera error:
                            if (errorMessage.includes('demasiado grande') || errorMessage.includes('print volume')) {
                                console.warn("Modelo demasiado grande para Slicer. Usando estimación geométrica.");
                                const fallbackData = { oversized: true };
                                setQuoteData(fallbackData);
                                setIsLoading(false);
                                resolve(fallbackData);
                                return;
                            }

                        } catch (e) {
                            errorMessage = `Error del servidor: ${response.status} ${response.statusText}`;
                        }
                        throw new Error(errorMessage);
                    }

                    const data = await response.json();

                    // === LOG DE DEBUGGING AL FRONTEND ===
                    if (data.debug) {
                        console.groupCollapsed('🛠️ Backend Slicing Debug Info');
                        console.log('📦 Logs del proceso:', data.debug.logs);
                        console.log('📜 GCode Tail (últimos 2000 chars):');
                        console.log(data.debug.gcodeTail); // Imprimir como texto plano
                        console.log('📊 Datos finales detectados:', {
                            volumen: data.volumen,
                            peso: data.peso,
                            soportes: data.pesoSoportes,
                            soportesPct: data.porcentajeSoportes,
                            tiempo: data.tiempoTexto
                        });
                        console.groupEnd();
                    }
                    // ===================================

                    setQuoteData(data);
                    setIsLoading(false);
                    resolve(data);

                } catch (err) {
                    if (err.name === 'AbortError') {
                        return;
                    }
                    console.error(err);
                    lastRequestHash.current = ''; // Reset hash on error
                    setError(err.message || 'Error desconocido');
                    setIsLoading(false);
                    reject(err);
                }
            }, 500); // 500ms debounce
        });
    }, [quoteData]); // Añadir quoteData a dependencias para poder retornarlo en cache hit

    const resetQuote = () => {
        setQuoteData(null);
        setError(null);
    }

    return { getQuote, quoteData, isLoading, error, resetQuote };
};
