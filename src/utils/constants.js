// src/utils/constants.js

export const MATERIAL_RATES = {
  PLA: { price: 1, label: 'PLA (Estándar)' }, // Multiplicador base
  PETG: { price: 1, label: 'PETG (Resistente)' },
  ABS: { price: 1, label: 'ABS (Técnico)' },
  TPU: { price: 2, label: 'TPU (Flexible - x2 Precio)' },
};

export const PRICING_CONFIG = {
  costPerGram: 12,        // $12 CLP por gramo (basado en $12.000/kg)
  hourlyRate: 2500,       // $2.500 CLP por hora máquina
  baseBedCost: 1000,      // Costo fijo 1ra cama
  extraBedCost: 2500,     // Costo camas adicionales
};

export const DIFFICULTY_FACTOR = {
  normal: 1.0,
  media: 1.2,
  alta: 1.5,
};
