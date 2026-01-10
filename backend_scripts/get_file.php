<?php
// get_file.php - Proxy para servir archivos con cabeceras CORS correctas
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 1. Validar parámetro
if (!isset($_GET['file'])) {
    http_response_code(400);
    die("Error: No file specified.");
}

// 2. Seguridad: Sanitizar nombre de archivo (evitar ../)
$filename = basename($_GET['file']);
$filepath = __DIR__ . '/uploads/' . $filename;

// 3. Servir archivo
if (file_exists($filepath)) {
    // Detectar tipo MIME básico
    $ext = strtolower(pathinfo($filepath, PATHINFO_EXTENSION));
    $mime = 'application/octet-stream';
    if ($ext === 'stl')
        $mime = 'model/stl';
    if ($ext === 'gcode')
        $mime = 'text/plain';

    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($filepath));
    header('Content-Disposition: inline; filename="' . $filename . '"');

    // Output eficiente
    readfile($filepath);
} else {
    http_response_code(404);
    die("Error: File not found.");
}
?>