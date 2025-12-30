import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './components/ui/FileUpload';
import Viewer3D from './components/Viewer3D';
import ErrorBoundary from './components/ErrorBoundary';
import CubeLoader from './components/ui/CubeLoader';
import Configurator from './components/ui/Configurator';
import PriceSummary from './components/ui/PriceSummary';
import ScaleControl from './components/ui/ScaleControl';
import OrderModal from './components/OrderModal';
import { DEFAULT_CONFIG, COLORS } from './utils/constants';
import { calculatePriceFromStats } from './utils/pricingEngine';
import { calculateGeometryData, calculateOptimalOrientation, calculateAutoScale } from './utils/geometryUtils';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import FileAvailabilitySelector from './components/FileAvailabilitySelector';
import CircuitBackground from './components/CircuitBackground';
import StepIndicator from './components/ui/StepIndicator';

import { useBackendQuote } from './hooks/useBackendQuote';

const App = () => {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [localGeometry, setLocalGeometry] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Estado para indicar conversión de formato (STEP -> STL)
  const [isConverting, setIsConverting] = useState(false);
  // Estado para la selección inicial (null = no ha elegido, true = tiene archivo, false = necesita ayuda)
  const [userHasFile, setUserHasFile] = useState(null);

  // Estado para orientación y escala óptimas
  const [optimalRotation, setOptimalRotation] = useState([0, 0, 0]);
  const [autoScale, setAutoScale] = useState(1.0);
  const [scaleInfo, setScaleInfo] = useState(null);

  const { getQuote, quoteData, isLoading, error, resetQuote } = useBackendQuote();

  const handleFileSelect = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();

    // Resetear estados
    setIsConverting(false);
    setFile(selectedFile);
    setLocalGeometry(null);
    resetQuote();

    if (ext === 'stl') {
      const url = URL.createObjectURL(selectedFile);
      setFileUrl(url);
    } else {
      // Si es STEP, esperamos a que el backend devuelva el STL convertido
      console.log("Archivo STEP detectado. Esperando conversión del servidor...");
      setIsConverting(true);
      setFileUrl(null);
    }

    getQuote(selectedFile, config.material, config.qualityId, config.infill, [0, 0, 0], 1.0)
      .catch(err => {
        console.error('Error al obtener cotizacion inicial:', err);
        setIsConverting(false);
      });
  };

  // Efecto: Si el backend devuelve una URL de STL convertido, usarla solo si cambia
  useEffect(() => {
    if (quoteData) {
      setIsConverting(false);
      if (quoteData.convertedStlUrl) {
        const backendHost = window.location.hostname;
        const fullUrl = `http://${backendHost}:3001${quoteData.convertedStlUrl}`;

        // Evitar loop infinito
        if (fileUrl !== fullUrl) {
          console.log('🔄 Modelo convertido recibido (actualizando visor):', fullUrl);
          setFileUrl(fullUrl);
        }
      }
    }
  }, [quoteData, fileUrl]);

  const handleGeometryLoaded = (geometry) => {
    // Viewer3D ahora pasa geometry directamente (version original)
    const data = calculateGeometryData(geometry);
    setLocalGeometry(data);

    // 1. Calcular Orientación Óptima
    const orientation = calculateOptimalOrientation(geometry);
    const newRotation = [orientation.rotationX, orientation.rotationY, orientation.rotationZ];
    setOptimalRotation(newRotation);

    console.log(`Auto-Orientación: ${orientation.orientationName} (${(orientation.rotationX * 180 / Math.PI).toFixed(1)}°, ${(orientation.rotationY * 180 / Math.PI).toFixed(1)}°, ${(orientation.rotationZ * 180 / Math.PI).toFixed(1)}°)`);
    // 2. Calcular Auto-Escala

    const scaleResult = calculateAutoScale(data.dimensions);
    let finalScale = 1.0;

    if (scaleResult.needsScaling) {
      finalScale = scaleResult.scaleFactor;
      setAutoScale(finalScale);
      setScaleInfo(scaleResult);
      console.warn(`Modelo muy grande - Auto-escalado a ${(scaleResult.scaleFactor * 100).toFixed(0)}%`);
    } else {
      setAutoScale(1.0);
      setScaleInfo(null);
    }

    // 3. Recotizar con parámetros optimizados
    // Nota: handleFileSelect dispara una cotización inicial (todo en 0), 
    // pero esta la reemplazará con los valores optimizados (cancelando la anterior gracias a AbortController).
    getQuote(file, config.material, config.qualityId, config.infill, newRotation, finalScale)
      .catch(err => console.error('Error al recotizar con geometría optimizada:', err));
  };

  const handleConfigChange = (newConfig) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);

    const isPriceAffecting =
      (newConfig.material !== undefined && newConfig.material !== config.material) ||
      (newConfig.qualityId !== undefined && newConfig.qualityId !== config.qualityId) ||
      (newConfig.infill !== undefined && newConfig.infill !== config.infill);

    if (file && isPriceAffecting) {
      console.log("Recotizando por cambio de configuracion...");
      getQuote(file, updatedConfig.material, updatedConfig.qualityId, updatedConfig.infill, optimalRotation, autoScale)
        .catch(err => console.error('Error al recotizar:', err));
    }
  };

  const handleScaleChange = (newScale) => {
    setAutoScale(newScale);

    console.log(`Escala ajustada manualmente a ${(newScale * 100).toFixed(0)}%`);
    // Recotizar con nueva escala
    if (file) {
      getQuote(file, config.material, config.qualityId, config.infill, optimalRotation, newScale)
        .catch(err => console.error('Error al recotizar con nueva escala:', err));
    }
  };



  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  // Priorizar el colorData dinámico que viene del Configurator, fallback a lista estática
  const currentColorHex = config.colorData?.hex || COLORS.find(c => c.id === config.colorId)?.hex || '#ffffff';

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
  // Calcular estadísticas (Reales o Estimadas)
  const getEstimatedStats = () => {
    if (!quoteData || !localGeometry) return null;

    // 1. CASO NORMAL: Tenemos datos de Slicer
    if (quoteData.peso > 0) {
      return {
        weightGrams: quoteData.peso,
        timeHours: quoteData.tiempoHoras,
        tieneSoportes: quoteData.tieneSoportes || false,
        pesoSoportes: 0 // Deprecated
      };
    }

    // 2. CASO GIGANTE / FALLBACK: Usamos geometría pura
    // Peso = Volumen * Densidad(1.24) * Factor_Consolidado(Relleno + Paredes + Soportes)
    const densityFactor = 0.45 + (config.infill / 200);
    const weight = localGeometry.volumeCm3 * 1.24 * densityFactor * autoScale * autoScale * autoScale;

    // Tiempo: Regla de 3 simple conservadora (ej. 40g/hora)
    const time = weight / 40;

    return {
      weightGrams: weight,
      timeHours: time,
      tieneSoportes: false, // En fallback asumimos NO hasta demostrar lo contrario
      isEstimated: true
    };
  };

  const stats = getEstimatedStats();

  const estimateForUI = stats ? {
    ...calculatePriceFromStats(config, stats),
    // Agregar volumen real del STL para transparencia
    volumeStlCm3: localGeometry.volumeCm3,
    // Propiedad directa para UI de soportes
    tieneSoportes: stats.tieneSoportes,
    pesoSoportes: 0, // Legacy support to avoid crashes if used elsewhere
    // Agregar dimensiones para el desglose
    dimensions: localGeometry.dimensions ? {
      x: (localGeometry.dimensions.x / 10).toFixed(2), // mm a cm
      y: (localGeometry.dimensions.y / 10).toFixed(2),
      z: (localGeometry.dimensions.z / 10).toFixed(2)
    } : null
  } : null;

  // === DEBUG DE PRECIOS (Solo Consola) ===
  useEffect(() => {
    if (estimateForUI) {
      console.log('💰 Nueva Estimación UI:', estimateForUI);
    }
  }, [estimateForUI]);




  // --- LANDING VIEW (SELECTOR INICIAL O UPLOAD) ---
  if (!file) {
    return (
      <div className="min-h-screen flex flex-col bg-brand-light font-sans text-brand-dark overflow-hidden relative">
        <CircuitBackground />
        <Header />

        <div className="flex-1 flex flex-col justify-center items-center px-4 relative z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[100px]"></div>

          <main className="max-w-6xl w-full relative z-10 flex flex-col items-center gap-12 animate-fade-in-up py-20">
            <AnimatePresence mode="wait">
              {userHasFile === null && (
                <motion.div
                  key="selector"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="w-full"
                >
                  <FileAvailabilitySelector
                    onHasFile={() => setUserHasFile(true)}
                    onNeedsHelp={() => setUserHasFile(false)}
                  />
                </motion.div>
              )}

              {userHasFile === true && (
                <>
                  <motion.div
                    key="step-indicator"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center mb-6"
                  >
                    <StepIndicator currentStep={2} />
                  </motion.div>

                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-4xl bg-white/60 backdrop-blur-xl p-3 rounded-[2rem] shadow-2xl border border-white"
                  >
                    <FileUpload onFileSelect={handleFileSelect} onBack={() => setUserHasFile(null)} />
                  </motion.div>
                </>
              )}

              {userHasFile === false && (
                <motion.div
                  key="tutorial"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-4xl bg-white/60 backdrop-blur-xl p-12 rounded-[2rem] shadow-2xl border border-white mt-10"
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                      Tutorial de Obtención de Archivos 3D
                    </h2>
                    <p className="text-gray-600 mb-8">
                      Próximamente: Guía completa de cómo obtener archivos STL/STEP
                    </p>
                    <button
                      onClick={() => setUserHasFile(null)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all"
                    >
                      ← Volver
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        <Footer />
      </div>
    );
  }

  // --- APP VIEW (SPLIT SCREEN) ---
  return (
    <div className="h-screen w-full bg-brand-light font-sans text-brand-dark flex flex-col lg:flex-row overflow-hidden relative selection:bg-brand-primary/30 pt-16">
      <Header />

      {/* Fondo Decorativo Sutil */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply hidden lg:block"></div>
      <div className="absolute bottom-[-20%] right-[40%] w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply hidden lg:block"></div>

      {/* LEFT COLUMN: 3D VIEWER (FIJO) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full lg:w-[65%] h-full relative p-4 lg:p-2 bg-transparent flex flex-col z-0 overflow-hidden"
      >
        <div className="flex-1 bg-white rounded-3xl shadow-2xl overflow-hidden relative ring-1 ring-slate-200/50 group h-full">
          <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
            <button
              onClick={handleReset}
              className="w-10 h-10 bg-white/90 backdrop-blur border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 shadow-sm hover:scale-105 hover:bg-white active:scale-95 transition-all group/btn"
              title="Volver al inicio"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <StepIndicator currentStep={3} />
            <div className="bg-white/90 backdrop-blur border border-slate-200 px-4 py-2 rounded-xl text-slate-700 font-bold text-sm shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {file.name}
            </div>
          </div>

          {fileUrl && (
            <Viewer3D
              fileUrl={fileUrl}
              colorHex={currentColorHex}
              onGeometryLoaded={handleGeometryLoaded}
              rotation={optimalRotation}
              scale={autoScale}
            />
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center text-brand-secondary"
            >
              <CubeLoader />
              <p className="font-bold text-lg mt-8 tracking-tight text-brand-primary animate-pulse">
                {isConverting ? 'Convirtiendo formato STEP ➔ STL...' : 'Optimizando Modelo...'}
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        className="w-full lg:w-[35%] h-full bg-white/60 backdrop-blur-xl shadow-[-20px_0_40px_-10px_rgba(148,163,184,0.15)] z-10 flex flex-col border-l border-slate-200/50 overflow-hidden rounded-l-3xl"
      >
        <div className="px-8 py-6 border-b border-slate-200/50 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur z-20">
          <div>
            <h2 className="text-2xl font-black text-slate-700 tracking-tight">Cotización</h2>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-1">Configura tu impresión</p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-800 flex items-center gap-3 shadow-sm"
            >
              <div className="p-2 bg-red-100 rounded-full text-red-600">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <strong className="block text-red-900">Ups, hubo un problema:</strong>
                {error}
              </div>
            </motion.div>
          )}

          {/* Alerta de Modelo Oversized */}
          {quoteData?.oversized && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900 shadow-sm"
            >
              <div className="flex gap-3">
                <div className="p-2 bg-amber-100 rounded-full h-fit text-amber-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <strong className="block text-amber-800 mb-1 text-base">Modelo fuera de límites</strong>
                  <p className="mb-2 text-amber-700/80">El modelo excede el volumen de impresión disponible.</p>

                  <div className="bg-white/60 rounded-lg p-2.5 mb-2 text-xs grid grid-cols-2 gap-x-4 gap-y-1 border border-amber-200/50">
                    <span className="text-amber-800/60 font-medium">Tu Modelo:</span>
                    <span className="font-mono font-bold text-red-600 text-right">
                      {localGeometry
                        ? `${localGeometry.dimensions.x.toFixed(0)} × ${localGeometry.dimensions.y.toFixed(0)} × ${localGeometry.dimensions.z.toFixed(0)} mm`
                        : quoteData?.dimensions
                          ? `${quoteData.dimensions.x.toFixed(0)} × ${quoteData.dimensions.y.toFixed(0)} × ${quoteData.dimensions.z.toFixed(0)} mm`
                          : 'Calculando...'}
                    </span>

                    <span className="text-amber-800/60 font-medium">Máximo:</span>
                    <span className="font-mono font-bold text-emerald-600 text-right">325 × 320 × 325 mm</span>
                  </div>

                  <p className="text-xs font-bold text-amber-800">
                    📉 Por favor reduce la escala abajo para continuar.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <Configurator
            config={config}
            geometry={localGeometry}
            onChange={handleConfigChange}
          />

          {localGeometry && (
            <div className="mt-8 pt-8 border-t border-dashed border-slate-200">
              <ScaleControl
                scale={autoScale}
                onChange={handleScaleChange}
                scaleInfo={scaleInfo}
                dimensions={localGeometry.dimensions}
              />
            </div>
          )}

          <PriceSummary
            estimate={estimateForUI}
            config={config}
            onAddToCart={handleAddToCart}
            isLoading={isLoading || !quoteData}
          />

          <div className="mt-12 -mx-8 -mb-8">
            <Footer />
          </div>
        </div>
      </motion.div>

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
