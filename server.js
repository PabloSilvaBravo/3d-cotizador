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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
function processSlicing(job) {
    return new Promise((resolve, reject) => {
        const { inputPath, configPath, outputGcode, material, qualityId, infill, fileHash } = job;

        // Verificar caché
        const cacheKey = `${fileHash}-${material}-${qualityId}-${infill}`;
        if (cache.has(cacheKey)) {
            console.log('✅ Desde caché (instantáneo)');
            return resolve(cache.get(cacheKey));
        }

        const command = `${SLICER_COMMAND} --export-gcode --load "${configPath}" --fill-density ${infill}% --layer-height 0.2 --perimeter-speed 90 --infill-speed 200 --travel-speed 400 --output "${outputGcode}" "${inputPath}"`;

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

            if (error) {
                console.error(`❌ Error slicing (${processingTime}s):`, error.message);
                return reject(new Error('Slicing failed'));
            }

            console.log(`✅ Slicing OK (${processingTime}s)`);

            let gcodeContent = "";
            try {
                gcodeContent = fs.readFileSync(outputGcode, 'utf8');
            } catch (err) {
                return reject(new Error('Error leyendo GCode'));
            }

            // === PARSEO DE DATOS ===

            // Las estadísticas pueden estar al principio O al final dependiendo de la versión de PrusaSlicer
            // Busquemos en TODO el archivo

            console.log(`\n   📄 GCode size: ${(gcodeContent.length / 1024).toFixed(1)} KB`);

            // Buscar volumen
            const volMatch = gcodeContent.match(/; filament used \[cm3\] = (\d+(\.\d+)?)/);
            const volumen = volMatch ? parseFloat(volMatch[1]) : 0;
            console.log(`   Volumen: ${volumen} cm³ ${volMatch ? '✓' : '✗'}`);

            // Buscar peso
            const weightMatch = gcodeContent.match(/; filament used \[g\] = (\d+(\.\d+)?)/);
            let peso = weightMatch ? parseFloat(weightMatch[1]) : 0;
            if (peso === 0 && volumen > 0) peso = volumen * 1.24;
            console.log(`   Peso: ${peso.toFixed(2)} g ${weightMatch ? '✓' : '✗ (calculado)'}`);

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

            let pesoSoportes = 0;
            const supportVolMatch = gcodeContent.match(/; support material volume: (\d+(\.\d+)?)/i);
            if (supportVolMatch) {
                pesoSoportes = parseFloat(supportVolMatch[1]) * 1.24;
            }

            const result = {
                volumen,
                peso,
                tiempoTexto: tiempoAjustadoStr,
                tiempoHoras: hours,
                pesoSoportes,
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

    if (!req.file) return res.status(400).json({ error: 'Falta archivo' });

    const originalPath = req.file.path;
    const inputPath = req.file.path + '.stl';

    try {
        fs.renameSync(originalPath, inputPath);
    } catch (e) {
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
            fileHash,
            resolve,
            reject
        });
    });

    processQueue();

    try {
        const result = await jobPromise;
        res.json(result);
    } catch (error) {
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

app.listen(3001, () => {
    console.log('✅ Backend Cotizador corriendo en puerto 3001');
    console.log(`📊 Configuración: ${MAX_CONCURRENT} procesos concurrentes | Caché: ${MAX_CACHE_SIZE} items`);
});
