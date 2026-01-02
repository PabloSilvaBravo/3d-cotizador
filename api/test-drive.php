<?php
/**
 * Test Google Drive Upload - REST API Pura
 */

try {
    echo "<h2>🧪 Test de Google Drive (REST API)</h2>";

    // 1. Verificar token
    $tokenPath = __DIR__ . '/drive_token.json';
    if (!file_exists($tokenPath)) {
        throw new Exception("❌ Token no encontrado. <a href='setup-drive.php'>Ejecuta setup</a>");
    }

    echo "✅ Token encontrado<br>";

    // 2. Llamar al endpoint de upload
    $testFile = [
        'fileName' => 'test_' . date('Ymd_His') . '.txt',
        'base64' => base64_encode("Hola Mundo desde Mechatronic\nFecha: " . date('Y-m-d H:i:s')),
        'mimeType' => 'text/plain'
    ];

    echo "⏳ Subiendo archivo de prueba...<br>";

    // Detectar URL actual automáticamente
    // Usar HTTPS siempre para evitar redirect
    $uploadUrl = "https://" . $_SERVER['HTTP_HOST'] . "/api/upload-to-drive.php";

    $ch = curl_init($uploadUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($testFile)
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $result = json_decode($response, true);

    if ($httpCode === 200 && $result['success']) {
        echo "<hr>";
        echo "<h3>✅ ¡Éxito!</h3>";
        echo "<p><strong>Archivo:</strong> {$testFile['fileName']}</p>";
        echo "<p><a href='{$result['url']}' target='_blank'>📥 Ver en Drive</a></p>";
        echo "<p style='background:#d4edda;padding:15px;'>El sistema funciona correctamente.</p>";
    } else {
        echo "<hr><h3>❌ Error</h3><pre>" . htmlspecialchars($response) . "</pre>";
    }

} catch (Exception $e) {
    echo "<p style='background:#f8d7da;padding:15px;'>{$e->getMessage()}</p>";
}
?>
<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>Test Drive</title>
</head>

<body></body>

</html>