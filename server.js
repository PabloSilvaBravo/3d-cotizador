// server.js - VERSIÓN MEJORADA CON EXTRACCIÓN ROBUSTA
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
const upload = multer({ dest: 'uploads/' });

const SLICER_COMMAND = '"C:\\Program Files\\Prusa3D\\PrusaSlicer\\prusa-slicer-console.exe"';

app.post('/api/quote', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Falta archivo' });

    const originalPath = req.file.path;
    const inputPath = req.file.path + '.stl';
    try { fs.renameSync(originalPath, inputPath); } catch (e) { }

    const configPath = path.resolve(__dirname, 'backend', 'profiles', 'h2d.ini');
    const outputGcode = inputPath + '.gcode';

    if (!fs.existsSync(configPath)) return res.status(500).json({ error: 'Perfil no encontrado' });

    // Parámetros de impresión
    const material = req.body.material || 'PLA';
    const infillPercent = req.body.infill || 15;

    let layerHeight = 0.2;
    const qualityId = req.body.quality || 'standard';
    if (qualityId === 'draft') layerHeight = 0.28;
    if (qualityId === 'high') layerHeight = 0.12;

    const useSupports = req.body.supports === 'true';

    const command = `${SLICER_COMMAND} --export-gcode --load "${configPath}" --fill-density ${infillPercent}% --layer-height ${layerHeight} ${useSupports ? '--support-material' : ''} --output "${outputGcode}" "${inputPath}"`;

    console.log(`\n🖨️  SLICING...`);
    console.log(`   Material: ${material}, Relleno: ${infillPercent}%, Capa: ${layerHeight}mm`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("❌ ERROR:", error.message);
            return res.json({ volumen: 0, peso: 0, tiempoTexto: "Error", tiempoHoras: 0, pesoSoportes: 0 });
        }

        console.log("✅ GCode Generado");

        let gcodeContent = "";
        try {
            gcodeContent = fs.readFileSync(outputGcode, 'utf8');
        } catch (err) {
            console.error("Error leyendo GCode:", err);
            return res.json({ volumen: 0, peso: 0, tiempoTexto: "Error lectura", tiempoHoras: 0, pesoSoportes: 0 });
        }

        // === DEBUGGING: IMPRIMIR FOOTER COMPLETO (50 LÍNEAS) ===
        const lines = gcodeContent.split('\n');
        const footer = lines.slice(-50).join('\n');
        console.log("\n========== GCODE FOOTER (ÚLTIMAS 50 LÍNEAS) ==========");
        console.log(footer);
        console.log("======================================================\n");

        // === EXTRACCIÓN DE DATOS ===

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
                break;
            }
        }

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
                break;
            }
        }
        if (peso === 0 && volumen > 0) peso = volumen * 1.24; // Fallback

        // 3. TIEMPO - MÚLTIPLES PATRONES (CRÍTICO)
        let timeStr = "0m";
        const timePatterns = [
            /; estimated printing time \(normal mode\) = (.*)/,
            /; estimated printing time = (.*)/,
            /; printing time = (.*)/,
            /; total printing time: (.*)/i,
            /; time elapsed: (.*)/i
        ];

        for (const pattern of timePatterns) {
            const match = gcodeContent.match(pattern);
            if (match) {
                timeStr = match[1].trim();
                console.log(`⏱️  TIEMPO ENCONTRADO CON PATRÓN: ${pattern}`);
                break;
            }
        }

        // Convertir tiempo a horas decimales
        let hours = 0;
        const d = timeStr.match(/(\d+)d/);
        const h = timeStr.match(/(\d+)h/);
        const m = timeStr.match(/(\d+)m/);
        const s = timeStr.match(/(\d+)s/);

        if (d) hours += parseInt(d[1]) * 24;
        if (h) hours += parseInt(h[1]);
        if (m) hours += parseInt(m[1]) / 60;
        if (s) hours += parseInt(s[1]) / 3600;

        // 4. SOPORTES (Para Dificultad)
        let pesoSoportes = 0;
        const supportPatterns = [
            /; support material volume: (\d+(\.\d+)?)/i,
            /; support material: (\d+(\.\d+)?) cm3/i,
            /; filament used \[cm3\] \(support\) = (\d+(\.\d+)?)/
        ];

        for (const pattern of supportPatterns) {
            const match = gcodeContent.match(pattern);
            if (match) {
                const volSoporte = parseFloat(match[1]);
                pesoSoportes = volSoporte * 1.24;
                break;
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
        }

        // === LOGS FINALES ===
        console.log(`\n📊 DATOS EXTRAÍDOS:`);
        console.log(`   - Volumen: ${volumen.toFixed(2)} cm3`);
        console.log(`   - Peso Total: ${peso.toFixed(2)} g`);
        console.log(`   - Peso Soportes: ${pesoSoportes.toFixed(2)} g (${((pesoSoportes / peso) * 100).toFixed(1)}%)`);
        console.log(`   - Tiempo: "${timeStr}" = ${hours.toFixed(2)} horas`);
        if (dimensions) console.log(`   - Dimensiones: ${dimensions.x} x ${dimensions.y} x ${dimensions.z} mm`);

        // Limpieza
        try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch (e) { }

        res.json({
            volumen,
            peso,
            tiempoTexto: timeStr,
            tiempoHoras: hours,
            pesoSoportes,
            dimensions
        });
    });
});

app.listen(3001, () => console.log('✅ Backend Cotizador corriendo en puerto 3001'));
