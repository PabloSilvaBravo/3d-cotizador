/**
 * Mapeo de colores de filamentos con sus hexadecimales
 * Claves basadas en los nombres que vienen de la API (ej: "Blanco", "Negro", "Red", etc)
 */

export const FILAMENT_COLORS = {
    // Normalización de nombres de colores (Español/Inglés -> Hex)
    'negro': '#000000',
    'black': '#000000',
    'blanco': '#ffffff',
    'white': '#ffffff',
    'rojo': '#bc2726',
    'red': '#bc2726',
    'azul': '#1729ab',
    'blue': '#1729ab',
    'verde': '#1daa27',
    'green': '#1daa27',
    'amarillo': '#fff13f',
    'yellow': '#fff13f',
    'naranja': '#ed7334',
    'orange': '#ed7334',
    'naranjo': '#ed7334',
    'gris': '#75787b',
    'grey': '#75787b',
    'silver': '#888f98',
    'plateado': '#888f98',
    'dorado': '#bda261',
    'gold': '#bda261',
    'golden': '#bda261',
    'morado': '#685bc7',
    'purple': '#685bc7',
    'violeta': '#685bc7',
    'lavanda': '#685bc7',
    'lavender': '#685bc7',
    'magenta': '#c52e79',
    'cian': '#00a3e0',
    'cyan': '#00a3e0',
    'beige': '#f0e0d6',
    'cafe': '#362111',
    'café': '#362111',
    'brown': '#362111',
    'coffee': '#362111',
    'transparente': '#e0e0e080', // Semi-transparente
    'transparent': '#e0e0e080',
    'natural': '#e0e0e080',
    'rosa': '#ffc0cb',
    'rosado': '#ffc0cb',
    'pink': '#ffc0cb',
    'blanco hueso': '#eee7d4',
    'bone white': '#eee7d4',
    'blanco cerámico': '#f4f9ff',
    'ceramic white': '#f4f9ff',
    'ceramic': '#f4f9ff',
    'amarillo puro': '#eac642',
    'pure yellow': '#eac642',
    'amarillo vivo': '#eac642',
    'vivid yellow': '#eac642',
    'lemon yellow': '#fff44f',
    'verde menta': '#98ff98',
    'mint green': '#98ff98',
    'verde oliva': '#5a6d3d',
    'olive green': '#5a6d3d',
    'azul klein': '#002fa7',
    'klein blue': '#002fa7',
    'azul cielo': '#87ceeb',
    'sky blue': '#87ceeb',
    'grey-blue': '#536878',
    'gris azulado': '#536878',
    'cherry red': '#990f02',
    'rojo cereza': '#990f02',
    'sakura pink': '#ffb7c5',
    'rosa sakura': '#ffb7c5',
    'fuchsia': '#ff00ff',
    'fucsia': '#ff00ff',
    'madera': '#c2b29a',
    'wood': '#c2b29a',
    'roble': '#c2b29a',
    'oak': '#c2b29a'
};

// Prefijos de SKU por material
export const SKU_PREFIXES = {
    PLA: 'SL-',
    PETG: 'SLPG-',
    ABS: 'SLE-',
    TPU: 'SLT-'
};

/**
 * Extrae el color y su hex a partir del nombre del producto
 * Ejemplo: "Filamento PLA SunLu... - Blanco" -> { name: "Blanco", hex: "#ffffff" }
 */
export const extractColorData = (productName) => {
    if (!productName) return null;

    // Intentar obtener el color después del guión final " - "
    const parts = productName.split(' - ');
    if (parts.length > 1) {
        const colorName = parts[parts.length - 1].trim();
        const colorKey = colorName.toLowerCase();

        if (FILAMENT_COLORS[colorKey]) {
            return {
                name: colorName,
                hex: FILAMENT_COLORS[colorKey]
            };
        }
    }

    // Si no hay guión, buscar palabras clave conocidas
    for (const [key, hex] of Object.entries(FILAMENT_COLORS)) {
        // Buscamos la palabra completa para evitar falsos positivos
        const regex = new RegExp(`\\b${key}\\b`, 'i');
        if (regex.test(productName)) {
            // Capitalizar primera letra para nombre bonito
            const name = key.charAt(0).toUpperCase() + key.slice(1);
            return { name, hex };
        }
    }

    // Fallback: color gris por defecto
    return { name: 'Estándar', hex: '#cccccc' };
};
