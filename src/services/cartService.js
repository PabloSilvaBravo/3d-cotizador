// Detectar entorno para usar proxy en dev y evitar CORS
const IS_DEV = import.meta.env.DEV;
const BASE_URL = IS_DEV ? "/api-dashboard" : "https://dashboard.mechatronicstore.cl";
const API_URL = `${BASE_URL}/api/3d/agregar-carrito.php`;

/**
 * Llama a la API para agregar los datos de la cotización al sistema (WordPress/WooCommerce)
 */
export async function addToCart(data) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            credentials: 'include', // IMPORTANTE: Para mantener la sesión de PHP/WooCommerce
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Error al guardar cotización');
        }

        return result;
    } catch (error) {
        console.error('Error en addToCart:', error);
        throw error;
    }
}

/**
 * Agregar al carrito y redirigir
 * Usa esta función cuando el usuario hace click en "Agregar al Carrito"
 */
export async function addToCartAndRedirect(data) {
    const result = await addToCart(data);

    if (result.success && result.cartUrl) {
        // Redirigir al carrito de WooCommerce
        window.location.href = result.cartUrl;
    } else {
        throw new Error(result.error || 'No se pudo generar el enlace al carrito');
    }
}
