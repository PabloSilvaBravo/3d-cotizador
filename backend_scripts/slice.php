<?php
// slice.php v29 - VERIFIED FOR CLI 2.9.1
// 1. COTIZACIÓN: Lógica v15 (Sin soportes, optimizada).
// 2. DETECCIÓN: Lógica Sentinel con buildplate-only (v28).
// 3. CÁLCULO PESO SOPORTES: Slicing adicional cuando supports_needed=true (v29).
// 4. COMPATIBILIDAD: Validado con PrusaSlicer 2.9.1 CLI.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    // --- 0. CONFIGURACIÓN ---
    $baseUrl = "https://dashboard.mechatronicstore.cl/api/3d";

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

    // Archivos de salida
    $outputPath = $uploadDir . $uniqueId . '.gcode';
    $sentinelPath = $uploadDir . $uniqueId . '_sentinel.gcode';

    if (!move_uploaded_file($tmpName, $inputPath)) {
        throw new Exception('Failed to move uploaded file');
    }

    // CORREGIDO: Path a PrusaSlicer 2.9.1
    $slicerPath = '/home/mechatro/slicer/squashfs-root-2.9.1/bin/prusa-slicer';
    $configPath = __DIR__ . '/config.ini';

    if (!file_exists($slicerPath))
        throw new Exception('Slicer binary not found');

    // CONVERSIÓN STEP
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

    // --- 2. INPUTS ---
    $rawQuality = isset($_POST['quality']) ? $_POST['quality'] : 0.2;
    $quality = number_format(floatval($rawQuality), 2, '.', '');
    if ($quality < 0.05)
        $quality = "0.20";
    if ($quality > 0.32)
        $quality = "0.32";

    $rawInfill = isset($_POST['infill']) ? $_POST['infill'] : 15;
    $infill = intval($rawInfill);
    if ($infill < 0)
        $infill = 0;
    if ($infill > 100)
        $infill = 100;

    $rawScale = isset($_POST['scaleFactor']) ? $_POST['scaleFactor'] : 1.0;
    $scale = number_format(floatval($rawScale), 4, '.', '');


    // ==========================================
    // FASE 1: SLICING REAL (Lógica v15)
    // ==========================================

    $speedMult = 1.0;
    $combineInfill = 1;
    $topLayers = 4;
    $bottomLayers = 3;
    $infillWidth = "0.45";
    $solidInfillWidth = "0.45";

    if ($quality <= 0.16) {
        $topLayers = 4;
        $bottomLayers = 4;
        $speedMult = 2.1;
        $combineInfill = 1;
        $infillWidth = "0.68";
        $solidInfillWidth = "0.60";
    } elseif ($quality <= 0.22) {
        $topLayers = 4;
        $bottomLayers = 3;
        $speedMult = 1.0;
        $combineInfill = 1;
        $infillWidth = "0.45";
    } else {
        $topLayers = 4;
        $bottomLayers = 3;
        $speedMult = 1.5;
        $combineInfill = 0;
        $infillWidth = "0.70";
        $solidInfillWidth = "0.65";
    }

    $basePerim = 350;
    $baseOuter = 260;
    $baseInfill = 480;
    $baseSolid = 420;
    $baseTop = 320;
    $vPerim = intval($basePerim * $speedMult);
    $vOuter = intval($baseOuter * $speedMult);
    $vInfill = intval($baseInfill * $speedMult);
    $vSolid = intval($baseSolid * $speedMult);
    $vTop = intval($baseTop * $speedMult);

    $args = [];
    $args[] = "--export-gcode";
    $args[] = "--load " . escapeshellarg($configPath);
    $args[] = "--bed-shape 0x0,325x0,325x320,0x320";
    $args[] = "--center 162.5,160";
    $args[] = "--filament-density 1.24";
    $args[] = "--filament-diameter 1.75";
    $args[] = "--filament-cost 20000";
    $args[] = "--top-solid-layers " . $topLayers;
    $args[] = "--bottom-solid-layers " . $bottomLayers;
    $args[] = "--perimeters 2";
    $args[] = "--layer-height " . escapeshellarg($quality);
    $args[] = "--perimeter-generator arachne";
    $args[] = "--ensure-vertical-shell-thickness enabled";
    $args[] = "--infill-extrusion-width " . escapeshellarg($infillWidth);
    $args[] = "--solid-infill-extrusion-width " . escapeshellarg($solidInfillWidth);
    $args[] = "--external-perimeter-extrusion-width " . escapeshellarg("0.45");
    if ($combineInfill === 1)
        $args[] = "--infill-every-layers 2";
    else
        $args[] = "--infill-every-layers 1";
    $args[] = "--max-volumetric-speed 100";
    $args[] = "--max-print-speed 800";
    $args[] = "--perimeter-speed " . $vPerim;
    $args[] = "--external-perimeter-speed " . $vOuter;
    $args[] = "--infill-speed " . $vInfill;
    $args[] = "--solid-infill-speed " . $vSolid;
    $args[] = "--top-solid-infill-speed " . $vTop;

    // --- SOPORTES OPTIMIZADOS (SIMULACIÓN ARBOL) ---
    // Usamos 'snug' + espaciado amplio para imitar el peso ligero de soportes orgánicos
    $args[] = "--support-material-style snug";
    $args[] = "--support-material-spacing 4";
    $args[] = "--support-material-threshold 40";
    $args[] = "--dont-support-bridges";

    $args[] = "--support-material-speed 400";
    $args[] = "--bridge-speed 250";
    $args[] = "--gap-fill-speed 250";
    $args[] = "--travel-speed 800";
    $args[] = "--default-acceleration 20000";
    $args[] = "--perimeter-acceleration 12000";
    $args[] = "--infill-acceleration 20000";
    $args[] = "--travel-acceleration 20000";
    $args[] = "--fill-density " . escapeshellarg($infill . "%");
    $args[] = "--fill-pattern rectilinear";
    $args[] = "--slowdown-below-layer-time 0";
    $args[] = "--fan-always-on";
    $args[] = "--scale " . escapeshellarg($scale);

    // Ejecución PRINCIPAL
    $cmdArgs = implode(" ", $args);
    $command = "xvfb-run -a $slicerPath $cmdArgs --output " . escapeshellarg($outputPath) . " " . escapeshellarg($slicingInput) . " 2>&1";
    exec($command, $output, $returnCode);

    if ($returnCode !== 0 || !file_exists($outputPath)) {
        throw new Exception('Main Slicing failed: ' . implode("\n", $output));
    }

    // LECTURA DATOS PRINCIPALES
    $weight = 0;
    $timeStr = "";
    $fileSize = filesize($outputPath);
    $readSize = min($fileSize, 131072);
    $fp = fopen($outputPath, 'r');
    if ($fileSize > $readSize)
        fseek($fp, -$readSize, SEEK_END);
    $tail = fread($fp, $readSize);
    fclose($fp);

    if (preg_match('/;\s*(total\s+)?filament\s+used\s+\[g\]\s*=\s*([0-9.]+)/i', $tail, $m))
        $weight = floatval(end($m));
    if (preg_match('/; estimated printing time.*=\s*(.*)/i', $tail, $m))
        $timeStr = trim($m[1]);


    // ==========================================
    // FASE 2: THE SENTINEL (DETECTOR)
    // ==========================================

    $sentinelArgs = [];
    $sentinelArgs[] = "--export-gcode";
    $sentinelArgs[] = "--load " . escapeshellarg($configPath);
    $sentinelArgs[] = "--center 162.5,160";
    $sentinelArgs[] = "--scale " . escapeshellarg($scale);
    $sentinelArgs[] = "--layer-height 0.25";
    $sentinelArgs[] = "--perimeters 2";
    $sentinelArgs[] = "--fill-density " . escapeshellarg("0%");
    $sentinelArgs[] = "--top-solid-layers 1";
    $sentinelArgs[] = "--bottom-solid-layers 1";
    $sentinelArgs[] = "--support-material";
    $sentinelArgs[] = "--support-material-auto";

    // PARAMETROS SENTINEL COHERENTES CON FASE 1
    $sentinelArgs[] = "--support-material-threshold 40";
    $sentinelArgs[] = "--support-material-style snug";
    $sentinelArgs[] = "--support-material-spacing 4";

    $sentinelArgs[] = "--dont-support-bridges";
    $sentinelArgs[] = "--support-material-buildplate-only";

    $sentCmdArgs = implode(" ", $sentinelArgs);
    $sentinelCommand = "xvfb-run -a $slicerPath $sentCmdArgs --output " . escapeshellarg($sentinelPath) . " " . escapeshellarg($slicingInput) . " 2>&1";

    exec($sentinelCommand, $sentOutput, $sentReturn);

    $supportsNeeded = false;

    if ($sentReturn === 0 && file_exists($sentinelPath)) {
        $grepCmd = "grep -q -m 1 ';TYPE:Support material' " . escapeshellarg($sentinelPath);
        $grepRet = 0;
        system($grepCmd, $grepRet);
        $supportsNeeded = ($grepRet === 0);
    }


    // ==========================================
    // FASE 3: CÁLCULO DE PESO DE SOPORTES (v29)
    // Solo se ejecuta si supports_needed = true
    // ==========================================

    $pesoSoportes = 0;

    if ($supportsNeeded) {
        $supportOutputPath = $uploadDir . $uniqueId . '_support.gcode';

        // Usar mismos args del principal (ya incluyen style/spacing) y activar support
        $supportArgs = $args;
        $supportArgs[] = "--support-material";
        $supportArgs[] = "--support-material-auto";
        $supportArgs[] = "--support-material-buildplate-only";
        // Threshold ya está en $args como 40, no hace falta repetirlo

        $supportCmdArgs = implode(" ", $supportArgs);
        $supportCommand = "xvfb-run -a $slicerPath $supportCmdArgs --output " . escapeshellarg($supportOutputPath) . " " . escapeshellarg($slicingInput) . " 2>&1";


        exec($supportCommand, $supportOutput, $supportReturn);

        if ($supportReturn === 0 && file_exists($supportOutputPath)) {
            // Leer peso con soportes
            $supportFileSize = filesize($supportOutputPath);
            $supportReadSize = min($supportFileSize, 131072);
            $sfp = fopen($supportOutputPath, 'r');
            if ($supportFileSize > $supportReadSize)
                fseek($sfp, -$supportReadSize, SEEK_END);
            $supportTail = fread($sfp, $supportReadSize);
            fclose($sfp);

            $weightWithSupports = 0;
            if (preg_match('/;\s*(total\s+)?filament\s+used\s+\[g\]\s*=\s*([0-9.]+)/i', $supportTail, $sm))
                $weightWithSupports = floatval(end($sm));

            // Calcular diferencia
            $pesoSoportes = round($weightWithSupports - $weight, 2);
            if ($pesoSoportes < 0)
                $pesoSoportes = 0; // Seguridad

            // Ajuste margen seguridad: +2g extra para cubrir purgas/limpieza
            $pesoSoportes += 2;

            @unlink($supportOutputPath);
        }
    }


    // Calculo Horas Real
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

    // --- 6. DIMENSIONES Y URLS ---
    $dimensions = null;

    // CORREGIDO: Usar get_file.php para servir el archivo con CORS headers
    // $modelUrl = $baseUrl . '/uploads/' . basename($slicingInput);
    $modelUrl = $baseUrl . '/get_file.php?file=' . basename($slicingInput);

    if ($slicingInput !== $inputPath) {
        $infoCmd = "xvfb-run -a $slicerPath --info " . escapeshellarg($slicingInput) . " 2>&1";
        $infoOut = [];
        exec($infoCmd, $infoOut);
        foreach ($infoOut as $line) {
            if (preg_match('/Size:\s+x=([0-9.]+)\s+y=([0-9.]+)\s+z=([0-9.]+)/i', $line, $dimMatch)) {
                $dimensions = ['x' => floatval($dimMatch[1]), 'y' => floatval($dimMatch[2]), 'z' => floatval($dimMatch[3])];
                break;
            }
        }
    } else {
        // También usar proxy para STL original
        $modelUrl = $baseUrl . '/get_file.php?file=' . basename($inputPath);
    }

    // LIMPIEZA
    @unlink($outputPath);
    @unlink($sentinelPath);

    echo json_encode([
        'success' => true,
        'peso' => $weight,
        'volumen' => ($weight > 0) ? $weight / 1.24 : 0,
        'tiempoTexto' => $timeStr,
        'timeHours' => round($totalHours, 2),
        'supports_needed' => $supportsNeeded,
        'peso_soportes' => $pesoSoportes,
        'dimensions' => $dimensions,
        'url_model' => $modelUrl,
        'debug' => [
            'mode' => 'Sentinel Detector v29 (PrusaSlicer 2.9.1)',
            'detection_method' => 'Grep TYPE:Support + Weight Calculation'
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>