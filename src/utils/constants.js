// Precios y Reglas de Negocio (TU LÓGICA ORIGINAL RESTAURADA)
export const PRICING_RULES = {
  startupFee: 1000,      // Costo fijo de arranque (BaseBedCost original)
  hourlyRate: 2500,      // Costo por hora de impresión
  minPrice: 3000,        // Precio mínimo por pedido
  costPerGramBase: 12,   // Costo base por gramo (PLA)
  printBed: {            // Dimensiones máximas de impresión
    width: 320,
    depth: 320,
    height: 350
  }
};

// Materiales con metadatos para la UI pero PRECIOS RELATIVOS a tu base
export const MATERIALS = {
  PLA: {
    id: 'PLA',
    name: 'PLA Estándar',
    density: 1.24,
    priceMultiplier: 1.0, // Base ($12/g)
    description: 'Estándar para impresiones visuales y prototipos rápidos. Excelente acabado superficial y biodegradable.'
  },
  PETG: {
    id: 'PETG',
    name: 'PETG Resistente',
    density: 1.27,
    priceMultiplier: 1.0, // Mismo precio base
    description: 'Balance ideal entre resistencia y facilidad. Soporta humedad, químicos y exteriores. Perfecto para piezas mecánicas funcionales y soportes.'
  },
  ABS: {
    id: 'ABS',
    name: 'ABS Industrial',
    density: 1.04,
    priceMultiplier: 1.0, // Mismo precio base
    description: 'Termoplástico robusto de ingeniería. Alta resistencia al impacto y temperatura. Ideal para automoción, carcasas y piezas finales.'
  },
  TPU: {
    id: 'TPU',
    name: 'TPU Flexible',
    density: 1.21,
    priceMultiplier: 2.0, // Doble precio
    description: 'Elastómero tipo caucho. Flexible, elástico y casi indestructible ante impactos. Ideal para juntas, fundas protectoras y amortiguadores.'
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
  { id: 0.24, name: 'Borrador Rápido (0.24mm)', layerHeight: 0.24, priceMultiplier: 0.7, description: 'Capas visibles. Velocidad y economía. Ideal para pruebas de forma.' },
  { id: 0.20, name: 'Estándar (0.20mm)', layerHeight: 0.2, priceMultiplier: 1.0, description: 'Balance perfecto entre calidad y tiempo. El estándar de la industria.' },
  { id: 0.16, name: 'Alta Calidad (0.16mm)', layerHeight: 0.16, priceMultiplier: 1.5, description: 'Excelente acabado superficial. Capas mucho menos visibles. Ideal para detalles finos.' },
];

export const DEFAULT_CONFIG = {
  material: 'PLA',
  colorId: null,
  qualityId: 0.20, // ID Numérico (Estándar)
  infill: 15, // Actualizado a 15% (El más común)
  quantity: 1,
};
