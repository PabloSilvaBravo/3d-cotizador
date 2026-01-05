<?php
// slice.php v2
// Slicing via PrusaSlicer CLI con parámetros dinámicos
// Requiere: install_prusa.sh y config.ini

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    if (!isset($_FILES['file'])) {
        throw new Exception('No file uploaded');
    }

    $uploadDir = '/tmp/slicer_uploads/';
    if (!is_dir($uploadDir))
        mkdir($uploadDir, 0777, true);

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

    // Inputs del Frontend
    $quality = isset($_POST['quality']) ? floatval($_POST['quality']) : 0.2; // Layer Height
    $infill = isset($_POST['infill']) ? intval($_POST['infill']) : 15;       // Percentage
    $scale = isset($_POST['scaleFactor']) ? floatval($_POST['scaleFactor']) : 1.0;

    // Paths
    $slicerPath = '/home/mechatro/slicer/prusa-slicer';
    $configPath = __DIR__ . '/config.ini';

    if (!file_exists($slicerPath))
        throw new Exception('Slicer exec not found');
    if (!file_exists($configPath))
        throw new Exception('Config ini not found');

    // Construir Argumentos CLI
    // Sobreescribimos la config base con los params específicos
    $args = [];
    $args[] = "--export-gcode";
    $args[] = "--load " . escapeshellarg($configPath);
    $args[] = "--layer-height " . escapeshellarg($quality);
    $args[] = "--fill-density " . escapeshellarg($infill . "%");
    $args[] = "--scale " . escapeshellarg($scale);

    // Nota: Rotación 3D compleja no está soportada fiablemente via CLI en esta versión sin manipular el STL antes.
    // Ignoramos rotationX/Y/Z del frontend por ahora y confiamos en 'support_material_auto' del config.ini

    $cmdArgs = implode(" ", $args);
    $command = "xvfb-run -a $slicerPath $cmdArgs --output $outputPath $inputPath 2>&1";

    // Ejecutar
    $output = [];
    $returnCode = 0;
    exec($command, $output, $returnCode);

    if ($returnCode !== 0 || !file_exists($outputPath)) {
        // Enviar log de error para debug
        throw new Exception('Slicing failed. Log tail: ' . implode("\n", array_slice($output, -10)));
    }

    // Analizar GCODE
    $weight = 0;
    $timeStr = "";

    // Leer solo el final para optimizar (últimos 4kb)
    $fp = fopen($outputPath, 'r');
    fseek($fp, -4096, SEEK_END);
    $tail = fread($fp, 4096);
    fclose($fp);

    // Regex Prusa
    // ; filament used [g] = 13.45
    if (preg_match('/; filament used \[g\] = ([0-9.]+)/', $tail, $m)) {
        $weight = floatval($m[1]);
    }

    // ; estimated printing time = 2h 30m 10s
    if (preg_match('/; estimated printing time = (.*)/', $tail, $m)) {
        $timeStr = trim($m[1]);
    }

    // Convertir tiempo a objeto detallado
    // Formato Prusa: "1d 2h 30m 10s"
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

    // Cleanup
    @unlink($inputPath);
    @unlink($outputPath);

    echo json_encode([
        'success' => true,
        'peso' => $weight,            // Compatible con frontend anterior
        'volumen' => $weight / 1.24,  // Estimación PLA
        'tiempoTexto' => $timeStr,    // Compatible con frontend anterior ("2h 30m")
        'timeHours' => $totalHours,   // Decimal hours para cálculos
        'debug' => [
            'cmd' => $command,
            'log_tail' => array_slice($output, -3) // Debug minimo
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>