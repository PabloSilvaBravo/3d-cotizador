const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const SLICER_COMMAND = '"C:\\Program Files\\Prusa3D\\PrusaSlicer\\prusa-slicer-console.exe"';
const INPUT_FILE = path.resolve(__dirname, 'uploads', '11655b18d828c1fc6dd0d370c559a855.step');
const CONFIG_PATH = path.resolve(__dirname, 'backend', 'profiles', 'bambu_realistic.ini');
const OUTPUT_GCODE = INPUT_FILE + '.gcode';

console.log('--- INICIANDO DEBUG SLICING STEP ---');
console.log('Input:', INPUT_FILE);
console.log('Config:', CONFIG_PATH);

if (!fs.existsSync(INPUT_FILE)) {
    console.error('ERROR: Input file no existe');
    process.exit(1);
}

// Lógica copiada de server.js
let layerHeight = 0.2;
let infill = 15;
let scale = 100;
let rotZDegrees = 0;

const commandParams = [
    `--export-gcode`,
    `--center 160,160`,
    `--ensure-on-bed`,
    `--load "${CONFIG_PATH}"`,
    `--output "${OUTPUT_GCODE}"`,
    `--scale ${scale}%`,
    // Configuración Base
    `--layer-height ${layerHeight}`,
    `--perimeters 2`,
    `--top-solid-layers 3`,
    `--bottom-solid-layers 3`,
    `--fill-density ${infill}%`,
    `--fill-pattern cubic`,
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

    // Input File
    `"${INPUT_FILE}"`
];

const command = `${SLICER_COMMAND} ${commandParams.filter(Boolean).join(' ')}`;
console.log('\nCOMANDO GENERADO:\n', command);

console.log('\nEJECUTANDO...');
exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error('❌ ERROR EXEC:', error.message);
    }
    if (stderr) {
        console.log('⚠️ STDERR:', stderr);
    }
    if (stdout) {
        console.log('✅ STDOUT:', stdout);
    }

    if (fs.existsSync(OUTPUT_GCODE)) {
        const stats = fs.statSync(OUTPUT_GCODE);
        console.log(`\n🎉 ÉXITO: G-Code generado! Tamaño: ${stats.size} bytes`);
        console.log('Ruta:', OUTPUT_GCODE);
    } else {
        console.error('\n💀 FALLO: El archivo .gcode NO se generó.');
    }
});
