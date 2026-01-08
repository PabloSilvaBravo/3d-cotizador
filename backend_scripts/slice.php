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

    // Usar directorio relativo para evitar problemas de permisos/Docker con /tmp
    $uploadDir = __DIR__ . '/uploads/';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            throw new Exception('Failed to create upload directory');
        }
        chmod($uploadDir, 0777); // Asegurar permisos
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

    // Inputs del Frontend

    // Quality / Layer Height (ej: 0.2, 0.28, 0.16)
    $rawQuality = isset($_POST['quality']) ? $_POST['quality'] : 0.2;
    $quality = number_format(floatval($rawQuality), 2, '.', ''); // Asegurar "0.20" con punto
    // Validar rango seguro
    if ($quality < 0.05 || $quality > 1.0)
        $quality = "0.20";

    // Infill (0-100)
    $rawInfill = isset($_POST['infill']) ? $_POST['infill'] : 15;
    $infill = intval($rawInfill);
    if ($infill < 0)
        $infill = 0;
    if ($infill > 100)
        $infill = 100;

    // Escala
    $rawScale = isset($_POST['scaleFactor']) ? $_POST['scaleFactor'] : 1.0;
    $scale = number_format(floatval($rawScale), 4, '.', '');


    // Paths
    // Ruta ajustada para entorno VPS Docker (Squashfs extract)
    $slicerPath = '/home/mechatro/slicer/squashfs-root-old/usr/bin/prusa-slicer';
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

    // VELOCIDADES CRÍTICAS (Bambu Studio "My Settings" profile)
    $args[] = "--perimeter-speed 60";
    $args[] = "--external-perimeter-speed 60";
    $args[] = "--infill-speed 100";
    $args[] = "--solid-infill-speed 100";
    $args[] = "--top-solid-infill-speed 100";
    $args[] = "--support-material-speed 80";
    $args[] = "--bridge-speed 25";
    $args[] = "--gap-fill-speed 30";
    $args[] = "--travel-speed 120";
    $args[] = "--first-layer-speed 30";

    // ACELERACIONES
    $args[] = "--default-acceleration 500";
    $args[] = "--perimeter-acceleration 500";
    $args[] = "--infill-acceleration 500";
    $args[] = "--bridge-acceleration 500";
    $args[] = "--first-layer-acceleration 300";

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

    // Leer solo el final para optimizar (Aumentado a 16KB por si hay thumbnails al final)
    $fileSize = filesize($outputPath);
    $readSize = min($fileSize, 16384); // 16KB

    $fp = fopen($outputPath, 'r');
    if ($fileSize > $readSize) {
        fseek($fp, -$readSize, SEEK_END);
    }
    $tail = fread($fp, $readSize);
    fclose($fp);

    // Regex Prusa (Más flexible con espacios)
    // ; filament used [g] = 13.45
    if (preg_match('/; filament used \[g\]\s*=\s*([0-9.]+)/', $tail, $m)) {
        $weight = floatval($m[1]);
    }

    // ; estimated printing time = 2h 30m 10s
    if (preg_match('/; estimated printing time\s*=\s*(.*)/', $tail, $m)) {
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
        'peso' => $weight,
        'volumen' => $weight / 1.24,
        'tiempoTexto' => $timeStr,
        'timeHours' => $totalHours,
        'debug' => [
            'cmd' => $command,
            'log_tail' => array_slice($output, -5),
            'gcode_tail_sample' => substr($tail, -2000) // Mostrar últimos chars para debug visual
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>