/**
 * Hook para gestionar la carga de colores desde la API
 */
import { useState, useEffect } from 'react';
import { fetchAllFilaments } from '../services/filamentService';
import { SKU_PREFIXES } from '../utils/filamentColors';

export const useAvailableColors = (materialType) => {
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const loadColors = async () => {
            if (!materialType) return;

            const prefix = SKU_PREFIXES[materialType];
            if (!prefix) {
                console.warn(`No prefix defined for material: ${materialType}`);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const data = await fetchAllFilaments(prefix);
                if (isMounted) {
                    setColors(data);
                }
            } catch (err) {
                if (isMounted) {
                    console.error(err);
                    setError('Error cargando colores');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadColors();

        return () => {
            isMounted = false;
        };
    }, [materialType]);

    return { colors, loading, error };
};
