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

                    // Usar Slicer VPS (Prusa CLI)
                    const backendUrl = "https://dashboard.mechatronicstore.cl/api/3d/slice.php";

                    console.groupCollapsed(`🖨️ Solicitud Slicing: ${file.name}`);
                    console.time("⏱️ Tiempo Slicing");
                    console.log("📤 Enviando parámetros a VPS:", {
                        file: file.name,
                        size: (file.size / 1024 / 1024).toFixed(2) + " MB",
                        material: materialId,
                        quality: qualityId,
                        infill: infill,
                        scale: scale
                    });

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
                    console.timeEnd("⏱️ Tiempo Slicing");
                    console.log("📥 Respuesta VPS (Raw):", data);

                    // === LOG DE DEBUGGING AL FRONTEND ===
                    if (data.debug) {
                        console.log('🛠️ [Debug Backend] CMD:', data.debug.cmd);
                        console.log('🛠️ [Debug Backend] Log Tail:', data.debug.log_tail);
                    }

                    console.log('📊 Datos recibidos:', {
                        volumen: data.volumen,
                        peso: data.peso,
                        tiempo: data.tiempoTexto,
                        horas: data.timeHours
                    });

                    setQuoteData(data);
                    setIsLoading(false);
                    console.log("✅ Datos aplicados al estado:", data);
                    console.groupEnd(); // Fin grupo slicing
                    resolve(data);

                } catch (err) {
                    if (err.name === 'AbortError') {
                        console.log("🛑 Petición cancelada (Usuario cambió parámetros rápido)");
                        console.groupEnd();
                        return;
                    }
                    console.warn("⚠️ Fallo conexión con Slicer VPS. Activando Fallback.", err.message);

                    // FALLBACK ROBUSTO:
                    // Si falla la API (CORS, 500, Network), devolvemos un objeto que indique
                    // a la App que debe usar sus propios cálculos geométricos.
                    const fallbackData = {
                        oversized: false, // No necesariamente oversized, solo desconectado
                        isFallback: true,
                        peso: 0, // App calculará basado en volumen
                        tiempoTexto: "Estimado..."
                    };

                    // No seteamos error para no bloquear la UI
                    setQuoteData(fallbackData);
                    setIsLoading(false);
                    console.log("✅ Usando Fallback Data:", fallbackData);
                    console.groupEnd(); // Fin grupo slicing
                    resolve(fallbackData);

                    // Solo reportar error en consola, no a variable 'error'
                    // setError(err.message); 
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
