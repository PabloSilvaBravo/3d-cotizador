import { MATERIALS, QUALITIES, PRICING_RULES } from './constants';

export const calculatePriceFromStats = (config, stats) => {
    // stats: { weightGrams, timeHours, pesoSoportes } 

    // 1. COSTO MATERIAL
    const PRICE_PER_GRAM_PLA = 12;
    const materialCost = Math.ceil(stats.weightGrams * PRICE_PER_GRAM_PLA);

    // 2. FACTOR DIFICULTAD (Automático por ratio de soportes)
    // Calculamos ratio: Soportes / Total
    const pesoSoportes = stats.pesoSoportes || 0;
    const pesoTotal = stats.weightGrams || 1; // Evitar div/0
    const ratioSoportes = pesoSoportes / pesoTotal;

    // Umbrales definidos por el usuario
    const UMBRAL_MEDIA = 0.15; // 15%
    const UMBRAL_ALTA = 0.40;  // 40%

    let difficultyFactor = 1.0;
    let difficultyLabel = "Normal";

    if (ratioSoportes > UMBRAL_ALTA) {
        difficultyFactor = 1.5;
        difficultyLabel = "Alta (>40% Soportes)";
    } else if (ratioSoportes > UMBRAL_MEDIA) {
        difficultyFactor = 1.2;
        difficultyLabel = "Media (>15% Soportes)";
    } else if (ratioSoportes > 0) {
        // Si tiene soportes pero son pocos, ¿1.0 o 1.2?
        // Tu regla decía "Media: 1.2". 
        // Asumiremos que si hay soportes significativos (>0 pero <15%) quizás sigue siendo 1.0 
        // O si prefieres estricto: cualquier soporte = 1.2?
        // Usaré 1.0 para bajo volumen de soportes, 1.2 para moderado.
        difficultyFactor = 1.0;
    }

    // 3. COSTO TIEMPO
    const PRICE_PER_HOUR = 2500;
    const timeCost = Math.ceil(difficultyFactor * PRICE_PER_HOUR * stats.timeHours);

    // 4. COSTO CAMAS (Startup Fee)
    const bedCost = 1000;

    // 5. SUMA PARCIAL
    let totalUnit = materialCost + timeCost + bedCost;

    // 6. REGLA TPU
    if (config.material === 'TPU') {
        totalUnit = totalUnit * 2;
    }

    // 7. REDONDEO ($100)
    totalUnit = Math.round(totalUnit / 100) * 100;

    const totalPrice = totalUnit * config.quantity;

    return {
        materialCost,
        timeCost,
        startupFee: bedCost,
        totalPrice,
        unitPrice: totalUnit,
        estimatedTimeHours: stats.timeHours * config.quantity,
        weightGrams: stats.weightGrams,
        debug: {
            ratioSoportes: (ratioSoportes * 100).toFixed(1) + "%",
            difficultyFactor,
            difficultyLabel
        }
    };
};

export const calculatePrice = (config, geometry) => {
    return { materialCost: 0, timeCost: 0, totalPrice: 0, unitPrice: 0 };
};
