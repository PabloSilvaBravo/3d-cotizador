/**
 * Script temporal de una sola ejecución
 * Obtiene todos los productos con prefijos: SL-, SLE-, SLPG-, SLT-
 * Guarda el resultado en filtered_products.json
 * 
 * USO: node fetch_sl_products.cjs
 */

const https = require('https');
const fs = require('fs');

const API_BASE_URL = 'https://dashboard.mechatronicstore.cl/api/public/productos.php';
const PREFIXES = ['SL-', 'SLE-', 'SLPG-', 'SLT-'];
const OUTPUT_FILE = 'filtered_products.json';

/**
 * Realiza una petición GET a la API
 */
function fetchProducts(offset = 0, limit = 200) {
    return new Promise((resolve, reject) => {
        const url = `${API_BASE_URL}?limit=${limit}&offset=${offset}`;

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (error) {
                    reject(new Error('Error parseando JSON: ' + error.message));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * Verifica si un SKU tiene alguno de los prefijos especificados
 */
function hasTargetPrefix(sku) {
    const skuUpper = String(sku).toUpperCase();
    return PREFIXES.some(prefix => skuUpper.startsWith(prefix));
}

/**
 * Función principal
 */
async function main() {
    console.log('🔍 Iniciando búsqueda de productos...');
    console.log(`📋 Prefijos buscados: ${PREFIXES.join(', ')}`);
    console.log('');

    const allFilteredProducts = [];
    let offset = 0;
    const limit = 200; // máximo permitido por la API
    let totalProducts = 0;

    try {
        // Primera llamada para conocer el total
        const firstResponse = await fetchProducts(0, limit);

        if (!firstResponse.success) {
            throw new Error('La API no retornó success: true');
        }

        totalProducts = firstResponse.total;
        console.log(`📦 Total de productos en catálogo: ${totalProducts}`);
        console.log('');

        // Filtrar productos de la primera página
        const filteredFromFirst = firstResponse.productos.filter(p => hasTargetPrefix(p.sku));
        allFilteredProducts.push(...filteredFromFirst);

        console.log(`✅ Página 1: ${filteredFromFirst.length} productos encontrados`);

        // Calcular cuántas páginas más necesitamos
        const totalPages = Math.ceil(totalProducts / limit);

        // Obtener el resto de páginas
        for (let page = 2; page <= totalPages; page++) {
            offset = (page - 1) * limit;

            const response = await fetchProducts(offset, limit);

            if (response.success && Array.isArray(response.productos)) {
                const filtered = response.productos.filter(p => hasTargetPrefix(p.sku));
                allFilteredProducts.push(...filtered);

                console.log(`✅ Página ${page}/${totalPages}: ${filtered.length} productos encontrados`);
            }

            // Pequeño delay para no saturar el servidor
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log('');
        console.log('📊 RESUMEN:');
        console.log(`   Total productos revisados: ${totalProducts}`);
        console.log(`   Productos con prefijos SL*: ${allFilteredProducts.length}`);
        console.log('');

        // Agrupar por prefijo para estadísticas
        const byPrefix = {};
        PREFIXES.forEach(prefix => {
            byPrefix[prefix] = allFilteredProducts.filter(p =>
                String(p.sku).toUpperCase().startsWith(prefix)
            ).length;
        });

        console.log('📈 Desglose por prefijo:');
        Object.entries(byPrefix).forEach(([prefix, count]) => {
            console.log(`   ${prefix.padEnd(6)} → ${count} productos`);
        });
        console.log('');

        // Guardar en archivo JSON
        const outputData = {
            generado_en: new Date().toISOString(),
            prefijos_filtrados: PREFIXES,
            total_productos: allFilteredProducts.length,
            desglose_por_prefijo: byPrefix,
            productos: allFilteredProducts
        };

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(outputData, null, 2), 'utf8');

        console.log(`💾 Archivo generado: ${OUTPUT_FILE}`);
        console.log('✅ Proceso completado exitosamente');
        console.log('');
        console.log('⚠️  RECORDATORIO: Este script es temporal. Una vez obtenido el resultado,');
        console.log('    puedes eliminar este archivo (fetch_sl_products.cjs)');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Ejecutar
main();
