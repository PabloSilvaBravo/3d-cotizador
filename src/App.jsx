import React, { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FileUpload from './components/ui/FileUpload';
import Viewer3D from './components/Viewer3D';
import ErrorBoundary from './components/ErrorBoundary';
import CubeLoader from './components/ui/CubeLoader';
import Configurator from './components/ui/Configurator';
import PriceSummary from './components/ui/PriceSummary';
import ScaleControl from './components/ui/ScaleControl';
import { DEFAULT_CONFIG, COLORS, MATERIALS, QUALITIES } from './utils/constants';
import { enviarCorreo } from './services/emailService';
import { calculatePriceFromStats } from './utils/pricingEngine';
import { calculateGeometryData, calculateOptimalOrientation, calculateAutoScale } from './utils/geometryUtils';
import { uploadToDrive } from './services/driveService';
import { addToCartAndRedirect, addToCart } from './services/cartService';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import FileAvailabilitySelector from './components/FileAvailabilitySelector';
import CircuitBackground from './components/CircuitBackground';
import StepIndicator from './components/ui/StepIndicator';
import { QuoteCart } from './components/QuoteCart';

import { useBackendQuote } from './hooks/useBackendQuote';

// Lazy loading de componentes pesados que no se necesitan inmediatamente
const OrderModal = lazy(() => import('./components/OrderModal'));
const DiscoveryPortal = lazy(() => import('./components/DiscoveryPortal'));
const SuccessScreen = lazy(() => import('./components/SuccessScreen'));
const UploadPage = lazy(() => import('./components/UploadPage'));
const ItemAddedModal = lazy(() => import('./components/ItemAddedModal'));


const App = () => {
  const captureRef = useRef(null); // Ref para capturar imagen del Viewer3D
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [localGeometry, setLocalGeometry] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Estado para indicar conversión de formato (STEP -> STL)
  const [isConverting, setIsConverting] = useState(false);
  // Estado para la selección inicial (null = no ha elegido, true = tiene archivo, false = necesita ayuda)
  const [userHasFile, setUserHasFile] = useState(null);

  // Estado para Carrito Múltiple
  const [cartItems, setCartItems] = useState([]);
  const [isItemAddedModalOpen, setIsItemAddedModalOpen] = useState(false);
  const [lastAddedItemName, setLastAddedItemName] = useState('');

  // Estado para orientación y escala óptimas
  const [optimalRotation, setOptimalRotation] = useState([0, 0, 0]);
  const [autoScale, setAutoScale] = useState(1.0);
  const [scaleInfo, setScaleInfo] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSimpleMode, setIsSimpleMode] = useState(false);

  // Estado para integración Carrito
  const [isCartProcessing, setIsCartProcessing] = useState(false);
  const [driveLink, setDriveLink] = useState(null);

  const { getQuote, quoteData, isLoading, error, resetQuote } = useBackendQuote();

  // --- ROUTING & SYNC ---
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Configurator / Checkout (Requiere archivo)
    if (location.pathname === '/configurator' || location.pathname === '/checkout') {
      if (!file) {
        navigate('/', { replace: true });
      }
    }
    // 2. Auto-navegación: Si cargamos archivo en / o /tutorial, ir a configurador
    if (file && (location.pathname === '/' || location.pathname === '/tutorial')) {
      navigate('/configurator', { replace: true });
    }

    // 3. Sincronización Modal Checkout
    if (location.pathname === '/checkout') {
      if (!isModalOpen) setIsModalOpen(true);
    }

    // 4. Sincronización Vistas (Landing / Tutorial)
    if (location.pathname === '/tutorial') {
      if (userHasFile !== false) setUserHasFile(false);
    } else if (location.pathname === '/') {
      // En Home puede ser null (selector) o true (upload step).
      // Si no tenemos file, forzamos null (selector).
      if (!file && userHasFile !== null) setUserHasFile(null);
    }
  }, [file, location.pathname, navigate, isModalOpen, userHasFile]);

  // Handlers de Navegación
  const handleGoToCheckout = () => navigate('/checkout');
  const handleBackToConfigurator = () => navigate('/configurator');
  // ----------------------

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
        // const backendHost = window.location.hostname;
        // const fullUrl = `http://${backendHost}:3001${quoteData.convertedStlUrl}`;

        // Usar URL de producción del dominio
        const fullUrl = `https://3d.mechatronicstore.cl${quoteData.convertedStlUrl}`;

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

  // Resetear configuración al modo simple
  useEffect(() => {
    if (isSimpleMode) {
      setConfig(prev => ({ ...prev, material: 'PLA', qualityId: 'standard', infill: 15 }));
    }
  }, [isSimpleMode]);



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
    setUserHasFile(null);
    setIsSuccess(false);
  }

  const handleOrderSubmit = async (customerData) => {
    console.log("Procesando envío de pedido...", { ...customerData, file, config, quoteData, cartItems });

    // Determinar qué estamos cotizando: Carrito o Archivo Individual
    const hasCartItems = cartItems.length > 0;
    const itemsToQuote = hasCartItems ? cartItems : (file ? [{
      fileName: file.name,
      material: config.material,
      colorData: config.colorData,
      colorId: config.colorId,
      qualityId: config.qualityId,
      infill: config.infill,
      quantity: config.quantity,
      price: estimateForUI?.totalPrice || 0,
      driveUrl: null, // Se llenará más abajo
      dimensions: localGeometry?.dimensions || estimateForUI?.dimensions,
      volume: localGeometry?.volumeCm3 || quoteData?.volumen || 0,
      weight: estimateForUI?.weightGrams || 0,
      time: quoteData?.tiempoTexto || estimateForUI?.timeHours || 0,
      scale: autoScale
    }] : []);

    if (itemsToQuote.length === 0) {
      alert("No hay ítems para cotizar.");
      return;
    }

    console.log("📦 Items a cotizar:", itemsToQuote);

    // Si es archivo único y no tiene DriveLink, subirlo ahora
    let fileBase64 = null;
    if (!hasCartItems && file) {
      try {
        console.log("Subiendo archivo único a Drive...");
        const result = await uploadToDrive(file);
        if (result.success) {
          itemsToQuote[0].driveUrl = result.url;
          console.log("✅ Archivo subido a Drive:", result.url);
        }
      } catch (err) {
        console.error("⚠️ Falló Drive, intentando base64...", err);
        try {
          fileBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
          });
        } catch (e) {
          console.error("❌ Error fatal base64:", e);
        }
      }
    }

    const dateStr = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    // Calcular total general
    const grandTotal = itemsToQuote.reduce((sum, item) => sum + (item.price || 0), 0);
    const totalQuantity = itemsToQuote.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // Generar HTML para cada item con TODAS las especificaciones técnicas
    const itemsHtmlBlocks = itemsToQuote.map((item, index) => {
      // Determinar si los datos vienen del payload (carrito) o del item directo
      const isFromCart = !!item.payload;

      // Extraer datos del payload si están disponibles
      const material = isFromCart ? item.payload.material : item.material;
      const color = isFromCart ? item.payload.color : (item.colorData?.name || item.color);
      const layerHeight = isFromCart ? item.payload.layerHeight : item.qualityId;
      const infill = isFromCart ? item.payload.infill : item.infill;
      const weight = isFromCart ? item.payload.weight : item.weight;
      const printTime = isFromCart ? item.payload.printTime : item.time; // printTime viene en MINUTOS
      const dimensionsRaw = isFromCart ? item.payload.dimensions : item.dimensions;

      // Obtener nombres legibles
      const materialName = MATERIALS[material]?.name || material;
      const qualityName = QUALITIES.find(q => q.id === layerHeight)?.name || `${layerHeight}mm`;
      const colorName = color || 'Sin especificar';

      // Dimensiones - parsear si viene como string "XXxYYxZZ"
      let dimsStr = 'N/A';
      if (typeof dimensionsRaw === 'string' && dimensionsRaw !== 'N/A') {
        dimsStr = dimensionsRaw.replace(/x/g, ' x ') + ' mm';
      } else if (dimensionsRaw && typeof dimensionsRaw === 'object') {
        const scale = item.scale || 1;
        dimsStr = `${(dimensionsRaw.x * scale).toFixed(1)} x ${(dimensionsRaw.y * scale).toFixed(1)} x ${(dimensionsRaw.z * scale).toFixed(1)} mm`;
      }

      // Volumen - calcular desde peso si no está disponible
      const volume = item.volume || (weight && material ? (weight / (MATERIALS[material]?.density || 1.24)).toFixed(2) : 0);
      const volStr = `${parseFloat(volume).toFixed(2)} cm³`;

      // Peso
      const weightStr = `${parseFloat(weight || 0).toFixed(1)}g`;

      // Enlace de descarga
      const driveUrl = item.driveUrl || item.payload?.driveUrl;
      const downloadLink = driveUrl
        ? `<a href="${driveUrl}" style="color: #2563eb; font-weight: 700; text-decoration: underline; font-size: 12px; background-color: #e0f2fe; padding: 4px 8px; border-radius: 4px; display: inline-block;">⬇️ DESCARGAR MODELO 3D (DRIVE)</a>`
        : '<span style="color: #059669; font-size: 11px;">📎 Adjunto en este correo</span>';

      // Verificar si este item tiene precio mínimo aplicado
      const itemHasMinimumPrice = (item.price || 0) <= 3000;

      return `
        ${index > 0 ? '<div style="border-top: 2px dashed #e2e8f0; margin: 30px 0;"></div>' : ''}
        
        <!-- ITEM ${index + 1}: ${item.fileName} -->
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
          
          <div style="border-left: 4px solid #6017b1; padding-left: 12px; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #5b21b6; font-size: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">
              ${hasCartItems ? `Modelo ${index + 1} de ${itemsToQuote.length}` : 'Especificaciones Técnicas'}
            </h3>
          </div>

          <!-- Grid de 3 Columnas -->
          <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 15px;">
            <tr>
              <td width="40%" valign="top" style="padding-bottom: 12px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">ARCHIVO 3D</div>
                <div style="font-size: 13px; color: #334155; font-weight: 700; margin-bottom: 4px;">${item.fileName}</div>
                ${downloadLink}
              </td>
              <td width="30%" valign="top" style="padding-bottom: 12px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">DIMENSIONES</div>
                <div style="font-size: 12px; color: #334155; font-family: monospace;">${dimsStr}</div>
              </td>
              <td width="30%" valign="top" style="padding-bottom: 12px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">VOLUMEN</div>
                <div style="font-size: 12px; color: #334155; font-weight: 700;">${volStr}</div>
              </td>
            </tr>
            <tr>
              <td width="40%" valign="top" style="padding-bottom: 12px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">MATERIAL, COLOR Y CALIDAD</div>
                <div style="font-size: 13px; color: #334155;">${materialName} - ${colorName}</div>
                <div style="font-size: 11px; color: #475569; margin-top: 2px;">Calidad: <strong>${qualityName}</strong></div>
              </td>
              <td width="15%" valign="top" style="padding-bottom: 12px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">RELLENO</div>
                <div style="font-size: 12px; color: #334155;">${infill}%</div>
              </td>
              <td width="15%" valign="top" style="padding-bottom: 12px;">
                <div style="font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">CANTIDAD</div>
                <div style="font-size: 12px; color: #334155;"><strong>${item.quantity}</strong> un.</div>
              </td>
            </tr>
          </table>

          <!-- Información de Producción -->
          <div style="background-color: #ffffff; border-radius: 8px; padding: 12px; border: 1px solid #e2e8f0;">
            <table width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td width="50%" valign="top">
                  <div style="font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">PESO EST. TOTAL</div>
                  <div style="font-size: 14px; color: #334155; font-weight: 600;">${weightStr}</div>
                </td>
                <td width="50%" align="right" valign="top">
                  <div style="font-size: 9px; color: #b45309; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">PRECIO</div>
                  <div style="font-size: 20px; color: #d97706; font-weight: 800;">$${(item.price || 0).toLocaleString('es-CL')}</div>
                </td>
              </tr>
            </table>
          </div>

          ${itemHasMinimumPrice ? `
          <!-- ALERTA PRECIO MÍNIMO PARA ESTE ITEM -->
          <div style="margin-top: 15px; background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 12px;">
            <div style="color: #92400e; font-size: 11px; text-align: center;">
              <span style="font-size: 14px; vertical-align: middle; margin-right: 5px;">⚠️</span> 
              <strong>PRECIO MÍNIMO APLICADO:</strong> Este modelo está bajo nuestro precio mínimo de trabajo ($3.000 CLP). 
              <strong>El precio final será confirmado al cliente por correo electrónico.</strong>
            </div>
          </div>
          ` : ''}

        </div>
      `;
    }).join('');

    // Detectar si hay precios mínimos (simplificado)
    const hasMinimumPrice = itemsToQuote.some(item => (item.price || 0) <= 3000);

    const htmlBody = `
      <div style="font-family: 'Montserrat', system-ui, sans-serif; max-width: 800px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        
        <!-- HEADER ESTILO ORIGINAL -->
        <div style="background-color: #6017b1; padding: 25px 30px; color: white;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <h1 style="margin: 0; font-size: 20px; font-weight: 700; text-transform: uppercase; color: #fbbf24; letter-spacing: 0.5px;">Nueva Cotización Web</h1>
                <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; color: #e9d5ff;">Solicitud Cotizador 3D</p>
              </td>
              <td align="right" valign="top">
                 <div style="color: #ffffff; font-weight: 700; font-size: 14px;">${dateStr}</div>
                 <div style="color: #e9d5ff; font-size: 12px; margin-top: 2px;">${timeStr}</div>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding: 35px;">
        
          <!-- SECCION: DATOS CLIENTE -->
          <div style="background-color: #faf5ff; border-left: 5px solid #7c3aed; padding: 12px 15px; margin-bottom: 25px;">
             <h3 style="margin: 0; color: #5b21b6; font-size: 13px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Datos del Cliente</h3>
          </div>

          <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
             <tr>
               <td width="33%" valign="top" style="padding-bottom: 20px;">
                 <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">NOMBRE</div>
                 <div style="font-size: 15px; color: #334155; font-weight: 700; text-transform: uppercase;">${customerData.name}</div>
               </td>
               <td width="33%" valign="top" style="padding-bottom: 20px;">
                 <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">EMAIL</div>
                 <div style="font-size: 15px; color: #4338ca; font-weight: 600;">${customerData.email}</div>
               </td>
               <td width="33%" valign="top" style="padding-bottom: 20px;">
                 <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">TELÉFONO</div>
                 <div style="font-size: 15px; color: #334155; font-weight: 500;">${customerData.phone}</div>
               </td>
             </tr>
             ${customerData.comments ? `
             <tr>
               <td colspan="3">
                 <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">COMENTARIOS</div>
                 <div style="background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; color: #475569; font-style: italic;">
                   "${customerData.comments}"
                 </div>
               </td>
             </tr>` : ''}
          </table>

          <div style="height: 20px;"></div>
          <!-- SECCION: ESPECIFICACIONES -->
          <div style="background-color: #faf5ff; border-left: 5px solid #7c3aed; padding: 12px 15px; margin-bottom: 25px;">
             <h3 style="margin: 0; color: #5b21b6; font-size: 13px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">
               ${hasCartItems ? `Modelos a Cotizar (${itemsToQuote.length})` : 'Especificaciones Técnicas'}
             </h3>
          </div>
          
          <!-- ITEMS DEL CARRITO (cada uno con todas sus especificaciones) -->
          ${itemsHtmlBlocks}

          <!-- RESUMEN FINAL -->
          <div style="border-top: 3px solid #6017b1; margin-top: 30px; padding-top: 25px; background-color: #f8fafc; padding: 20px; border-radius: 12px;">
             <table width="100%" cellspacing="0" cellpadding="0">
               <tr>
                 <td valign="top" width="50%">
                    <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">ITEMS TOTALES</div>
                    <div style="font-size: 18px; color: #334155; font-weight: 700;">${totalQuantity} unidad${totalQuantity > 1 ? 'es' : ''}</div>
                 </td>
                 <td align="right" valign="top" width="50%">
                    <div style="background-color: #fffbeb; border: 2px solid #fcd34d; padding: 18px 30px; border-radius: 12px; display: inline-block; text-align: right; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                       <div style="font-size: 11px; color: #b45309; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL REFERENCIAL</div>
                       <div style="font-size: 32px; color: #d97706; font-weight: 800; line-height: 1.2;">$${grandTotal.toLocaleString('es-CL')}</div>
                       <div style="font-size: 10px; color: #b45309; opacity: 0.8; margin-top: 2px;">+ IVA INCLUIDO EN ESTIMACIÓN</div>
                    </div>
                 </td>
               </tr>
             </table>
          </div>

          <!-- ALERTA IMPORTANTE -->
          <div style="margin-top: 30px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 15px; text-align: center;">
             <div style="color: #16653 4; font-size: 13px;">
               <span style="font-size: 16px; vertical-align: middle; margin-right: 5px;">⚠️</span> 
               <strong>IMPORTANTE:</strong> Al responder este correo, escribirás directamente al cliente: 
               <a href="mailto:${customerData.email}" style="color: #2563eb; font-weight: 700; text-decoration: underline;">${customerData.email}</a>
             </div>
          </div>

        </div>

        <!-- FOOTER -->
        <div style="background-color: #f8fafc; padding: 15px; border-top: 2px solid #6017b1; text-align: center;">
           <p style="margin: 0; font-size: 12px; color: #475569; font-weight: 700;">MechatronicStore Cotizaciones 3D</p>
           <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">Generado el ${dateStr} a las ${timeStr}</p>
        </div>

      </div>
    `;

    // Preparar subject según tipo de pedido
    const emailSubject = hasCartItems
      ? `[Cotizador 3D] Pedido de ${customerData.name} - ${itemsToQuote.length} modelos`
      : `[Cotizador 3D] Pedido de ${customerData.name} - ${itemsToQuote[0].fileName}`;

    // Adjuntos: Solo si es archivo único SIN DriveLink (fallback base64)
    const attachments = (!hasCartItems && fileBase64) ? [{
      fileName: file.name,
      base64: fileBase64,
      mimeType: file.type || 'application/octet-stream'
    }] : [];

    console.log("📧 Enviando correo con:", { emailSubject, hasAttachments: attachments.length > 0 });

    try {
      const result = await enviarCorreo({
        to: 'ventas@mechatronicstore.cl',
        replyTo: customerData.email,
        subject: emailSubject,
        body: htmlBody,
        attachments
      });

      if (result.success) {
        setIsModalOpen(false);
        setIsSuccess(true);
      } else {
        alert("Hubo un error al enviar el pedido. Por favor intente nuevamente.");
        console.error("Email error:", result.error);
      }
    } catch (e) {
      console.error("Error crítico enviando pedido:", e);
      alert("Error de conexión al enviar pedido.");
    }
  };

  const handleRequestQuote = () => {
    setIsModalOpen(true);
  };



  /**
   * Resetea el visor, datos geométricos y estados para cargar un NUEVO archivo desde cero.
   * Mantiene el carrito para permitir "Subir otro archivo".
   */
  const handleResetForNewFile = () => {
    setIsItemAddedModalOpen(false);
    setFile(null);
    setFileUrl(null);
    setQuoteData(null);
    setLocalGeometry(null);
    setAnalysisResult(null);
    setDriveLink(null);
    setThumbnail(null);
    setOptimalRotation([0, 0, 0]);
    setUserHasFile(false); // Vuelve a pantalla "¿Tienes archivo?"
  };

  /**
   * Resetea TODO (incluido carrito) al volver al Home desde el Header.
   */
  const handleFullReset = () => {
    setCartItems([]); // Limpiar carrito
    handleResetForNewFile();
  };

  /**
   * Cierra el modal y permite seguir configurando el MISMO archivo (ej. otra variante de color).
   */
  const handleConfigureSame = () => {
    setIsItemAddedModalOpen(false);
  };

  /**
   * Maneja el flujo de "Agregar al Carrito" (WooCommerce)
   */
  const handleCheckoutCart = async () => {
    if (cartItems.length === 0) return;
    setIsCartProcessing(true);

    try {
      console.log(`🚀 Iniciando Checkout de ${cartItems.length} items...`);

      let lastResult = null;

      for (const item of cartItems) {
        lastResult = await addToCart(item.payload);
      }

      if (lastResult && lastResult.success && lastResult.cartUrl) {
        window.location.href = lastResult.cartUrl;
      } else {
        throw new Error("No se obtuvo URL de redirección del carrito.");
      }

    } catch (e) {
      console.error("❌ Error Finalizando Compra:", e);
      alert("Error al procesar el pedido. Intente nuevamente.");
      setIsCartProcessing(false);
    }
  };

  const handleRemoveFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };


  const handleWooCommerceCart = async () => {
    if (!file || !estimateForUI || !config.material) return;

    setIsCartProcessing(true);
    console.groupCollapsed("🛒 Proceso Agregar al Carrito");

    try {
      // 1. Subir a Drive (si no tenemos URL aún)
      let currentDriveLink = driveLink;

      if (!currentDriveLink) {
        console.log("📤 Subiendo archivo a Drive para carrito...");
        const result = await uploadToDrive(file);
        // driveService ahora retorna objeto { success, url, error } o { success:false } si falla el catch interno
        if (result.success) {
          currentDriveLink = result.url;
          setDriveLink(currentDriveLink);
          console.log("✅ Archivo subido:", currentDriveLink);
        } else {
          console.error("❌ Falló subida Drive:", result.error);
          throw new Error("No se pudo subir el archivo a Drive: " + (result.error || "Error desconocido"));
        }
      } else {
        console.log("♻️ Usando enlace Drive existente:", currentDriveLink);
      }

      // 2. Preparar payload conforme a documentación
      // colorData viene del Configurator via onChange
      const colorName = config.colorData ? config.colorData.name : "Estándar";

      // Tiempo en MINUTOS
      const timeMinutes = Math.ceil(estimateForUI.timeHours * 60);

      const payload = {
        // Requeridos
        fileName: file.name,
        price: Math.round(estimateForUI.totalPrice), // Entero para WC
        driveUrl: currentDriveLink,

        // Importantes
        material: config.material,
        color: colorName,
        infill: config.infill, // 15, 20, 100
        layerHeight: config.qualityId, // 0.2, 0.16 (Corregido: quality -> qualityId)
        weight: Math.ceil(estimateForUI.weightGrams) + 3, // +3g margen seguridad/empaque
        // thumbnailUrl eliminado para usar imagen por defecto
        printTime: timeMinutes,
        dimensions: estimateForUI.dimensions
          ? `${estimateForUI.dimensions.x}x${estimateForUI.dimensions.y}x${estimateForUI.dimensions.z}`
          : "N/A",

        // Opcionales
        quantity: config.quantity,
        notes: "" // Podríamos agregar un campo de notas en el futuro
      };

      console.log("🛒 Payload para WooCommerce:", payload);

      // 3. AGREGAR A CARRITO LOCAL (EN LUGAR DE REDIRIGIR)
      const newItem = {
        id: Date.now(),
        payload: payload,
        fileName: file.name,
        material: config.material,
        color: colorName,
        colorHex: config.colorData?.hex || '#94a3b8',
        quantity: config.quantity,
        price: Math.round(estimateForUI.totalPrice)
      };

      setCartItems(prev => [...prev, newItem]);
      console.log("✅ Agregado a Carrito Local:", newItem);
      console.groupEnd();

      // EXITO: Abrir Modal de Decisión
      setLastAddedItemName(file.name);
      setIsItemAddedModalOpen(true);

    } catch (e) {
      console.error("❌ Error Carrito:", e);
      alert("Error al agregar al carrito: " + e.message);
    } finally {
      setIsCartProcessing(false);
    }
  };

  // Combinar datos: Tiempo del backend + Peso del frontend ajustado por relleno
  // Calcular estadísticas (Reales o Estimadas)
  function getEstimatedStats() {
    if (!quoteData || !localGeometry) return null;

    // Dimensiones escaladas para cálculos de nesting
    const dims = localGeometry.dimensions || { x: 0, y: 0, z: 0 };
    const scaledDims = {
      x: dims.x * autoScale,
      y: dims.y * autoScale,
      z: dims.z * autoScale
    };

    // 1. CASO NORMAL: Tenemos datos de Slicer
    if (quoteData.peso > 0) {
      return {
        weightGrams: quoteData.peso,
        timeHours: quoteData.timeHours, // Propiedad correcta devuelta por backend
        tieneSoportes: localGeometry?.needsSupport || quoteData.tieneSoportes || false,
        pesoSoportes: 0, // Deprecated
        dimensions: scaledDims
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
      isEstimated: true,
      dimensions: scaledDims
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
    // Agregar dimensiones para el desglose (en mm y escaladas)
    dimensions: localGeometry?.dimensions ? {
      x: (localGeometry.dimensions.x * autoScale).toFixed(2),
      y: (localGeometry.dimensions.y * autoScale).toFixed(2),
      z: (localGeometry.dimensions.z * autoScale).toFixed(2)
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
    // Ruta dedicada para carga (/upload)
    if (location.pathname === '/upload') {
      return <UploadPage onFileSelect={handleFileSelect} />;
    }

    return (
      <div className="min-h-screen flex flex-col bg-brand-light font-sans text-brand-dark overflow-hidden relative">
        <CircuitBackground />
        <Header />

        <div className="flex-1 flex flex-col justify-center items-center px-4 relative z-10 pt-24 pb-12">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-accent/10 rounded-full blur-[100px]"></div>

          <main className="max-w-6xl w-full relative z-10 flex flex-col items-center gap-12 animate-fade-in-up py-10">
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
                    onFileSelect={handleFileSelect}
                    onNeedsHelp={() => navigate('/tutorial')}
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
                    <StepIndicator currentStep={2} totalSteps={2} />
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
                <DiscoveryPortal
                  onClose={() => navigate('/')}
                  onUploadClick={() => navigate('/upload')}
                />
              )}
            </AnimatePresence>
          </main >
        </div >

        <Footer />
      </div >
    );
  }

  // --- APP VIEW (SPLIT SCREEN) ---
  return (
    <div className="h-screen w-full bg-brand-light font-sans text-brand-dark flex flex-col lg:flex-row overflow-hidden relative selection:bg-brand-primary/30 pt-16">
      <AnimatePresence>
        {isSuccess && <SuccessScreen onReset={handleFullReset} />}
      </AnimatePresence>
      <Header
        isSimpleMode={isSimpleMode}
        onToggleSimpleMode={() => setIsSimpleMode(!isSimpleMode)}
        onHomeClick={handleFullReset}
      />

      {/* Fondo Decorativo Sutil */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply hidden lg:block"></div>
      <div className="absolute bottom-[-20%] right-[40%] w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none mix-blend-multiply hidden lg:block"></div>

      {/* LEFT COLUMN: 3D VIEWER (FIJO) */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full lg:flex-1 h-[40vh] lg:h-full relative p-2 lg:p-2 bg-transparent flex flex-col z-0 overflow-hidden shrink-0"
      >
        <div className="flex-1 bg-white rounded-3xl shadow-2xl overflow-hidden relative ring-1 ring-slate-200/50 group h-full">
          <div className="absolute top-4 left-4 lg:top-6 lg:left-6 z-20 flex items-center gap-2 lg:gap-3">
            <button
              onClick={handleFullReset}
              className="w-8 h-8 lg:w-10 lg:h-10 bg-white/90 backdrop-blur border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 shadow-sm hover:scale-105 hover:bg-white active:scale-95 transition-all group/btn"
              title="Volver al inicio"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div className="hidden sm:block">
              <StepIndicator currentStep={2} totalSteps={2} />
            </div>
            <div className="bg-white/30 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-slate-600 font-medium text-xs shadow-sm flex items-center gap-2 pointer-events-none select-none max-w-[150px] lg:max-w-[250px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)] shrink-0"></span>
              <span className="truncate opacity-90">{file.name}</span>
            </div>
          </div>

          {fileUrl && (
            <Viewer3D
              fileUrl={fileUrl}
              captureRef={captureRef}
              colorHex={currentColorHex}
              onGeometryLoaded={handleGeometryLoaded}
              rotation={optimalRotation}
              scale={autoScale}
              isLoading={isLoading}
            />
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        className="w-full lg:w-[420px] xl:w-[480px] 2xl:w-[550px] shrink-0 h-full flex-1 lg:flex-none bg-white/60 backdrop-blur-xl shadow-[-20px_0_40px_-10px_rgba(148,163,184,0.15)] z-10 flex flex-col border-l border-slate-200/50 overflow-hidden lg:rounded-l-3xl rounded-t-3xl lg:rounded-t-none -mt-6 lg:mt-0 pt-6 lg:pt-0 ring-1 ring-slate-900/5 lg:ring-0"
      >
        <div className="px-6 lg:px-8 py-4 lg:py-6 border-b border-slate-200/50 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur z-20">
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-700 tracking-tight">Cotización</h2>
            <p className="text-[10px] lg:text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5 lg:mt-1">Configura tu impresión</p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50">
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 lg:p-8 pb-20 lg:pb-8">
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
            isSimpleMode={isSimpleMode}
            onToggleSimpleMode={() => setIsSimpleMode(!isSimpleMode)}
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
            onAddToCart={handleGoToCheckout} // Usar Routing Handler
            onWooCommerceCart={handleWooCommerceCart}
            isCartLoading={isCartProcessing}
            isLoading={isLoading || !quoteData}
          />

          <div className="mt-4 -mx-8 -mb-8">
            <Footer />
          </div>
        </div>
      </motion.div>

      <Suspense fallback={null}>
        <OrderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleOrderSubmit}
          orderData={{
            fileName: cartItems.length > 0
              ? (cartItems.length > 1 ? `${cartItems.length} Modelos` : cartItems[0].fileName)
              : (file?.name || "Sin Archivo"),
            material: cartItems.length > 0
              ? (cartItems.every(i => i.material === cartItems[0].material) ? cartItems[0].material : "Varios")
              : (config.material || 'N/A'),
            printTime: cartItems.length > 0 ? "Varios" : (quoteData?.tiempoTexto || '---'),
            price: cartItems.length > 0
              ? cartItems.reduce((acc, item) => acc + item.price, 0)
              : (estimateForUI?.totalPrice || 0),
            weight: quoteData?.peso
          }}
        />
      </Suspense>



      <QuoteCart
        items={cartItems}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckoutCart}
        onQuote={handleRequestQuote}
        isProcessing={isCartProcessing}
      />

      <Suspense fallback={null}>
        <ItemAddedModal
          isOpen={isItemAddedModalOpen}
          onClose={() => setIsItemAddedModalOpen(false)}
          itemName={lastAddedItemName}
          onUploadAnother={handleResetForNewFile}
          onConfigureSame={handleConfigureSame}
          onGoToCart={() => setIsItemAddedModalOpen(false)}
        />
      </Suspense>
    </div >
  );
};

export default App;
