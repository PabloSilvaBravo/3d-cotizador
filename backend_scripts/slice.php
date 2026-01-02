<?php
// slice.php
// Endpoint para procesar STL con PrusaSlicer en servidor
// Requiere: "install_prusa.sh" ejecutado y "config.ini" en esta misma carpeta

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

    // Validar extensión
    if (!in_array($ext, ['stl', 'obj', '3mf'])) {
        throw new Exception('Invalid file type');
    }

    $safeName = uniqid() . '.' . $ext;
    $inputPath = $uploadDir . $safeName;
    $outputPath = $inputPath . '.gcode';

    if (!move_uploaded_file($tmpName, $inputPath)) {
        throw new Exception('Failed to move uploaded file');
    }

    // Paths
    $slicerPath = '/home/mechatro/slicer/prusa-slicer';
    $configPath = __DIR__ . '/config.ini';

    if (!file_exists($slicerPath))
        throw new Exception('PrusaSlicer exec not found at ' . $slicerPath);
    if (!file_exists($configPath))
        throw new Exception('config.ini not found at ' . $configPath);

    // Ejecutar Slicer
    // --center x,y para centrar pieza (opcional)
    $command = "xvfb-run -a $slicerPath --export-gcode --load $configPath --output $outputPath $inputPath 2>&1";

    $output = [];
    $returnCode = 0;
    exec($command, $output, $returnCode);

    if ($returnCode !== 0 || !file_exists($outputPath)) {
        throw new Exception('Slicing process failed. Log: ' . implode("\n", $output));
    }

    // Leer Resultados del Gcode (Comentarios al final)
    $gcodeContent = file_get_contents($outputPath); // Leer todo (cuidado con RAM, quizás leer solo últimos 1kb es mejor)

    // Optimización: Leer solo el final del archivo
    // $gcodeContent = shell_exec("tail -n 200 $outputPath"); 

    // Regex
    preg_match('/; filament used \[g\] = ([0-9.]+)/', $gcodeContent, $weightMatch);
    $weight = isset($weightMatch[1]) ? floatval($weightMatch[1]) : 0;

    preg_match('/; estimated printing time = (.*)/', $gcodeContent, $timeMatch);
    $timeStr = isset($timeMatch[1]) ? trim($timeMatch[1]) : '';

    // Calcular Minutos
    $minutes = 0;
    if (preg_match('/(\d+)d/', $timeStr, $d))
        $minutes += intval($d[1]) * 24 * 60;
    if (preg_match('/(\d+)h/', $timeStr, $h))
        $minutes += intval($h[1]) * 60;
    if (preg_match('/(\d+)m/', $timeStr, $m))
        $minutes += intval($m[1]);

    // Cleanup
    @unlink($inputPath);
    @unlink($outputPath);

    echo json_encode([
        'success' => true,
        'weight_g' => $weight,
        'time_minutes' => $minutes,
        'time_text' => $timeStr,
        'slicer' => 'PrusaSlicer'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>