<?php
// get_file.php - Proxy para servir archivos STL con CORS
// Permite al frontend descargar el modelo convertido sin bloqueos de CORS

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// 1. Obtener nombre de archivo y sanearlo
$file = $_GET['file'] ?? '';
$file = basename($file); // Evita Directory Traversal

// 2. Definir ruta segura
$filePath = __DIR__ . '/uploads/' . $file;

// 3. Validaciones de seguridad
// - Archivo existe
// - Es extensión .stl (solo servimos modelos convertidos)
if (empty($file) || !file_exists($filePath)) {
    http_response_code(404);
    echo "File not found.";
    exit;
}

$ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
if ($ext !== 'stl') {
    http_response_code(403);
    echo "Access denied. Only STL files allowed.";
    exit;
}

// 4. Servir el archivo con headers correctos
header('Content-Type: model/stl');
header('Content-Disposition: inline; filename="' . $file . '"');
header('Content-Length: ' . filesize($filePath));
// Headers de caché para mejorar rendimiento en viewer
header('Cache-Control: public, max-age=3600');

readfile($filePath);
?>