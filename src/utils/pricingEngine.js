import { MATERIALS, QUALITIES, PRICING_RULES } from './constants';

export const calculatePriceFromStats = (config, stats) => {
    // stats: { weightGrams, timeHours, pesoSoportes } 

    // 1. COSTO MATERIAL
    const PRICE_PER_GRAM_PLA = 12;
    const materialCost = Math.ceil(stats.weightGrams * PRICE_PER_GRAM_PLA);

    // 2. FACTOR DIFICULTAD (Basado en % de soportes del G-Code real)
    const pesoSoportes = stats.pesoSoportes || 0;
    const pesoTotal = stats.weightGrams || 1; // Evitar div/0
    const porcentajeSoportes = (pesoSoportes / pesoTotal) * 100;

    // Umbrales actualizados según especificación
    let difficultyFactor = 1.0;
    let difficultyLabel = "Sin soportes";

    if (porcentajeSoportes > 30) {
        difficultyFactor = 1.30; // +30% recargo
        difficultyLabel = "Muy Alta (>30% soportes)";
    } else if (porcentajeSoportes > 15) {
        difficultyFactor = 1.20; // +20% recargo
        difficultyLabel = "Alta (15-30% soportes)";
    } else if (porcentajeSoportes > 5) {
        difficultyFactor = 1.10; // +10% recargo
        difficultyLabel = "Media (5-15% soportes)";
    } else if (porcentajeSoportes > 0) {
        difficultyFactor = 1.0; // Sin recargo
        difficultyLabel = "Baja (<5% soportes)";
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
            porcentajeSoportes: porcentajeSoportes.toFixed(1) + "%",
            pesoSoportes: pesoSoportes.toFixed(1) + "g",
            difficultyFactor,
            difficultyLabel
        }
    };
};


