/**
 * Servicio para consultar inventario de filamentos
 * Implementa paginación completa idéntica a fetch_sl_products.cjs
 */

import { extractColorData } from '../utils/filamentColors';

const API_BASE_URL = 'https://dashboard.mechatronicstore.cl/api/public/productos.php';

// Cache simple en memoria para evitar llamadas repetidas en la misma sesión
const CACHE = {};
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos

/**
 * Realiza una petición GET a la API con paginación
 */
const fetchPage = async (offset = 0, limit = 200) => {
    try {
        const url = `${API_BASE_URL}?limit=${limit}&offset=${offset}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching page:', error);
        throw error;
    }
};

/**
 * Función principal para traer TODOS los productos de un tipo específico
 * Replica la lógica de fetch_sl_products.cjs
 */
export const fetchAllFilaments = async (materialPrefix) => {
    // Verificar cache
    const cacheKey = `material_${materialPrefix}`;
    const cached = CACHE[cacheKey];
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        console.log(`🎯 Cache hit para ${materialPrefix}`);
        return cached.data;
    }

    console.log(`🔍 Iniciando búsqueda completa para prefijo: ${materialPrefix}`);

    const allFilteredProducts = [];
    const limit = 200;

    try {
        // 1. Primera llamada para obtener total y primera página
        const firstResponse = await fetchPage(0, limit);

        if (!firstResponse.success) {
            throw new Error('API success = false');
        }

        const totalProducts = firstResponse.total;
        console.log(`📦 Total catálogo: ${totalProducts}`);

        // Filtrar página 1
        // Nota: Filtramos por SKU, igual que en el script de referencia
        const filteredFromFirst = firstResponse.productos.filter(p =>
            p.sku && p.sku.toUpperCase().startsWith(materialPrefix) && p.stock_disponible > 4
        );
        allFilteredProducts.push(...filteredFromFirst);

        // 2. Calcular páginas restantes
        const totalPages = Math.ceil(totalProducts / limit);

        // 3. Iterar por el resto de páginas
        for (let page = 2; page <= totalPages; page++) {
            const offset = (page - 1) * limit;

            // Pequeño delay para ser gentiles con la API (como en el script)
            await new Promise(resolve => setTimeout(resolve, 100));

            const response = await fetchPage(offset, limit);

            if (response.success && Array.isArray(response.productos)) {
                const filtered = response.productos.filter(p =>
                    p.sku && p.sku.toUpperCase().startsWith(materialPrefix) && p.stock_disponible > 4
                );
                allFilteredProducts.push(...filtered);
            }
        }

        console.log(`✅ Finalizado: ${allFilteredProducts.length} productos para ${materialPrefix}`);

        // 4. Procesar y DEDUPLICAR colores
        const uniqueColorsMap = new Map();

        allFilteredProducts.forEach(product => {
            const colorData = extractColorData(product.nombre);
            const colorName = colorData.name;

            // Si ya existe este color, nos quedamos con el que tiene más stock
            // O si es un "Estándar" (gris por defecto), intentamos buscar uno mejor
            if (uniqueColorsMap.has(colorName)) {
                const existing = uniqueColorsMap.get(colorName);

                // Prioridad 1: Si el nuevo tiene stock y el viejo no (aunque filtramos stock>0, por seguridad)
                // Prioridad 2: Si tienen el mismo nombre, preferimos el que tenga más stock
                if (product.stock_disponible > existing.stock) {
                    uniqueColorsMap.set(colorName, {
                        id: product.sku,
                        sku: product.sku,
                        name: colorData.name,
                        fullName: product.nombre,
                        hex: colorData.hex,
                        stock: product.stock_disponible,
                        price: product.precio,
                        imageUrl: product.imagen_url,
                        permalink: product.permalink
                    });
                }
            } else {
                // Nuevo color
                uniqueColorsMap.set(colorName, {
                    id: product.sku,
                    sku: product.sku,
                    name: colorData.name,
                    fullName: product.nombre,
                    hex: colorData.hex,
                    stock: product.stock_disponible,
                    price: product.precio,
                    imageUrl: product.imagen_url,
                    permalink: product.permalink
                });
            }
        });

        // Convertir mapa a array y ordenar
        const processedProducts = Array.from(uniqueColorsMap.values())
            .sort((a, b) => a.name.localeCompare(b.name));


        // Guardar en cache
        CACHE[cacheKey] = {
            timestamp: Date.now(),
            data: processedProducts
        };

        return processedProducts;

    } catch (error) {
        console.error(`❌ Error fetching filaments for ${materialPrefix}:`, error);
        return [];
    }
};
