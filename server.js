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
import { rotateSTL, autoOrientSTL } from './backend/utils/stlRotator.js';

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

// === FUNCIÓN DE SLICING (LÓGICA CLÁSICA RESTAURADA) ===
async function processSlicing(job) {
    return new Promise(async (resolve, reject) => {
        let { inputPath, configPath, outputGcode, material, qualityId, infill, fileHash, rotationX, rotationY, rotationZ, scaleFactor } = job;

        // Verificar caché (incluir rotación y escala en clave)
        const cacheKey = `${fileHash}-${material}-${qualityId}-${infill}-${rotationX}-${rotationY}-${rotationZ}-${scaleFactor}`;
        if (cache.has(cacheKey)) return resolve(cache.get(cacheKey));

        // 1. GESTIÓN DE ROTACIÓN
        // PrusaSlicer CLI maneja bien Z, pero X/Y requieren pre-procesamiento o comandos complejos.
        // Usamos nuestra utilidad stlRotator para rotaciones complejas.
        let finalInputPath = inputPath;
        let tempFiles = [];
        let cliRotationZ = 0;

        if (Math.abs(rotationX) > 0.001 || Math.abs(rotationY) > 0.001) {
            try {
                const rotatedPath = inputPath + `.rot_${Date.now()}.stl`;
                log('INFO', 'Aplicando rotación 3D (X/Y detectados)', { x: rotationX, y: rotationY, z: rotationZ });

                await rotateSTL(inputPath, rotatedPath, rotationX, rotationY, rotationZ);

                finalInputPath = rotatedPath;
                tempFiles.push(rotatedPath);
                cliRotationZ = 0; // Rotación aplicada geométricamente
            } catch (err) {
                log('ERROR', 'Fallo al rotar STL', err);
                return reject(new Error('Error rotando STL: ' + err.message));
            }
        } else {
            // Solo Z -> Dejamos que PrusaSlicer lo haga (es más rápido)
            cliRotationZ = (rotationZ || 0) * (180 / Math.PI);
        }

        const scale = (scaleFactor || 1.0) * 100; // PrusaSlicer usa porcentaje

        // Determinar altura de capa según calidad
        let layerHeight = 0.2;
        if (qualityId === 'draft') layerHeight = 0.28;
        if (qualityId === 'high') layerHeight = 0.16;

        // Configuración de Material
        let nozzleTemp = 220;
        let bedTemp = 60;
        let extraParams = [];

        if (material === 'PETG') {
            nozzleTemp = 240;
            bedTemp = 70;
        } else if (material === 'TPU') {
            nozzleTemp = 230;
            // TPU: Reducir velocidad máxima
            extraParams.push('--max-print-speed', '30');
        }

        // Construir comando PrusaSlicer
        const commandParams = [
            `--export-gcode`,
            `--center 160,160`,
            `--ensure-on-bed`,
            `--load "${configPath}"`,
            `--output "${outputGcode}"`,
            `--scale ${scale}%`,
            (Math.abs(cliRotationZ) > 0.1 ? `--rotate ${cliRotationZ.toFixed(2)}` : ''),

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
            `--support-material-threshold 0`, // 0 = Automático (Recomendado)
            `--temperature ${nozzleTemp}`,
            `--bed-temperature ${bedTemp}`,
            `--filament-diameter 1.75`,
            `--nozzle-diameter 0.4`,
            `--retract-length 0.8`,
            `--gcode-comments`,  // Flag booleano estándar

            ...extraParams,

            // Input File (siempre al final por seguridad CLI)
            `"${finalInputPath}"`
        ];

        const command = `${SLICER_COMMAND} ${commandParams.filter(Boolean).join(' ')}`;

        // Asignar childProcess para timeout
        const childProcess = exec(command, { timeout: PROCESS_TIMEOUT, windowsHide: true }, async (error, stdout, stderr) => {
            // Helper para limpieza
            const cleanup = () => {
                try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch (e) { }
                tempFiles.forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) { } });
            };

            if (error) {
                cleanup();
                if (stderr && (stderr.includes('outside') || stderr.includes('fits'))) {
                    return resolve({ oversized: true, volumen: 0, peso: 0, tiempoTexto: '—', porcentajeSoportes: 0 });
                }
                return reject(new Error('Slicing failed: ' + error.message));
            }

            let gcodeContent = "";
            try {
                if (!fs.existsSync(outputGcode)) {
                    cleanup();
                    return reject(new Error(`GCode no generado`));
                }
                gcodeContent = fs.readFileSync(outputGcode, 'utf8');
            } catch (err) {
                cleanup();
                return reject(new Error(`Error leyendo GCode: ${err.message}`));
            }

            // =========================================================
            //  ESTRATEGIA CLÁSICA RESTAURADA (VOLUMEN/PESO)
            // =========================================================

            let volumen = 0;
            const volPatterns = [
                /; filament used \[cm3\] = (\d+(\.\d+)?)/,
                /; filament volume: (\d+(\.\d+)?) cm3/i,
                /(\d+(\.\d+)?) cm3/
            ];
            for (const pattern of volPatterns) {
                const match = gcodeContent.match(pattern);
                if (match) {
                    volumen = parseFloat(match[1]);
                    console.log(`   ✓ Volumen encontrado: ${volumen} cm³`);
                    break;
                }
            }

            let pesoTotal = 0;
            const weightPatterns = [
                /; filament used \[g\] = (\d+(\.\d+)?)/,
                /; filament weight = (\d+(\.\d+)?)g/i,
                /(\d+(\.\d+)?)g/
            ];
            for (const pattern of weightPatterns) {
                const match = gcodeContent.match(pattern);
                if (match) {
                    pesoTotal = parseFloat(match[1]);
                    console.log(`   ✓ Peso encontrado: ${pesoTotal} g`);
                    break;
                }
            }

            if (pesoTotal === 0 && volumen > 0) {
                // Fallback clásico: Densidad PLA genérica (1.24) siempre
                const density = 1.24;
                pesoTotal = volumen * density;
                console.log(`   ⚠ Peso calculado desde volumen: ${pesoTotal.toFixed(2)} g (Densidad ${density})`);
            }

            // =========================================================
            //  DETECCIÓN DE SOPORTES (VERSIÓN ROBUSTA/REGEX)
            // =========================================================
            // Usamos Regex para tolerar espacios extra como ";TYPE: Support" 
            // y asegurarnos de no leer la configuración del final.

            // Busca líneas que empiecen con ";TYPE:" seguido opcionalmente de espacios
            // y luego la palabra "Support" (sin importar mayúsculas/minúsculas).
            const tieneSoportes = /;TYPE:\s*Support/i.test(gcodeContent);

            console.log(`   🔍 Detección de soportes: ${tieneSoportes ? '✅ SÍ requiere soportes' : '❌ NO requiere soportes'}`);

            // --- CÁLCULO DE TIEMPO Y DIMENSIONES ---
            const timePattern = /; estimated printing time(?: \(normal mode\))? = (.*)/i;
            const timeMatch = gcodeContent.match(timePattern);
            let hours = 0;
            let tiempoTexto = "0m";

            if (timeMatch) {
                let tStr = timeMatch[1].split(';')[0].trim();
                const d = tStr.match(/(\d+)d/);
                const h = tStr.match(/(\d+)h/);
                const m = tStr.match(/(\d+)m/);
                const s = tStr.match(/(\d+)s/);
                if (d) hours += parseInt(d[1]) * 24;
                if (h) hours += parseInt(h[1]);
                if (m) hours += parseInt(m[1]) / 60;
                if (s) hours += parseInt(s[1]) / 3600;

                // Ajuste de seguridad: Eliminado.
                // Factor de Corrección para Alta Velocidad (Bambu Lab / Klipper): x0.75
                // Si el perfil base es Prusa standar (6h), esto lo baja a ~4.5h
                hours = hours * 0.80;

                const tm = Math.round(hours * 60);
                tiempoTexto = `${Math.floor(tm / 60)}h ${tm % 60}m`;
            }

            // CORRECCIÓN DIMENSIONES:
            // PrusaSlicer no pone el bounding box en el GCode.
            // Intentamos recuperar la altura Z máxima real del GCode si existe,
            // si no, confiamos en lo que diga el frontend o el análisis previo del STL.

            let dimensions = null;

            // Intentar leer altura máxima de impresión (común en PrusaSlicer moderno)
            const maxZMatch = gcodeContent.match(/; max_layer_z = ([\d\.]+)/);
            let realZ = maxZMatch ? parseFloat(maxZMatch[1]) : 0;

            // Si tenías bounds calculados previamente (debes pasarlos en el objeto job)
            if (job.preCalculatedBounds) {
                dimensions = {
                    ...job.preCalculatedBounds,
                    // Si encontramos Z real en gcode, la usamos (es más precisa porque incluye soportes/balsas)
                    z: realZ > job.preCalculatedBounds.z ? realZ : job.preCalculatedBounds.z
                };
            } else {
                // Fallback si no hay datos previos: solo podemos garantizar la altura Z
                dimensions = { x: 0, y: 0, z: realZ };
            }

            // RESULTADO FINAL
            const result = {
                volumen,
                peso: parseFloat(pesoTotal.toFixed(2)),
                tiempoTexto,
                tiempoHoras: hours,
                tieneSoportes,
                gcodeUrl: `/uploads/${path.basename(outputGcode)}`,
                dimensions
            };

            if (cache.size >= MAX_CACHE_SIZE) cache.delete(cache.keys().next().value);
            cache.set(cacheKey, result);

            cleanup();

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


    // Calcular dimensiones (Bounding Box) PREVIO al slicing para mayor precisión
    let detectedBounds = null;
    try {
        detectedBounds = await calcStlBounds(slicingInputPath);
        log('INFO', 'Dimensiones STL calculadas:', detectedBounds);
    } catch (err) {
        log('WARN', 'No se pudieron calcular dimensiones previas:', err.message);
    }

    // Añadir a cola
    const jobPromise = new Promise((resolve, reject) => {
        jobQueue.push({
            preCalculatedBounds: detectedBounds, // <--- Nueva propiedad
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

/**
 * Función local para calcular dimensiones STL (Bounding Box) directamente del binario
 */
async function calcStlBounds(inputPath) {
    return new Promise((resolve, reject) => {
        try {
            const buffer = fs.readFileSync(inputPath);

            if (buffer.length < 84) {
                return reject(new Error('Archivo STL demasiado pequeño o inválido'));
            }

            const triangleCount = buffer.readUInt32LE(80);

            let minX = Infinity, minY = Infinity, minZ = Infinity;
            let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

            let offset = 84;
            for (let i = 0; i < triangleCount; i++) {
                // V1
                const v1x = buffer.readFloatLE(offset + 12);
                const v1y = buffer.readFloatLE(offset + 16);
                const v1z = buffer.readFloatLE(offset + 20);

                // V2
                const v2x = buffer.readFloatLE(offset + 24);
                const v2y = buffer.readFloatLE(offset + 28);
                const v2z = buffer.readFloatLE(offset + 32);

                // V3
                const v3x = buffer.readFloatLE(offset + 36);
                const v3y = buffer.readFloatLE(offset + 40);
                const v3z = buffer.readFloatLE(offset + 44);

                minX = Math.min(minX, v1x, v2x, v3x);
                minY = Math.min(minY, v1y, v2y, v3y);
                minZ = Math.min(minZ, v1z, v2z, v3z);

                maxX = Math.max(maxX, v1x, v2x, v3x);
                maxY = Math.max(maxY, v1y, v2y, v3y);
                maxZ = Math.max(maxZ, v1z, v2z, v3z);

                offset += 50;
            }

            const width = maxX - minX;
            const depth = maxY - minY;
            const height = maxZ - minZ;

            resolve({
                x: parseFloat(width.toFixed(2)),
                y: parseFloat(depth.toFixed(2)),
                z: parseFloat(height.toFixed(2)),
                min: { x: minX, y: minY, z: minZ },
                max: { x: maxX, y: maxY, z: maxZ }
            });

        } catch (error) {
            reject(error);
        }
    });
}

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
