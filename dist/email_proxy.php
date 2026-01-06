<?php
/**
 * PROXY DE CORREO - SOLUCIÓN CORS
 * 
 * Este script actúa como intermediario entre el frontend (3d.mechatronicstore.cl)
 * y el backend (dashboard.mechatronicstore.cl) para evitar el bloqueo CORS del navegador.
 * 
 * Uso: Cambiar la URL en emailService.js para apuntar a este archivo (/email_proxy.php)
 */

// Permitir peticiones desde cualquier origen (este script vive en el mismo dominio)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// URL del API real
$targetUrl = 'https://dashboard.mechatronicstore.cl/api/email/send.php';

// Obtener datos enviados al proxy
$input = file_get_contents('php://input');

// Iniciar cURL
$ch = curl_init($targetUrl);

curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Content-Type: application/json',
    'Content-Length: ' . strlen($input)
));
// Opcional: Si el dashboard usa HTTPS autofirmado o problemático
// curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);

curl_close($ch);

if ($response === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Proxy Error: ' . $curlError]);
} else {
    http_response_code($httpCode);
    echo $response;
}
?>
