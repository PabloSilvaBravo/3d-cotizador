<?php
// slice.php v3 - FINAL
// PrusaSlicer CLI con corrección de PESO y CAMA (325x320)

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // 1. VALIDACIÓN DE ARCHIVO
    if (!isset($_FILES['file'])) {
        throw new Exception('No file uploaded');
    }

    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            throw new Exception('Failed to create upload directory');
        }
        chmod($uploadDir, 0777);
    }

    $originalName = $_FILES['file']['name'];
    $tmpName = $_FILES['file']['tmp_name'];
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    if (!in_array($ext, ['stl', 'obj', '3mf'])) {
        throw new Exception('Invalid file type');
    }

    $uniqueId = uniqid();
    $inputPath = $uploadDir . $uniqueId . '.' . $ext;
    $outputPath = $inputPath . '.gcode';

    if (!move_uploaded_file($tmpName, $inputPath)) {
        throw new Exception('Failed to move uploaded file');
    }

    // 2. INPUTS DEL FRONTEND

    // Calidad (Altura de capa)
    $rawQuality = isset($_POST['quality']) ? $_POST['quality'] : 0.2;
    $quality = number_format(floatval($rawQuality), 2, '.', '');
    if ($quality < 0.05 || $quality > 1.0)
        $quality = "0.20";

    // Relleno (Infill)
    $rawInfill = isset($_POST['infill']) ? $_POST['infill'] : 15;
    $infill = intval($rawInfill);
    if ($infill < 0)
        $infill = 0;
    if ($infill > 100)
        $infill = 100;

    // Escala
    $rawScale = isset($_POST['scaleFactor']) ? $_POST['scaleFactor'] : 1.0;
    $scale = number_format(floatval($rawScale), 4, '.', '');

    // Rutas del sistema (Ajustar según tu VPS)
    $slicerPath = '/home/mechatro/slicer/squashfs-root-old/usr/bin/prusa-slicer';
    $configPath = __DIR__ . '/config.ini';

    if (!file_exists($slicerPath))
        throw new Exception('Slicer exec not found');
    if (!file_exists($configPath))
        throw new Exception('Config ini not found');

    // 3. CONSTRUCCIÓN DE ARGUMENTOS (LA PARTE CRÍTICA)
    $args = [];
    $args[] = "--export-gcode";
    $args[] = "--load " . escapeshellarg($configPath); // Carga base

    // --- OPCIÓN 3: FORZAR GEOMETRÍA DE LA IMPRESORA ---
    // Área de impresión: 0x0 a 325x320
    $args[] = "--bed-shape 0x0,325x0,325x320,0x320";
    // Altura Z máxima (Asumimos 350mm o 400mm para este tamaño de cama)
    $args[] = "--max-print-height 400";
    // Centrar el objeto automáticamente en la cama nueva
    $args[] = "--center 162.5,160";

    // --- CORRECCIÓN DE PESO (DENSIDAD) ---
    // Forzamos PLA estándar para que el cálculo matemático coincida con escritorio
    $args[] = "--filament-density 1.24";
    $args[] = "--filament-diameter 1.75";
    $args[] = "--filament-cost 20000";

    // --- PARAMETROS DE IMPRESIÓN ---
    $args[] = "--layer-height " . escapeshellarg($quality);
    $args[] = "--fill-density " . escapeshellarg($infill . "%");
    $args[] = "--scale " . escapeshellarg($scale);

    // Forzar patrón de relleno igual a escritorio (Gyroid es el estándar moderno)
    // Si usas Grid en escritorio, cambia esto a 'grid'
    $args[] = "--fill-pattern gyroid";

    // --- VELOCIDADES (Bambu Lab H2D Perfil) ---
    $args[] = "--perimeter-speed 185";
    $args[] = "--external-perimeter-speed 145";
    $args[] = "--infill-speed 290";
    $args[] = "--solid-infill-speed 260";
    $args[] = "--top-solid-infill-speed 215";
    $args[] = "--support-material-speed 175";
    $args[] = "--bridge-speed 75";
    $args[] = "--gap-fill-speed 90";
    $args[] = "--travel-speed 420";
    $args[] = "--first-layer-speed 50";

    // --- ACELERACIONES ---
    $args[] = "--default-acceleration 20000";
    $args[] = "--perimeter-acceleration 15000";
    $args[] = "--infill-acceleration 20000";
    $args[] = "--bridge-acceleration 8000";
    $args[] = "--first-layer-acceleration 3000";
    $args[] = "--travel-acceleration 20000";

    // --- LIMITES ---
    $args[] = "--max-print-speed 420";
    $args[] = "--max-volumetric-speed 22";

    // 4. EJECUCIÓN
    $cmdArgs = implode(" ", $args);
    // xvfb-run es necesario para servidores sin monitor
    $command = "xvfb-run -a $slicerPath $cmdArgs --output $outputPath $inputPath 2>&1";

    $output = [];
    $returnCode = 0;
    exec($command, $output, $returnCode);

    if ($returnCode !== 0 || !file_exists($outputPath)) {
        throw new Exception('Slicing failed. Log: ' . implode("\n", array_slice($output, -10)));
    }

    // 5. ANÁLISIS DE RESULTADOS (REGEX CORREGIDA)
    $weight = 0;
    $timeStr = "";

    $fileSize = filesize($outputPath);
    $readSize = min($fileSize, 20000); // Leemos los últimos 20KB

    $fp = fopen($outputPath, 'r');
    if ($fileSize > $readSize) {
        fseek($fp, -$readSize, SEEK_END);
    }
    $tail = fread($fp, $readSize);
    fclose($fp);

    // REGEX ACTUALIZADA PARA PESO (Soporta "total filament used" y "filament used")
    if (preg_match('/;\s*(total\s+)?filament\s+used\s+\[g\]\s*=\s*([0-9.]+)/i', $tail, $m)) {
        // end($m) obtiene el último grupo capturado, que siempre será el número
        $weight = floatval(end($m));
    }

    // REGEX TIEMPO
    if (preg_match('/; estimated printing time\s*=\s*(.*)/i', $tail, $m)) {
        $timeStr = trim($m[1]);
    }

    // Convertir tiempo a horas decimales
    $d = 0;
    $h = 0;
    $mMin = 0;
    if (preg_match('/(\d+)d/', $timeStr, $mat))
        $d = intval($mat[1]);
    if (preg_match('/(\d+)h/', $timeStr, $mat))
        $h = intval($mat[1]);
    if (preg_match('/(\d+)m/', $timeStr, $mat))
        $mMin = intval($mat[1]);

    $totalMinutes = ($d * 24 * 60) + ($h * 60) + $mMin;
    $totalHours = $totalMinutes / 60;

    // Limpieza
    @unlink($inputPath);
    @unlink($outputPath);

    echo json_encode([
        'success' => true,
        'peso' => $weight, // Ahora debería coincidir con escritorio
        'volumen' => ($weight > 0) ? $weight / 1.24 : 0,
        'tiempoTexto' => $timeStr,
        'timeHours' => $totalHours,
        'debug' => [
            'bed_size' => '325x320',
            'density_used' => '1.24 (Forced)',
            'log_tail' => array_slice($output, -3)
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>