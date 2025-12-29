// server.js - VERSIÓN OPTIMIZADA CON CONCURRENCIA AUTOMÁTICA
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { fileURLToPath } from 'url';
import { rotateSTL } from './backend/utils/stlRotator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sistema de logging robusto para debugging
const LOG_FILE = path.join(__dirname, 'debug.log');
function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
    try {
        fs.appendFileSync(LOG_FILE, logLine);
    } catch (e) {
        // Ignorar errores de logging
    }
    console.log(logLine.trim());
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
// Servir archivos convertidos para el frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/**
 * Convierte un archivo de formato STEP (.step, .stp) a formato STL (.stl)
 * utilizando la interfaz de línea de comandos de PrusaSlicer.
 * 
 * Esta conversión es necesaria para la visualización en el frontend (Three.js),
 * mientras que el archivo original se conserva para el slicing preciso.
 * 
 * @param {string} stepPath - Ruta absoluta del archivo STEP de origen.
 * @param {string} stlPath - Ruta absoluta donde se guardará el archivo STL generado.
 * @returns {Promise<string>} Promesa que se resuelve con la ruta del STL creado.
 */
async function convertStepToStl(stepPath, stlPath) {
    return new Promise((resolve, reject) => {
        // PrusaSlicer CLI: --export-stl toma input y genera output
        const command = `${SLICER_COMMAND} --export-stl --output "${stlPath}" "${stepPath}"`;
        log('INFO', 'Convirtiendo STEP a STL...', { command });
        exec(command, (error, stdout, stderr) => {
            if (error) {
                log('ERROR', 'Fallo conversión STEP', { stderr });
                return reject(new Error('Error convirtiendo STEP a STL: ' + stderr));
            }
            if (!fs.existsSync(stlPath)) {
                return reject(new Error('La conversión falló silenciossamente: STL no generado'));
            }
            log('INFO', 'Conversión STEP -> STL exitosa');
            resolve(stlPath);
        });
    });
}

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB Límite
});

const SLICER_COMMAND = '"C:\\Program Files\\Prusa3D\\PrusaSlicer\\prusa-slicer-console.exe"';

// === AUTO-DETECCIÓN DE RECURSOS (CONSERVADOR PARA VPS COMPARTIDO) ===
const CPU_COUNT = os.cpus().length;
// Fórmula ultra-conservadora: Max 2 procesos, o 25% de CPUs disponibles
const MAX_CONCURRENT = Math.max(1, Math.min(Math.floor(CPU_COUNT / 4), 2));
console.log(`💻 CPUs detectados: ${CPU_COUNT}`);
console.log(`⚙️  Slicings concurrentes permitidos: ${MAX_CONCURRENT} (modo VPS compartido)`);

// === GESTIÓN DE COLA Y CACHÉ ===
const jobQueue = [];
let activeJobs = 0;
const cache = new Map();
const MAX_CACHE_SIZE = 100;
const PROCESS_TIMEOUT = 600000; // 10 minutos para archivos grandes

// === RATE LIMITING ===
const requestCounts = new Map();
const RATE_LIMIT = 15;
const RATE_WINDOW = 60000;

function checkRateLimit(ip) {
    const now = Date.now();
    const record = requestCounts.get(ip) || { count: 0, resetTime: now + RATE_WINDOW };

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + RATE_WINDOW;
    } else {
        record.count++;
    }

    requestCounts.set(ip, record);
    return record.count <= RATE_LIMIT;
}

// === LIMPIEZA AUTOMÁTICA ===
function cleanupOldFiles() {
    const uploadsDir = path.join(__dirname, 'uploads');
    const maxAge = 3600000;

    try {
        const files = fs.readdirSync(uploadsDir);
        const now = Date.now();
        let cleaned = 0;

        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
                cleaned++;
            }
        });

        if (cleaned > 0) console.log(`🗑️  Limpieza: ${cleaned} archivos eliminados`);
    } catch (err) {
        console.error('Error en limpieza:', err);
    }
}

setInterval(cleanupOldFiles, 600000);

function getFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

// Función para obtener dimensiones de un STL Binario (Bounding Box)
async function getStlBounds(filePath) {
    return new Promise((resolve) => {
        if (!fs.existsSync(filePath)) return resolve(null);

        let min = [Infinity, Infinity, Infinity];
        let max = [-Infinity, -Infinity, -Infinity];

        try {
            const stream = fs.createReadStream(filePath, { start: 84 }); // Saltar header (80) + tri count (4)
            let buffer = Buffer.alloc(0);

            stream.on('data', (chunk) => {
                buffer = Buffer.concat([buffer, chunk]);

                // Procesar triángulos completos de 50 bytes
                while (buffer.length >= 50) {
                    // Estructura STL Binario: Normal(12) | V1(12) | V2(12) | V3(12) | Attr(2)
                    for (let i = 0; i < 3; i++) { // 3 vértices por triángulo
                        const vOffset = 12 + (i * 12);
                        const x = buffer.readFloatLE(vOffset);
                        const y = buffer.readFloatLE(vOffset + 4);
                        const z = buffer.readFloatLE(vOffset + 8);

                        if (x < min[0]) min[0] = x; if (x > max[0]) max[0] = x;
                        if (y < min[1]) min[1] = y; if (y > max[1]) max[1] = y;
                        if (z < min[2]) min[2] = z; if (z > max[2]) max[2] = z;
                    }
                    buffer = buffer.subarray(50);
                }
            });

            stream.on('end', () => {
                if (min[0] === Infinity) resolve(null);
                else resolve({
                    x: max[0] - min[0],
                    y: max[1] - min[1],
                    z: max[2] - min[2]
                });
            });

            stream.on('error', (err) => {
                resolve(null);
            });

        } catch (e) {
            resolve(null);
        }
    });
}

// === PROCESADOR DE COLA CON CONCURRENCIA ===
async function processQueue() {
    // Procesar mientras haya espacio y trabajos pendientes
    while (activeJobs < MAX_CONCURRENT && jobQueue.length > 0) {
        activeJobs++;
        const job = jobQueue.shift();

        console.log(`🔄 Procesando (${activeJobs}/${MAX_CONCURRENT} activos, ${jobQueue.length} en cola)`);

        processSlicing(job)
            .then(result => job.resolve(result))
            .catch(error => job.reject(error))
            .finally(() => {
                activeJobs--;
                processQueue(); // Intentar procesar siguiente
            });
    }
}

// === FUNCIÓN DE SLICING ===
// === FUNCIÓN DE SLICING ===
async function processSlicing(job) {
    return new Promise(async (resolve, reject) => {
        let { inputPath, configPath, outputGcode, material, qualityId, infill, fileHash, rotationX, rotationY, rotationZ, scaleFactor } = job;

        // Verificar caché (incluir rotación y escala en clave)
        const cacheKey = `${fileHash}-${material}-${qualityId}-${infill}-${rotationX}-${rotationY}-${rotationZ}-${scaleFactor}`;
        if (cache.has(cacheKey)) {
            console.log('✅ Desde caché (instantáneo)');
            return resolve(cache.get(cacheKey));
        }

        // Convertir radianes a grados para PrusaSlicer
        const rotX = (rotationX || 0); // Radianes para nuestra utilidad
        const rotY = (rotationY || 0);
        // PrusaSlicer solo recibirá rotación Z vía CLI si lo deseamos, o podemos rotar todo nosotros.
        // ESTRATEGIA: Rotar X e Y nosotros en binario. Z se lo dejamos a PrusaSlicer (es más barato, solo gira en cama).
        const rotZDegrees = (rotationZ || 0) * (180 / Math.PI);
        const scale = (scaleFactor || 1.0) * 100; // PrusaSlicer usa porcentaje

        // Aplicar rotación: PrusaSlicer CLI soporta rotación en Z.
        // Rotación completa 3D vía CLI es limitada. Por ahora confiamos en Z.

        // Determinar altura de capa según calidad
        let layerHeight = 0.2;
        if (qualityId === 'draft') layerHeight = 0.28;
        if (qualityId === 'high') layerHeight = 0.16;

        // Construir comando PrusaSlicer
        const commandParams = [
            `--export-gcode`,
            `--center 160,160`,
            `--ensure-on-bed`,
            `--load "${configPath}"`,
            `--output "${outputGcode}"`,
            `--scale ${scale}%`,
            (Math.abs(rotZDegrees) > 0.1 ? `--rotate ${rotZDegrees.toFixed(2)}` : ''), // Rotación Z

            // Configuración Base
            `--layer-height ${layerHeight}`,
            `--perimeters 2`,
            `--top-solid-layers 3`,
            `--bottom-solid-layers 3`,
            `--fill-density ${infill}%`,
            `--fill-pattern ${Number(infill) >= 100 ? 'rectilinear' : 'cubic'}`,
            `--perimeter-speed 90`,
            `--infill-speed 200`,
            `--travel-speed 400`,
            `--first-layer-speed 50`,
            `--support-material`,
            `--support-material-threshold 30`,
            `--temperature 220`,
            `--bed-temperature 60`,
            `--filament-diameter 1.75`,
            `--nozzle-diameter 0.4`,
            `--retract-length 0.8`,
            `--gcode-comments`,

            // Input File (siempre al final por seguridad CLI)
            `"${inputPath}"`
        ];

        // Material overrides (Insertar antes del input file)
        const insertIdx = commandParams.length - 1;
        if (material === 'PETG') {
            commandParams.splice(insertIdx, 0, `--print-settings "nozzle_temperature=240"`, `--print-settings "bed_temperature=70"`);
        } else if (material === 'TPU') {
            commandParams.splice(insertIdx, 0, `--print-settings "nozzle_temperature=230"`, `--print-settings "max_print_speed=30"`);
        }

        const command = `${SLICER_COMMAND} ${commandParams.filter(Boolean).join(' ')}`;

        log('INFO', 'Comando PrusaSlicer', { command });
        const startTime = Date.now();

        // Opciones de proceso: Baja prioridad, buffer limitado
        const execOptions = {
            timeout: PROCESS_TIMEOUT,
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer max
            windowsHide: true,
            // En Linux: nice -n 19 (baja prioridad)
            // En Windows: el proceso ya es menos prioritario por defecto
        };

        const childProcess = exec(command, execOptions, async (error, stdout, stderr) => {
            const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

            // Log output de PrusaSlicer para debugging
            if (stdout) log('INFO', 'PrusaSlicer stdout', { stdout: stdout.substring(0, 500) });
            if (stderr) log('WARN', 'PrusaSlicer stderr', { stderr: stderr.substring(0, 500) });

            if (error) {
                log('ERROR', `Error ejecutando PrusaSlicer (${processingTime}s)`, {
                    message: error.message,
                    code: error.code
                });

                // Detectar errores específicos
                if (stderr && (stderr.includes('outside of the print volume') || stderr.includes('fits the print volume'))) {
                    log('WARN', 'Modelo fuera de volumen de impresión. Calculando bounds y retornando flag oversized.');

                    // Calcular dimensiones reales usando el STL auxiliar (si existe) o el input (si es STL)
                    const boundsPath = job.auxStlPath || job.inputPath;
                    let dimensions = null;
                    // Solo intentar leer si es STL (getStlBounds es para bin STL)
                    if (boundsPath && boundsPath.toLowerCase().endsWith('.stl')) {
                        dimensions = await getStlBounds(boundsPath);
                    }

                    return resolve({
                        oversized: true,
                        dimensions: dimensions, // Dimensiones calculadas por backend
                        volumen: 0,
                        peso: 0,
                        tiempoTexto: '—',
                        tiempoHoras: 0,
                        pesoSoportes: 0,
                        porcentajeSoportes: 0
                    });
                }

                return reject(new Error('Slicing failed: ' + error.message));
            }

            console.log(`✅ Slicing OK (${processingTime}s)`);

            let gcodeContent = "";
            try {
                if (!fs.existsSync(outputGcode)) {
                    // Si no existe el archivo, verificar si fue por fuera de volumen
                    if (stderr && (stderr.includes('outside of the print volume') || stderr.includes('fits the print volume'))) {
                        return reject(new Error('El modelo es demasiado grande para el volumen de impresión (325x320x325mm). Intenta reducir la escala.'));
                    }

                    log('ERROR', 'Archivo GCode no existe', { outputGcode });
                    return reject(new Error(`Archivo GCode no encontrado: ${outputGcode}`));
                }
                const stats = fs.statSync(outputGcode);
                log('INFO', `Leyendo GCode (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
                gcodeContent = fs.readFileSync(outputGcode, 'utf8');
                log('INFO', `GCode leído exitosamente (${gcodeContent.length} caracteres)`);
            } catch (err) {
                log('ERROR', 'Error leyendo GCode', { error: err.message, outputGcode });
                return reject(new Error(`Error leyendo GCode: ${err.message}`));
            }

            // === PARSEO DE DATOS ===

            // Usar la lógica que funcionaba en commit 82647ce

            // 1. VOLUMEN (cm3) - Múltiples patrones
            // ---------------------------------------------------------
            // ANÁLISIS AVANZADO G-CODE (FEATURES + K-FACTOR)
            // ---------------------------------------------------------

            // 1. Definición de Constantes de Material
            const MATERIAL_K_FACTORS = {
                'PLA': 2.98,
                'PLA-Silk': 2.98,
                'PETG': 2.98,
                'ABS': 2.50,
                'TPU': 2.98
            };
            const kFactor = MATERIAL_K_FACTORS[material] || 2.98;

            // 2. Desglose de Features (Modelo vs Soportes vs Desperdicio)
            let features = {
                'support': 0, // Soportes + Interfaz
                'model': 0,   // Perímetros, relleno, etc.
                'waste': 0    // Skirt, Brim, Wipe Tower
            };

            const regexFeature = /; (?:feature )?([a-zA-Z\s]+).*?=\s*(\d+(\.\d+)?)\s*mm/gi;
            let featureMatch;
            let totalFilamentMm = 0;

            while ((featureMatch = regexFeature.exec(gcodeContent)) !== null) {
                const name = featureMatch[1].trim().toLowerCase();
                const valMm = parseFloat(featureMatch[2]);

                if (!isNaN(valMm)) {
                    totalFilamentMm += valMm;

                    if (name.includes('support')) {
                        features.support += valMm;
                    } else if (name.includes('skirt') || name.includes('brim') || name.includes('wipe')) {
                        features.waste += valMm;
                    } else {
                        features.model += valMm;
                    }
                }
            }

            // Conversión a Gramos Real
            const mmToGrams = (mm) => (mm / 1000) * kFactor;

            const pesoSoportes = mmToGrams(features.support);
            const pesoDesperdicioExtra = mmToGrams(features.waste);
            const pesoModeloReal = mmToGrams(features.model);
            let pesoTotalCalculado = pesoSoportes + pesoDesperdicioExtra + pesoModeloReal;

            console.log(`📊 Desglose Real: Modelo: ${pesoModeloReal.toFixed(2)}g | Soportes: ${pesoSoportes.toFixed(2)}g | Waste: ${pesoDesperdicioExtra.toFixed(2)}g | Total: ${pesoTotalCalculado.toFixed(2)}g`);

            // Fallback Genérico si no halló features
            if (pesoTotalCalculado === 0) {
                const matchTotalMm = gcodeContent.match(/; filament used \[mm\] = (\d+(\.\d+)?)/);
                if (matchTotalMm) {
                    totalFilamentMm = parseFloat(matchTotalMm[1]);
                    pesoTotalCalculado = mmToGrams(totalFilamentMm);
                    console.log(`⚠️ Usando peso total genérico: ${pesoTotalCalculado.toFixed(2)}g`);
                }
            }

            // Asignar variables finales
            let peso = pesoTotalCalculado;
            // Volumen referencial
            let volumen = 0;
            const matchVol = gcodeContent.match(/; filament used \[cm3\] = (\d+(\.\d+)?)/);
            if (matchVol) volumen = parseFloat(matchVol[1]);


            // 3. Tiempo de Impresión (Clean Regex)
            const timePattern = /; estimated printing time(?: \(normal mode\))? = (.*)/i;
            const timeMatch = gcodeContent.match(timePattern);

            let timeStr = "0m";
            if (timeMatch) {
                timeStr = timeMatch[1].trim();
                timeStr = timeStr.split(';')[0].trim(); // Limpiar comentarios extra
            }

            // Parsing de tiempo a horas...
            let hours = 0;
            const d = timeStr.match(/(\d+)d/);
            const h = timeStr.match(/(\d+)h/);
            const m = timeStr.match(/(\d+)m/);
            const s = timeStr.match(/(\d+)s/);

            if (d) hours += parseInt(d[1]) * 24;
            if (h) hours += parseInt(h[1]);
            if (m) hours += parseInt(m[1]) / 60;
            if (s) hours += parseInt(s[1]) / 3600;

            // Corrección de tiempo (AJUSTADO)
            const STARTUP_MINUTES = 6; // Calentamiento + calibración + purga
            const SAFETY_MARGIN = 1.05;
            const slicerHours = hours;
            hours = (hours * SAFETY_MARGIN) + (STARTUP_MINUTES / 60);

            console.log(`   Tiempo Slicer: ${timeStr} (${slicerHours.toFixed(2)}h) → Final: ${hours.toFixed(2)}h (+${STARTUP_MINUTES}min)`);

            const totalMinutes = Math.round(hours * 60);
            const finalH = Math.floor(totalMinutes / 60);
            const finalM = totalMinutes % 60;
            const tiempoAjustadoStr = `${finalH}h ${finalM}m`;

            // 5. DIMENSIONES (Bonus)
            let dimensions = null;
            const boundingMatch = gcodeContent.match(/; bounding box: X: \[[\d.]+,([\d.]+)\], Y: \[[\d.]+,([\d.]+)\], Z: \[[\d.]+,([\d.]+)\]/);
            if (boundingMatch) {
                dimensions = {
                    x: parseFloat(boundingMatch[1]),
                    y: parseFloat(boundingMatch[2]),
                    z: parseFloat(boundingMatch[3])
                };
                console.log(`   ✓ Dimensiones: ${dimensions.x} x ${dimensions.y} x ${dimensions.z} mm`);
            }

            // 6. CALCULAR PORCENTAJE DE SOPORTES para factor de dificultad
            const porcentajeSoportes = peso > 0 ? (pesoSoportes / peso) * 100 : 0;
            if (porcentajeSoportes > 0) {
                log('INFO', `Porcentaje de soportes: ${porcentajeSoportes.toFixed(1)}%`);
            }

            const result = {
                volumen,
                peso,
                tiempoTexto: tiempoAjustadoStr,
                tiempoHoras: hours,
                pesoSoportes,
                porcentajeSoportes,
                gcodeUrl: `/uploads/${path.basename(outputGcode)}`,
                dimensions: null
            };

            // Guardar en caché
            if (cache.size >= MAX_CACHE_SIZE) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }
            cache.set(cacheKey, result);

            // Limpieza (temporalmente deshabilitada para inspección)
            try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                // NO borrar el GCode para poder inspeccionarlo
                // if (fs.existsSync(outputGcode)) fs.unlinkSync(outputGcode);
                console.log(`   📁 GCode preservado en: ${outputGcode}`);
            } catch (e) { }

            // VERIFICACIÓN PARANOICA DE G-CODE
            if (fs.existsSync(outputGcode)) {
                const gcodeStats = fs.statSync(outputGcode);
                log('SUCCESS', 'G-Code generado y verificado en disco', { path: outputGcode, size: gcodeStats.size });
            } else {
                log('CRITICAL', 'El Slicer reportó éxito pero el archivo G-Code NO existe en disco', { path: outputGcode });
                // Intento desesperado: buscar si se generó con otro nombre
                const possibleAlt = inputPath + '.gcode';
                if (fs.existsSync(possibleAlt)) {
                    log('WARN', 'Encontrado G-Code con nombre alternativo, corrigiendo...', { alt: possibleAlt });
                    fs.renameSync(possibleAlt, outputGcode);
                }
            }

            resolve(result);
        });

        // Timeout manual
        setTimeout(() => {
            try {
                childProcess.kill('SIGTERM');
                reject(new Error('Timeout: Slicing tardó más de 2 minutos'));
            } catch (e) { }
        }, PROCESS_TIMEOUT + 5000);
    });
}

// === ENDPOINT PRINCIPAL ===
app.post('/api/quote', upload.single('file'), async (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;

    if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: 'Demasiadas solicitudes. Espera un momento.' });
    }

    if (!req.file) {
        log('ERROR', 'No se recibió archivo en la petición');
        return res.status(400).json({ error: 'Falta archivo' });
    }

    log('INFO', `Archivo recibido: ${req.file.originalname} (${req.file.size} bytes)`);

    const originalPath = path.resolve(req.file.path);
    const ext = path.extname(req.file.originalname).toLowerCase();

    log('DEBUG', `Procesando upload: ${req.file.originalname}`, { detectedExt: ext, size: req.file.size });

    let slicingInputPath;
    let convertedUrl = null;
    let auxStlPath = null;

    try {
        if (ext === '.step' || ext === '.stp') {
            log('INFO', `🔌 Detectado archivo STEP: ${req.file.originalname} -> Iniciando flujos paralelos (Precision + Visor)...`);
            const stepPath = path.resolve(req.file.path + ext);

            // Renombrar archivo temporal de multer a .step
            fs.renameSync(originalPath, stepPath);

            // 1. Para Slicing: Usamos el STEP original (Máxima precisión geométrica)
            slicingInputPath = stepPath;

            // 2. Para Visor: Convertimos a STL (Necesario para Three.js)
            const stlPath = path.resolve(req.file.path + '.stl');
            await convertStepToStl(stepPath, stlPath);

            // Guardamos referencia para usar en cálculo de bounds si falla slicing
            auxStlPath = stlPath;

            // URL para que el frontend descargue el STL convertido
            convertedUrl = `/uploads/${path.basename(stlPath)}`;
        } else {
            log('INFO', `📂 Archivo STL detectado (o desconocido asumiendo STL): ${ext}`);
            // Flujo normal STL
            const stlPath = path.resolve(req.file.path + '.stl');
            fs.renameSync(originalPath, stlPath);
            slicingInputPath = stlPath;
            // Para STL, el input es el mismo path
            auxStlPath = stlPath;
        }
        log('INFO', `Archivo listo para slicing: ${slicingInputPath}`);
    } catch (e) {
        log('ERROR', `Error al procesar/convertir archivo: ${e.message}`, { stack: e.stack });
        return res.status(500).json({ error: 'Error procesando archivo: ' + e.message });
    }

    const configPath = path.resolve(__dirname, 'backend', 'profiles', 'bambu_realistic.ini');
    const outputGcode = slicingInputPath + '.gcode';

    if (!fs.existsSync(configPath)) {
        return res.status(500).json({ error: 'Perfil no encontrado' });
    }

    const material = req.body.material || 'PLA';
    const infillPercent = req.body.infill || 15;
    const qualityId = req.body.quality || 'standard';

    // Parámetros de orientación y escala
    const rotationX = parseFloat(req.body.rotationX || 0);
    const rotationY = parseFloat(req.body.rotationY || 0);
    const rotationZ = parseFloat(req.body.rotationZ || 0);
    const scaleFactor = parseFloat(req.body.scaleFactor || 1.0);

    const fileHash = getFileHash(slicingInputPath);

    // Añadir a cola
    const jobPromise = new Promise((resolve, reject) => {
        jobQueue.push({
            inputPath: slicingInputPath,
            auxStlPath: auxStlPath, // Pasamos el path auxiliar para bounds
            configPath,
            outputGcode,
            material,
            qualityId,
            infill: infillPercent,
            rotationX,
            rotationY,
            rotationZ,
            scaleFactor,
            fileHash,
            resolve,
            reject
        });
    });

    processQueue();

    try {
        const result = await jobPromise;

        // Si hubo conversión, añadir la URL al resultado
        if (convertedUrl) {
            result.convertedStlUrl = convertedUrl;
        }

        log('INFO', 'Slicing completado exitosamente');
        res.json(result);
    } catch (error) {
        log('ERROR', 'Error en slicing', { message: error.message, stack: error.stack });
        res.status(500).json({ error: error.message });
    }
});

// === HEALTH CHECK ===
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        cpus: CPU_COUNT,
        maxConcurrent: MAX_CONCURRENT,
        activeJobs,
        queueSize: jobQueue.length,
        cacheSize: cache.size,
        cacheHitRate: cache.size > 0 ? '~estimado' : 'sin datos'
    });
});

app.listen(3001, '0.0.0.0', () => {
    console.log('✅ Backend Cotizador corriendo en puerto 3001');
    console.log('✨ Soporte STEP/STP: HABILITADO');
    console.log(`📊 Configuración: ${MAX_CONCURRENT} procesos concurrentes | Caché: ${MAX_CACHE_SIZE} items`);
    console.log('🌐 Accesible desde red local en: http://<TU-IP>:3001');
});
