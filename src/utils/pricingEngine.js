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

    // 4. COSTO CAMAS (Nesting y Camas Extras)
    const BED_W = 250; // Ancho útil (mm)
    const BED_D = 250; // Profundidad útil (mm)
    const ITEM_MARGIN = 2; // Margen entre piezas (mm)
    const BASE_STARTUP_FEE = 1000; // Costo por cama

    let platesNeeded = 1;
    let itemsPerPlate = config.quantity;

    if (stats.dimensions) {
        const { x, y } = stats.dimensions;

        // Calcular cuántas caben en orientación original
        const fitX = Math.floor(BED_W / (x + ITEM_MARGIN));
        const fitY = Math.floor(BED_D / (y + ITEM_MARGIN));
        const totalOriginal = Math.max(1, fitX * fitY);

        // Calcular cuántas caben rotadas 90 grados
        const fitX_R = Math.floor(BED_W / (y + ITEM_MARGIN));
        const fitY_R = Math.floor(BED_D / (x + ITEM_MARGIN));
        const totalRotated = Math.max(1, fitX_R * fitY_R);

        // Elegir la mejor orientación
        itemsPerPlate = Math.max(totalOriginal, totalRotated);

        // Calcular placas necesarias
        // Evitar división por cero o NaN
        if (itemsPerPlate > 0) {
            platesNeeded = Math.ceil(config.quantity / itemsPerPlate);
        }
    }

    // Costo total de camas: $1000 por cada placa usada
    const totalBedCost = platesNeeded * BASE_STARTUP_FEE;

    // 5. SUMA PARCIAL
    let totalUnit = materialCost + timeCost;

    // Nota: El startupFee es un costo fijo del PEDIDO, no por unidad. 
    // Pero la lógica existente suma material y tiempo POR UNIDAD primero?
    // Revisando: materialCost y timeCost son calculados pasados en 'stats', 
    // que normalmente vienen para UNA unidad (si slicer es unitario).
    // Si stats viene por 1 unidad, entonces:

    // totalUnitBase = Material + Tiempo
    // Precio Total = (totalUnitBase * Cantidad) + BedCostTotal

    // Pero el código original hacía: let totalUnit = mat + time + bed; 
    // y luego totalPrice = totalUnit * quantity.
    // Esto implicaba que cobraba 1000 POR UNIDAD. ¿Es eso correcto? 
    // "startupFee: 1000" usualmente es por trabajo. 
    // Si config.quantity es 100, cobraba 100 * 1000 = 100.000 solo de arranque? Eso sería excesivo.

    // VERIFICACIÓN:
    // BedCost original = 1000.
    // totalUnit = ... + 1000.
    // totalPrice = totalUnit * quantity.
    // SÍ, el código original multiplicaba el startupFee por la cantidad. 
    // ESTO PARECE UN BUG LEGACY O UNA DECISIÓN DE COBRAR MANEJO POR PIEZA.

    // NUEVA LÓGICA (Más lógica): 
    // StartupFee es fijo por PLACA, no por pieza.
    // Si caben 50 en una placa, cobramos 1 placa ($1000).
    // Si necesitamos 2 placas, cobramos $2000.

    // Entonces, NO debemos sumar totalBedCost a totalUnit directamente si vamos a multiplicar por quantity luego.
    // O calculamos el precio total y luego dividimos para sacar el unitario virtual.

    const totalProductionCost = (materialCost + timeCost) * config.quantity;
    const finalPrice = totalProductionCost + totalBedCost;

    // Recalcular unitario virtual para mostrar
    let virtualUnitPrice = finalPrice / config.quantity;

    // 6. REGLA TPU (Aplica al total o unitario base)
    if (config.material === 'TPU') {
        virtualUnitPrice = virtualUnitPrice * 2; // Doble precio final? O solo material?
        // El código original duplicaba 'totalUnit'. Asumiré que duplica todo el costo operativo por dificultad.
        // Pero el startup fee (placa) no debería duplicarse por TPU necesariamente, aunque el TPU es mas dificil de pegar.
        // Mantengamos la lógica original: duplicar todo.
    }

    // 7. REDONDEO ($100)
    virtualUnitPrice = Math.round(virtualUnitPrice / 100) * 100;
    const finalTotalPrice = virtualUnitPrice * config.quantity;

    // 8. APLICAR PRECIO MÍNIMO
    const MINIMUM_PRICE = 3000;
    let isMinimumPrice = false;

    let adjustedTotalPrice = finalTotalPrice;

    if (finalTotalPrice < MINIMUM_PRICE) {
        adjustedTotalPrice = MINIMUM_PRICE;
        virtualUnitPrice = MINIMUM_PRICE / config.quantity; // Ajustar unitario visual
        isMinimumPrice = true;
    }

    return {
        materialCost, // Unitario
        timeCost,     // Unitario
        startupFee: totalBedCost, // Total del lote
        totalPrice: adjustedTotalPrice,
        unitPrice: virtualUnitPrice,
        estimatedTimeHours: stats.timeHours * config.quantity,
        weightGrams: stats.weightGrams,
        isMinimumPrice,
        platesNeeded, // Info extra
        itemsPerPlate, // Info extra
        debug: {
            porcentajeSoportes: porcentajeSoportes.toFixed(1) + "%",
            pesoSoportes: pesoSoportes.toFixed(1) + "g",
            difficultyFactor,
            difficultyLabel,
            plates: `${platesNeeded} placas (${itemsPerPlate} p/placa)`
        }
    };


};


