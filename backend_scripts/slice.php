<?php
// slice.php v31 - SMART DIFFERENCE LOGIC
// 1. ELIMINADO "SENTINEL" (Doble ejecución innecesaria).
// 2. LOGICA INTELIGENTE: Slice TOTAL primero. Si hay soportes, Slice MODELO para restar.
//    - Caso sin soportes: 1 ejecución (Rápido).
//    - Caso con soportes: 2 ejecuciones (Preciso y Robusto).
// 3. OPTIMIZACIONES: Grid, No-Thumbnails.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // --- 0. CONFIGURACIÓN ---
    $baseUrl = "https://dashboard.mechatronicstore.cl/api/3d/";

    // --- 1. GESTIÓN DE ARCHIVOS ---
    if (!isset($_FILES['file'])) {
        throw new Exception('No file uploaded');
    }

    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
        chmod($uploadDir, 0777);
    }

    $originalName = $_FILES['file']['name'];
    $tmpName = $_FILES['file']['tmp_name'];
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    if (!in_array($ext, ['stl', 'step', 'stp', 'obj', '3mf'])) {
        throw new Exception('Invalid file type');
    }

    $uniqueId = uniqid();
    $inputPath = $uploadDir . $uniqueId . '.' . $ext;

    // Archivos temporales
    $outputPathTotal = $uploadDir . $uniqueId . '_total.gcode';
    $outputPathModel = $uploadDir . $uniqueId . '_model.gcode';

    if (!move_uploaded_file($tmpName, $inputPath)) {
        throw new Exception('Failed to move uploaded file');
    }

    $slicerPath = '/home/mechatro/slicer/squashfs-root-old/usr/bin/prusa-slicer';
    $configPath = __DIR__ . '/config.ini';

    // CONVERSIÓN STEP → STL
    $slicingInput = $inputPath;
    if ($ext === 'step' || $ext === 'stp') {
        $stlPath = $uploadDir . $uniqueId . '_converted.stl';
        $convertCmd = "xvfb-run -a $slicerPath --export-stl --output " . escapeshellarg($stlPath) . " " . escapeshellarg($inputPath) . " 2>&1";

        exec($convertCmd, $out, $ret);

        if ($ret === 0 && file_exists($stlPath)) {
            $slicingInput = $stlPath;
        } else {
            @unlink($inputPath);
            throw new Exception('STEP conversion failed');
        }
    }

    // --- 2. PARÁMETROS BASE ---
    $rawQuality = isset($_POST['quality']) ? $_POST['quality'] : 0.2;
    $quality = number_format(floatval($rawQuality), 2, '.', '');

    $rawInfill = isset($_POST['infill']) ? $_POST['infill'] : 15;
    $infill = intval($rawInfill);

    $rawScale = isset($_POST['scaleFactor']) ? $_POST['scaleFactor'] : 1.0;
    $scale = number_format(floatval($rawScale), 4, '.', '');

    // Optimización de Velocidad
    $speedMult = 1.0;
    $topLayers = 4;
    $bottomLayers = 3;
    $infillWidth = "0.45";

    if ($quality <= 0.16) {
        $topLayers = 5;
        $bottomLayers = 4;
        $infillWidth = "0.50";
    } elseif ($quality >= 0.24) {
        $infillWidth = "0.60";
    }

    // Argumentos Comunes (Sin definir soportes aún)
    $baseArgs = [];
    $baseArgs[] = "--export-gcode";
    $baseArgs[] = "--load " . escapeshellarg($configPath);
    $baseArgs[] = "--gcode-thumbnails 0";
    $baseArgs[] = "--resolution 0.01";
    $baseArgs[] = "--bed-shape 0x0,325x0,325x320,0x320";
    $baseArgs[] = "--center 162.5,160";
    $baseArgs[] = "--filament-density 1.24";
    $baseArgs[] = "--filament-diameter 1.75";
    $baseArgs[] = "--filament-cost 20000";
    $baseArgs[] = "--layer-height " . escapeshellarg($quality);
    $baseArgs[] = "--top-solid-layers " . $topLayers;
    $baseArgs[] = "--bottom-solid-layers " . $bottomLayers;
    $baseArgs[] = "--perimeters 2";
    $baseArgs[] = "--perimeter-generator arachne";
    $baseArgs[] = "--infill-extrusion-width " . $infillWidth;
    $baseArgs[] = "--max-volumetric-speed 100";
    $baseArgs[] = "--max-print-speed 600";
    $baseArgs[] = "--fill-density " . escapeshellarg($infill . "%");
    $baseArgs[] = "--fill-pattern rectilinear";
    $baseArgs[] = "--scale " . escapeshellarg($scale);
    $baseArgs[] = "--dont-support-bridges"; // Siempre activo para ahorrar soporte innecesario

    // =========================================================
    // PASO 1: SLICE TOTAL (MODELO + SOPORTES AUTOMÁTICOS GRID)
    // =========================================================
    // TRUCO: Asemejar peso Grid a Organic
    // 1. Spacing 4mm: Hace la rejilla mucho menos densa.
    // 2. Factor matemático final.
    $argsTotal = $baseArgs;
    $argsTotal[] = "--support-material";
    $argsTotal[] = "--support-material-auto";
    $argsTotal[] = "--support-material-threshold 45";
    $argsTotal[] = "--support-material-style grid";
    $argsTotal[] = "--support-material-spacing 4"; // Menos denso

    $cmdTotal = "xvfb-run -a $slicerPath " . implode(" ", $argsTotal) . " --output $outputPathTotal " . escapeshellarg($slicingInput) . " 2>&1";

    $outTotal = [];
    $retTotal = 0;
    exec($cmdTotal, $outTotal, $retTotal);

    if ($retTotal !== 0 || !file_exists($outputPathTotal)) {
        throw new Exception('Slicing Failure (Total): ' . implode("\n", array_slice($outTotal, -5)));
    }

    // Leer Resultados Totales
    $weightTotal = 0;
    $timeStr = "";
    $supportsDetected = false;

    // Leer footer rápido
    $fileSize = filesize($outputPathTotal);
    $readSize = min($fileSize, 131072);
    $fp = fopen($outputPathTotal, 'r');
    if ($fileSize > $readSize)
        fseek($fp, -$readSize, SEEK_END);
    $tailTotal = fread($fp, $readSize);
    fclose($fp);

    if (preg_match('/;\s*(total\s+)?filament\s+used\s+\[g\]\s*=\s*([0-9.]+)/i', $tailTotal, $m)) {
        $weightTotal = floatval(end($m));
    }
    if (preg_match('/; estimated printing time.*=\s*(.*)/i', $tailTotal, $m)) {
        $timeStr = trim($m[1]);
    }

    // Detección Robusta (Grep)
    $grepCmd = "grep -q -m 1 ';TYPE:Support material' " . escapeshellarg($outputPathTotal);
    $grepRet = 0;
    system($grepCmd, $grepRet);
    if ($grepRet === 0) {
        $supportsDetected = true;
    }

    // Variables finales por defecto
    $weightModel = $weightTotal;
    $supportWeight = 0;

    // =========================================================
    // PASO 2: SLICE DIFERENCIAL (SOLO SI SE DETECTARON SOPORTES)
    // =========================================================
    if ($supportsDetected) {
        $argsModel = $baseArgs;
        // Explícitamente APAGAR soportes
        $argsModel[] = "--support-material 0";

        $cmdModel = "xvfb-run -a $slicerPath " . implode(" ", $argsModel) . " --output $outputPathModel " . escapeshellarg($slicingInput) . " 2>&1";
        exec($cmdModel, $outModel, $retModel);

        if ($retModel === 0 && file_exists($outputPathModel)) {
            // Leer peso modelo limpio
            $fileSizeM = filesize($outputPathModel);
            $readSizeM = min($fileSizeM, 131072);
            $fpM = fopen($outputPathModel, 'r');
            if ($fileSizeM > $readSizeM)
                fseek($fpM, -$readSizeM, SEEK_END);
            $tailModel = fread($fpM, $readSizeM);
            fclose($fpM);

            if (preg_match('/;\s*(total\s+)?filament\s+used\s+\[g\]\s*=\s*([0-9.]+)/i', $tailModel, $mM)) {
                $weightModel = floatval(end($mM));
            }

            // CÁLCULO DIFERENCIAL EXACTO (GRID RAW)
            $gridSupportWeight = max(0, round($weightTotal - $weightModel, 2));

            // CORRECCIÓN ORGANIC
            // Aplicamos factor x0.70 para simular el ahorro de los soportes de árbol
            $supportWeight = round($gridSupportWeight * 0.70, 2);

            // Recalculamos el total reportado para ser consistentes
            $weightTotal = $weightModel + $supportWeight;

            @unlink($outputPathModel);
        }
    }

    // Parsing Tiempo
    $totalHours = 0;
    if (!empty($timeStr)) {
        $d = 0;
        $h = 0;
        $mMin = 0;
        if (preg_match('/(\d+)d/', $timeStr, $mat))
            $d = intval($mat[1]);
        if (preg_match('/(\d+)h/', $timeStr, $mat))
            $h = intval($mat[1]);
        if (preg_match('/(\d+)m/', $timeStr, $mat))
            $mMin = intval($mat[1]);
        $totalHours = ($d * 24 + $h + $mMin / 60);
    }

    // --- 6. DIMENSIONES & CLEANUP ---
    $dimensions = null;
    $convertedStlUrl = null;

    if ($slicingInput !== $inputPath) {
        $convertedStlUrl = '/backend_scripts/uploads/' . basename($slicingInput);
        $infoCmd = "xvfb-run -a $slicerPath --info " . escapeshellarg($slicingInput);
        exec($infoCmd, $infoOut);
        foreach ($infoOut as $line) {
            if (preg_match('/Size:\s+x=([0-9.]+)\s+y=([0-9.]+)\s+z=([0-9.]+)/i', $line, $dimMatch)) {
                $dimensions = ['x' => floatval($dimMatch[1]), 'y' => floatval($dimMatch[2]), 'z' => floatval($dimMatch[3])];
                break;
            }
        }
    }

    @unlink($outputPathTotal);
    @unlink($inputPath);
    // Preservar STL convertido

    echo json_encode([
        'success' => true,
        // Mantener estructura que espera el frontend
        'peso' => $weightTotal,          // Peso TOTAL (para cobro material base)
        'peso_soportes' => $supportWeight, // Peso SOLO soportes
        'peso_modelo' => $weightModel,   // Peso SOLO modelo
        'volumen' => ($weightTotal > 0) ? $weightTotal / 1.24 : 0,
        'tiempoTexto' => $timeStr,
        'timeHours' => round($totalHours, 2),
        'supports_needed' => ($supportWeight > 0.1), // Threshold mínimo para UI
        'dimensions' => $dimensions,
        'convertedStlUrl' => $convertedStlUrl,
        'debug' => [
            'mode' => 'Smart Differential v31',
            'support_detected' => $supportsDetected,
            'calc_method' => $supportsDetected ? 'Total - Model' : 'Total Only'
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>