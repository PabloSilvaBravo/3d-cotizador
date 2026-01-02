<?php
/**
 * API Upload to Google Drive - REST API Pura (sin Composer)
 * 
 * Endpoint: POST https://3d.mechatronicstore.cl/api/upload-to-drive.php
 * Body: { fileName, base64, mimeType }
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Usar POST']);
    exit;
}

try {
    // 1. Leer input
    $input = json_decode(file_get_contents('php://input'), true);
    $fileName = $input['fileName'] ?? null;
    $base64Data = $input['base64'] ?? null;
    $mimeType = $input['mimeType'] ?? 'application/octet-stream';

    if (!$fileName || !$base64Data) {
        throw new Exception("Faltan fileName o base64");
    }

    // 2. Cargar token
    $tokenPath = __DIR__ . '/drive_token.json';
    if (!file_exists($tokenPath)) {
        throw new Exception("Token no encontrado. Ejecuta setup-drive.php");
    }

    $token = json_decode(file_get_contents($tokenPath), true);
    $accessToken = $token['access_token'];

    // 3. Renovar token si expiró
    if (isset($token['expires_in']) && time() > ($token['created'] ?? 0) + $token['expires_in']) {
        if (isset($token['refresh_token'])) {
            $credentials = json_decode(file_get_contents(__DIR__ . '/client_secret.json'), true);

            $ch = curl_init('https://oauth2.googleapis.com/token');
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POSTFIELDS => http_build_query([
                    'client_id' => $credentials['web']['client_id'],
                    'client_secret' => $credentials['web']['client_secret'],
                    'refresh_token' => $token['refresh_token'],
                    'grant_type' => 'refresh_token'
                ])
            ]);

            $response = curl_exec($ch);
            curl_close($ch);

            $newToken = json_decode($response, true);
            $newToken['refresh_token'] = $token['refresh_token']; // Preservar
            $newToken['created'] = time();
            file_put_contents($tokenPath, json_encode($newToken));
            $accessToken = $newToken['access_token'];
        }
    }

    // 4. Limpiar Base64
    if (strpos($base64Data, ',') !== false) {
        $base64Data = explode(',', $base64Data, 2)[1];
    }
    $fileContent = base64_decode($base64Data);

    // 5. Crear archivo en Drive (multipart upload)
    $boundary = '----WebKitFormBoundary' . uniqid();
    $metadata = json_encode([
        'name' => $fileName,
        'parents' => ['1elmlygqWUQxGvGWRgWKDAomwOUWEXTVE'] // Tu carpeta
    ]);

    $body = "--{$boundary}\r\n";
    $body .= "Content-Type: application/json; charset=UTF-8\r\n\r\n";
    $body .= "{$metadata}\r\n";
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: {$mimeType}\r\n\r\n";
    $body .= $fileContent . "\r\n";
    $body .= "--{$boundary}--";

    $ch = curl_init('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer {$accessToken}",
            "Content-Type: multipart/related; boundary={$boundary}",
            "Content-Length: " . strlen($body)
        ],
        CURLOPT_POSTFIELDS => $body
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception("Error de Drive: " . $response);
    }

    $file = json_decode($response, true);
    $fileId = $file['id'];

    // 6. Hacer público
    $ch = curl_init("https://www.googleapis.com/drive/v3/files/{$fileId}/permissions");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer {$accessToken}",
            "Content-Type: application/json"
        ],
        CURLOPT_POSTFIELDS => json_encode(['role' => 'reader', 'type' => 'anyone'])
    ]);

    curl_exec($ch);
    curl_close($ch);

    // 7. Respuesta
    echo json_encode([
        'success' => true,
        'url' => $file['webContentLink'] ?? $file['webViewLink'],
        'fileId' => $fileId
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>