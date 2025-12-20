import React, { useState, useEffect, useRef } from 'react';
import FileUpload from './components/ui/FileUpload';
import Viewer3D from './components/Viewer3D';
import Configurator from './components/ui/Configurator';
import PriceSummary from './components/ui/PriceSummary';
import OrderModal from './components/OrderModal';
import { DEFAULT_CONFIG, COLORS } from './utils/constants';
import { calculatePriceFromStats } from './utils/pricingEngine';

import { useBackendQuote } from './hooks/useBackendQuote';

const App = () => {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [localGeometry, setLocalGeometry] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { getQuote, quoteData, isLoading, error, resetQuote } = useBackendQuote();

  const handleFileSelect = (selectedFile) => {
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setFileUrl(url);
    setLocalGeometry(null);
    resetQuote();

    console.log("📂 Archivo cargado:", selectedFile.name);
    getQuote(selectedFile, config.material, config.qualityId, config.infill);
  };

  const handleGeometryLoaded = (data) => {
    setLocalGeometry(data);
  };

  const handleConfigChange = (newConfig) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    const isPriceAffecting =
      (newConfig.material !== undefined && newConfig.material !== config.material) ||
      (newConfig.qualityId !== undefined && newConfig.qualityId !== config.qualityId) ||
      (newConfig.infill !== undefined && newConfig.infill !== config.infill);

    if (file && isPriceAffecting) {
      console.log("🔄 Recotizando por cambio de configuración...");
      getQuote(file, updatedConfig.material, updatedConfig.qualityId, updatedConfig.infill);
    }
  };

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const currentColorHex = COLORS.find(c => c.id === config.colorId)?.hex || '#ffffff';

  const handleAddToCart = () => {
    if (!file) return;
    setIsModalOpen(true);
  };

  const handleReset = () => {
    setFile(null);
    setFileUrl(null);
    setLocalGeometry(null);
    setConfig(DEFAULT_CONFIG);
    resetQuote();
  }

  const handleOrderSubmit = async (customerData) => {
    console.log("Order Submitted:", { ...customerData, file, config, quoteData });
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("¡Pedido recibido con éxito! Te contactaremos pronto.");
      setIsModalOpen(false);
      handleReset();
    } catch (e) {
      alert("Error al enviar pedido");
    }
  };

  // Combinar datos: Tiempo del backend + Peso del frontend ajustado por relleno
  const estimateForUI = (quoteData && localGeometry && localGeometry.volumeCm3 > 0) ? {
    ...calculatePriceFromStats(config, {
      // Calcular peso considerando el % de relleno
      // Basado en prueba real: 4.21cm³ usado / 7.4cm³ STL con 20% relleno = 57%
      // Factor calibrado: 0.37 (cáscaras fijas) + 1.0 × (relleno%)
      // Con 20%: 0.37 + 0.20 = 0.57 ✓
      // Con 15%: 0.37 + 0.15 = 0.52
      weightGrams: localGeometry.volumeCm3 * 1.24 * (0.37 + (config.infill / 100)),
      timeHours: quoteData.tiempoHoras, // Del backend (PrusaSlicer)
      pesoSoportes: 0
    }),
    // Agregar dimensiones para el desglose
    dimensions: localGeometry.dimensions ? {
      x: (localGeometry.dimensions.x / 10).toFixed(2), // mm a cm
      y: (localGeometry.dimensions.y / 10).toFixed(2),
      z: (localGeometry.dimensions.z / 10).toFixed(2)
    } : null
  } : null;

  useEffect(() => {
    if (quoteData) {
      console.group("📊 Datos de Cotización (Debug)");
      console.log("1. Respuesta del Backend (Física Prusa):", quoteData);
      console.log("   - Volumen:", quoteData.volumen?.toFixed(2), "cm3");
      console.log("   - Peso Calculado:", quoteData.peso?.toFixed(2), "g");
      console.log("   - Tiempo Impresión:", quoteData.tiempoTexto, `(${quoteData.tiempoHoras?.toFixed(2)}h)`);

      if (estimateForUI) {
        console.log("2. Cálculo del Frontend (Economía CLP):", estimateForUI);
        console.log(`   - Costo Material (${Math.ceil(estimateForUI.weightGrams)}g): $${estimateForUI.materialCost}`);
        console.log(`   - Costo Tiempo (${estimateForUI.estimatedTimeHours.toFixed(2)}h): $${estimateForUI.timeCost}`);
        console.log("   - Tarifa Base: $", estimateForUI.startupFee);
        console.log("   - PRECIO UNITARIO FINAL: $", estimateForUI.unitPrice);
      }
      console.groupEnd();
    }
  }, [quoteData, estimateForUI]);


  // --- LANDING VIEW (UPLOAD SIMPLE) ---
  if (!file) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-brand-light font-sans text-brand-dark overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[100px]"></div>

        <main className="max-w-4xl w-full relative z-10 flex flex-col items-center gap-12 animate-fade-in-up">

          <div className="w-full max-w-xl bg-white/60 backdrop-blur-xl p-3 rounded-[2rem] shadow-2xl border border-white mt-10">
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        </main>
      </div>
    );
  }

  // --- APP VIEW (SPLIT SCREEN) ---
  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark flex flex-col lg:flex-row overflow-hidden">

      {/* LEFT COLUMN: 3D VIEWER */}
      <div className="w-full lg:w-[65%] h-[50vh] lg:h-screen relative p-4 lg:p-6 bg-brand-light flex flex-col">
        <div className="flex-1 bg-white rounded-3xl shadow-xl overflow-hidden relative ring-1 ring-black/5 group">
          <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
            <button
              onClick={handleReset}
              className="w-10 h-10 bg-white/90 backdrop-blur border border-brand-light rounded-xl flex items-center justify-center text-brand-dark shadow-sm hover:scale-105 active:scale-95 transition-all group/btn"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div className="bg-white/90 backdrop-blur border border-brand-light px-4 py-2 rounded-xl text-brand-secondary font-bold text-sm shadow-sm">
              {file.name}
            </div>
          </div>

          {fileUrl && (
            <Viewer3D
              fileUrl={fileUrl}
              colorHex={currentColorHex}
              onGeometryLoaded={handleGeometryLoaded}
            />
          )}

          {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-brand-secondary">
              <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-lg animate-pulse">Analizando Geometría...</p>
              <p className="text-xs text-brand-dark/50 mt-2">PrusaSlicer Engine</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CONFIGURATION */}
      <div className="w-full lg:w-[35%] h-auto lg:h-screen bg-white shadow-2xl z-10 flex flex-col border-l border-brand-light/50">
        <div className="px-8 py-6 border-b border-brand-light flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-20">
          <h2 className="text-2xl font-black text-brand-secondary tracking-tight">Cotización</h2>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-800">
              <strong>Error de Conexión:</strong> {error}. Verifica que el puerto 3001 esté activo.
            </div>
          )}

          <Configurator
            config={config}
            geometry={localGeometry}
            onChange={handleConfigChange}
          />

          <PriceSummary
            estimate={estimateForUI}
            config={config}
            onAddToCart={handleAddToCart}
            isLoading={isLoading || !quoteData}
          />
        </div>
      </div>

      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleOrderSubmit}
        orderData={{
          fileName: file.name,
          material: config.material,
          printTime: quoteData?.tiempoTexto || '---',
          price: estimateForUI?.totalPrice || 0,
          weight: quoteData?.peso
        }}
      />

    </div>
  );
};

export default App;
