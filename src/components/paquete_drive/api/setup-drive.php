<?php
/**
 * Setup Google Drive OAuth - Versión REST API Pura
 * 
 * No requiere Composer ni librerías externas, solo cURL (incluido en PHP)
 */

session_start();

// Cargar credenciales
$credentials = json_decode(file_get_contents(__DIR__ . '/client_secret.json'), true);
$clientId = $credentials['web']['client_id'];
$clientSecret = $credentials['web']['client_secret'];
$redirectUri = $credentials['web']['redirect_uris'][0];

// Paso 1: Mostrar link de autorización
if (!isset($_GET['code'])) {
    $authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
        'client_id' => $clientId,
        'redirect_uri' => $redirectUri,
        'response_type' => 'code',
        'scope' => 'https://www.googleapis.com/auth/drive.file',
        'access_type' => 'offline',
        'prompt' => 'consent'
    ]);
    ?>
    <!DOCTYPE html>
    <html lang="es">

    <head>
        <meta charset="UTF-8">
        <title>Setup Google Drive</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
            }

            .container {
                background: #f5f5f5;
                padding: 30px;
                border-radius: 8px;
            }

            h2 {
                color: #791ad9;
            }

            .button {
                display: inline-block;
                background: #791ad9;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
            }

            .button:hover {
                background: #5f0db0;
            }
        </style>
    </head>

    <body>
        <div class="container">
            <h2>🔧 Configuración Google Drive</h2>
            <p>Haz clic para autorizar el acceso a Drive:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="<?php echo htmlspecialchars($authUrl); ?>" class="button">
                    📥 CONECTAR CON GOOGLE DRIVE
                </a>
            </p>
        </div>
    </body>

    </html>
    <?php
    exit;
}

// Paso 2: Intercambiar código por token
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
    $token = json_decode($response, true);
    file_put_contents(__DIR__ . '/drive_token.json', json_encode($token));
    chmod(__DIR__ . '/drive_token.json', 0600);

    echo "<h2>✅ ¡Configuración Exitosa!</h2>";
    echo "<p>Token guardado. Ya puedes usar el sistema.</p>";
    echo "<p><a href='test-drive.php'>Probar ahora</a></p>";
} else {
    echo "<h2>❌ Error</h2>";
    echo "<pre>" . htmlspecialchars($response) . "</pre>";
}
?>