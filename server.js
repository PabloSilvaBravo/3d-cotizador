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
app.use(express.json({ limit: '10mb' }));

const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 50 * 1024 * 1024 }
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
const PROCESS_TIMEOUT = 120000; // 2 minutos

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

        // Aplicar rotación física (What You See Is What You Get)
        // Aplicamos TODAS las rotaciones (X, Y, Z) directamente a los vértices del STL.
        if (Math.abs(rotX) > 0.001 || Math.abs(rotY) > 0.001 || Math.abs(rotZDegrees) > 0.001) {
            const rotatedPath = inputPath.replace('.stl', `_rotated_${Date.now()}.stl`);
            try {
                // Convertir Z de grados a radianes para rotateSTL
                const rotZRad = rotZDegrees * (Math.PI / 180);

                log('INFO', `Rotando STL físicamente (X:${rotX.toFixed(2)}, Y:${rotY.toFixed(2)}, Z:${rotZRad.toFixed(2)})...`);

                await rotateSTL(inputPath, rotatedPath, rotX, rotY, rotZRad);
                inputPath = rotatedPath; // Usar el archivo rotado
                log('INFO', `STL rotado guardado en: ${rotatedPath}`);
            } catch (err) {
                log('ERROR', 'Fallo al rotar STL', err);
                return reject(new Error('Fallo al rotar geometría STL: ' + err.message));
            }
        }

        // Determinar altura de capa según calidad
        let layerHeight = 0.2;
        if (qualityId === 'draft') layerHeight = 0.28;
        if (qualityId === 'high') layerHeight = 0.16;

        // SOLUCIÓN: Usar solo parámetros CLI soportados
        // Al haber rotado físicamente el STL, no necesitamos rotar en el slicer.
        const command = `${SLICER_COMMAND} --export-gcode ` +
            `--center 160,160 ` +
            // `--dont-arrange ` + 
            `--ensure-on-bed ` +
            // (rotZDegrees !== 0 ? `--rotate ${rotZDegrees} ` : '') +  // ROTACIÓN DESHABILITADA (Ya aplicada físicamente)
            (scale !== 100 ? `--scale ${scale}% ` : '') +
            `--layer-height ${layerHeight} ` +
            `--perimeters 2 ` +
            `--top-solid-layers 3 ` +
            `--bottom-solid-layers 3 ` +
            `--fill-density ${infill}% ` +
            `--fill-pattern ${Number(infill) >= 100 ? 'rectilinear' : 'cubic'} ` +
            `--perimeter-speed 90 ` +
            `--infill-speed 200 ` +
            `--travel-speed 400 ` +
            `--first-layer-speed 50 ` +
            `--support-material ` +
            `--support-material-threshold 30 ` +
            `--temperature 220 ` +
            `--bed-temperature 60 ` +
            `--filament-diameter 1.75 ` +
            `--nozzle-diameter 0.4 ` +
            `--retract-length 0.8 ` +
            `--gcode-comments ` + // Necesario para detectar soportes con Regex
            `--output "${outputGcode}" "${inputPath}"`;

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

        const childProcess = exec(command, execOptions, (error, stdout, stderr) => {
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
                    return reject(new Error('El modelo es demasiado grande para el volumen de impresión (256x256x256mm). Intenta reducir la escala.'));
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
                    console.log(`   ✓ Volumen encontrado: ${volumen} cm³ con patrón ${pattern}`);
                    break;
                }
            }
            if (volumen === 0) console.log(`   ✗ Volumen NO encontrado`);

            // 2. PESO (g) - Múltiples patrones
            let peso = 0;
            const weightPatterns = [
                /; filament used \[g\] = (\d+(\.\d+)?)/,
                /; filament weight = (\d+(\.\d+)?)g/i,
                /(\d+(\.\d+)?)g/
            ];
            for (const pattern of weightPatterns) {
                const match = gcodeContent.match(pattern);
                if (match) {
                    peso = parseFloat(match[1]);
                    console.log(`   ✓ Peso encontrado: ${peso} g con patrón ${pattern}`);
                    break;
                }
            }
            if (peso === 0 && volumen > 0) {
                peso = volumen * 1.24; // Fallback desde volumen
                console.log(`   ⚠ Peso calculado desde volumen: ${peso.toFixed(2)} g`);
            } else if (peso === 0) {
                console.log(`   ✗ Peso NO encontrado`);
            }

            const timePatterns = [
                /; estimated printing time \(normal mode\) = (.*)/,
                /; estimated printing time = (.*)/,
                /; printing time = (.*)/
            ];

            let timeStr = "0m";
            for (const pattern of timePatterns) {
                const match = gcodeContent.match(pattern);
                if (match) {
                    timeStr = match[1].trim();
                    console.log(`   Tiempo encontrado con patrón: ${pattern}`);
                    break;
                }
            }

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

            // 4. SOPORTES (Para Dificultad)

            let pesoSoportes = 0;
            const supportPatterns = [
                // Volumen cm3 (Inglés)
                { regex: /; support material volume: (\d+(\.\d+)?)/i, type: 'vol' },
                { regex: /; support material: (\d+(\.\d+)?) cm3/i, type: 'vol' },
                { regex: /; filament used \[cm3\] \(support\) = (\d+(\.\d+)?)/i, type: 'vol' },
                // Metros (Español/Inglés) - Factor conversión 1.75mm ~ 2.405g/m
                { regex: /; support material:.* (\d+(\.\d+)?) m/i, type: 'len' },
                { regex: /; Material de soporte:.* (\d+(\.\d+)?) m/i, type: 'len' }
            ];

            for (const item of supportPatterns) {
                const match = gcodeContent.match(item.regex);
                if (match) {
                    let val = parseFloat(match[1]);
                    if (item.type === 'len') {
                        // Convertir metros a gramos (aprox PLA 1.75mm)
                        // 1m = 1000mm. Vol = pi * r^2 * h = 3.1416 * 0.875^2 * 1000 = 2405 mm3 = 2.405 cm3
                        // Peso = 2.405 * 1.24 = 2.98 g/m
                        val = val * 2.98;
                    } else {
                        // Es volumen cm3 -> a gramos
                        val = val * 1.24;
                    }

                    if (val > 0) {
                        pesoSoportes = val;
                        console.log(`   ✓ Soportes detectados: ${pesoSoportes.toFixed(2)} g`);
                        break;
                    }
                }
            }

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
                porcentajeSoportes, // Añadir para cálculo de dificultad
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
    const inputPath = path.resolve(req.file.path + '.stl');

    try {
        fs.renameSync(originalPath, inputPath);
        log('INFO', `Archivo renombrado: ${inputPath}`);
    } catch (e) {
        log('ERROR', `Error al renombrar archivo: ${e.message}`, { stack: e.stack });
        return res.status(500).json({ error: 'Error procesando archivo' });
    }

    const configPath = path.resolve(__dirname, 'backend', 'profiles', 'bambu_realistic.ini');
    const outputGcode = inputPath + '.gcode';

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

    const fileHash = getFileHash(inputPath);

    // Añadir a cola
    const jobPromise = new Promise((resolve, reject) => {
        jobQueue.push({
            inputPath,
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
    console.log(`📊 Configuración: ${MAX_CONCURRENT} procesos concurrentes | Caché: ${MAX_CACHE_SIZE} items`);
    console.log('🌐 Accesible desde red local en: http://<TU-IP>:3001');
});
