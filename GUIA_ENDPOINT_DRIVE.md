# Guía de Endpoint para Subir Archivos a Google Drive

Este documento contiene todo lo necesario para desplegar un **Endpoint PHP** que permite recibir archivos desde cualquier otro proyecto (Frontend, App Móvil, otro Backend) y subirlos automáticamente a una carpeta de Google Drive.

## 📁 Estructura de Archivos

Necesitarás crear una carpeta (ej: `/api`) en tu servidor con los siguientes archivos:

1. `client_secret.json` (Tus credenciales de Google Console)
2. `setup-drive.php` (Script de configuración de una sola vez)
3. `upload-to-drive.php` (El endpoint público)
4. `drive_token.json` (Se genera automáticamente tras el setup)

---

## 1. Configuración Inicial (`setup-drive.php`)

Este script se ejecuta **una sola vez** para autorizar la aplicación y obtener el "Refresh Token" que permitirá subir archivos permanentemente sin volver a loguearse.

Crea el archivo `setup-drive.php` con este código:

```php
<?php
/**
 * Setup Google Drive OAuth - Ejecutar una vez para generar el token
 */
session_start();

// Cargar credenciales desde el archivo descargado de Google Cloud Console
$credentials = json_decode(file_get_contents(__DIR__ . '/client_secret.json'), true);
$clientId = $credentials['web']['client_id'];
$clientSecret = $credentials['web']['client_secret'];
$redirectUri = $credentials['web']['redirect_uris'][0];

// Paso 1: Mostrar link de autorización si no hay código
if (!isset($_GET['code'])) {
    $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
        'client_id' => $clientId,
        'redirect_uri' => $redirectUri,
        'response_type' => 'code',
        'scope' => 'https://www.googleapis.com/auth/drive.file', // Permiso solo para gestionar archivos creados por la app
        'access_type' => 'offline', // Importante para obtener Refresh Token
        'prompt' => 'consent'
    ]);
    
    echo "<h1>Configuración Drive</h1>";
    echo "<a href='{$authUrl}'>CLICK AQUÍ PARA VINCULAR CUENTA GOOGLE</a>";
    exit;
}

// Paso 2: Intercambiar código por tokens
$ch = curl_init('https://oauth2.googleapis.com/token');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POSTFIELDS => http_build_query([
        'code' => $_GET['code'],
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'redirect_uri' => $redirectUri,
        'grant_type' => 'authorization_code'
    ])
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    // Guardar token en archivo
    file_put_contents(__DIR__ . '/drive_token.json', $response);
    echo "✅ <b>Token guardado correctamente.</b> Ya puedes usar el endpoint de subida.";
} else {
    echo "❌ Error al obtener token: " . $response;
}
?>
```

---

## 2. El Endpoint de Subida (`upload-to-drive.php`)

Este es el archivo al que llamarás desde tus otros proyectos. Recibe el archivo en `Base64` y JSON.

Crea `upload-to-drive.php`:

```php
<?php
/**
 * Endpoint para subir archivos a Google Drive
 * Método: POST
 * Body JSON: { "fileName": "...", "base64": "...", "mimeType": "..." }
 */

// Headers CORS para permitir llamadas desde otros dominios (proyectos)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

// Manejo de preflight request (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // 1. Leer datos de entrada
    $input = json_decode(file_get_contents('php://input'), true);
    $fileName = $input['fileName'] ?? 'archivo_sin_nombre';
    $base64Data = $input['base64'] ?? '';
    $mimeType = $input['mimeType'] ?? 'application/octet-stream';

    if (empty($base64Data)) throw new Exception("Falta el contenido base64");

    // 2. Cargar token
    $tokenPath = __DIR__ . '/drive_token.json';
    if (!file_exists($tokenPath)) throw new Exception("Token no configurado.");

    $tokenData = json_decode(file_get_contents($tokenPath), true);
    $accessToken = $tokenData['access_token'];

    // 3. Renovar token si ha expirado (usando Refresh Token)
    if (isset($tokenData['expires_in']) && time() > ($tokenData['created'] ?? 0) + $tokenData['expires_in']) {
        $creds = json_decode(file_get_contents(__DIR__ . '/client_secret.json'), true);
        
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'client_id' => $creds['web']['client_id'],
                'client_secret' => $creds['web']['client_secret'],
                'refresh_token' => $tokenData['refresh_token'],
                'grant_type' => 'refresh_token'
            ])
        ]);
        
        $newTokenResponse = curl_exec($ch);
        curl_close($ch);
        
        $newToken = json_decode($newTokenResponse, true);
        if (isset($newToken['access_token'])) {
            $newToken['refresh_token'] = $tokenData['refresh_token']; // Mantener el refresh token original
            $newToken['created'] = time();
            file_put_contents($tokenPath, json_encode($newToken));
            $accessToken = $newToken['access_token'];
        }
    }

    // 4. Preparar contenido del archivo
    // Remover header de base64 si existe (ej: "data:image/png;base64,")
    if (strpos($base64Data, ',') !== false) {
        $base64Data = explode(',', $base64Data)[1];
    }
    $fileContent = base64_decode($base64Data);

    // 5. Configurar Metadata y Carpeta Destino
    // IMPORTANTE: Cambia este ID por el ID de tu carpeta en Google Drive
    $folderId = '1elmlygqWUQxGvGWRgWKDAomwOUWEXTVE'; 
    
    $metadata = json_encode([
        'name' => $fileName,
        'parents' => [$folderId]
    ]);

    $boundary = 'b_boundary';
    $body = "--{$boundary}\r\n" .
            "Content-Type: application/json; charset=UTF-8\r\n\r\n" .
            "{$metadata}\r\n" .
            "--{$boundary}\r\n" .
            "Content-Type: {$mimeType}\r\n\r\n" .
            "{$fileContent}\r\n" .
            "--{$boundary}--";

    // 6. Subir a Google Drive API
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

    if ($httpCode !== 200) throw new Exception("Error Drive: " . $response);

    // 7. Retornar Éxito
    $driveFile = json_decode($response, true);
    
    // Opcional: Hacer archivo público automáticamente (descomentar si necesario)
    /*
    $permCh = curl_init("https://www.googleapis.com/drive/v3/files/{$driveFile['id']}/permissions");
    curl_setopt_array($permCh, [
        CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer {$accessToken}", "Content-Type: application/json"],
        CURLOPT_POSTFIELDS => json_encode(['role' => 'reader', 'type' => 'anyone'])
    ]);
    curl_exec($permCh); curl_close($permCh);
    */

    echo json_encode([
        'success' => true,
        'message' => 'Archivo subido correctamente',
        'fileId' => $driveFile['id'],
        'link' => $driveFile['webViewLink'] ?? ''
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
```

---

## 3. Ejemplo de Uso (Frontend / JS)

Para usar este endpoint desde cualquier proyecto JavaScript (React, Vue, Vanilla, etc.), usa esta función:

```javascript
/**
 * Sube un archivo al endpoint PHP de Drive
 * @param {File} file - El objeto File del input input[type="file"]
 */
async function uploadFileToDrive(file) {
    const API_URL = 'https://tudominio.com/api/upload-to-drive.php'; // 👈 Tu URL aquí

    // 1. Convertir archivo a Base64
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    try {
        const base64String = await toBase64(file);
        
        console.log("Subiendo archivo...");
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileName: file.name,
                mimeType: file.type,
                base64: base64String
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log("✅ Exito:", result.link);
            alert("Archivo subido: " + result.link);
        } else {
            console.error("❌ Error:", result.error);
        }

    } catch (error) {
        console.error("❌ Error de red:", error);
    }
}
```

### Tips
- Asegúrate de que la carpeta de destino en Drive tenga permisos suficientes si quieres compartir los links públicamente (o gestiona los permisos en el script PHP).
- El límite de tamaño de subida dependerá de la configuración `upload_max_filesize` y `post_max_size` de tu servidor PHP.
