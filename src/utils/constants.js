// Precios y Reglas de Negocio (TU LÓGICA ORIGINAL RESTAURADA)
export const PRICING_RULES = {
  startupFee: 1000,      // Costo fijo de arranque (BaseBedCost original)
  hourlyRate: 2500,      // Costo por hora de impresión
  minPrice: 3000,        // Precio mínimo por pedido
  costPerGramBase: 12,   // Costo base por gramo (PLA)
};

// Materiales con metadatos para la UI pero PRECIOS RELATIVOS a tu base
export const MATERIALS = {
  PLA: {
    id: 'PLA',
    name: 'PLA Estándar',
    density: 1.24,
    priceMultiplier: 1.0, // Base ($12/g)
    description: 'Económico y versátil. Ideal para prototipos y piezas decorativas.'
  },
  PETG: {
    id: 'PETG',
    name: 'PETG Resistente',
    density: 1.27,
    priceMultiplier: 1.0, // Mismo precio base
    description: 'Mayor resistencia térmica y mecánica. Ideal para piezas funcionales.'
  },
  ABS: {
    id: 'ABS',
    name: 'ABS Industrial',
    density: 1.04,
    priceMultiplier: 1.0, // Mismo precio base
    description: 'Alta resistencia al impacto y temperatura.'
  },
  TPU: {
    id: 'TPU',
    name: 'TPU Flexible',
    density: 1.21,
    priceMultiplier: 2.0, // Doble precio
    description: 'Material flexible y elástico tipo goma.'
  }
};

export const COLORS = [
  { id: 'white', name: 'Blanco', hex: '#FFFFFF' },
  { id: 'black', name: 'Negro', hex: '#1a1a1a' },
  { id: 'red', name: 'Rojo', hex: '#DC2626' },
  { id: 'blue', name: 'Azul', hex: '#2563EB' },
  { id: 'green', name: 'Verde', hex: '#16A34A' },
  { id: 'orange', name: 'Naranja', hex: '#EA580C' },
  { id: 'grey', name: 'Gris', hex: '#64748B' },
  { id: 'yellow', name: 'Amarillo', hex: '#FACC15' },
];

export const QUALITIES = [
  { id: 'draft', name: 'Borrador (0.28mm)', layerHeight: 0.28, priceMultiplier: 0.8 }, // Más rápido = más barato
  { id: 'standard', name: 'Estándar (0.2mm)', layerHeight: 0.2, priceMultiplier: 1.0 },
  { id: 'high', name: 'Alta Calidad (0.16mm)', layerHeight: 0.16, priceMultiplier: 1.5 }, // Más lento = más caro
];

export const DEFAULT_CONFIG = {
  material: null,
  colorId: 'white',
  qualityId: 'standard',
  infill: 20, // Recomendado para robustez óptima
  quantity: 1,
};
