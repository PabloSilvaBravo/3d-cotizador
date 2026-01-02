
import fs from 'fs';
import https from 'https';

// Servidor PHP con scripts de paquete_drive (ahora en /api/ como en empresas)
const REMOTE_PHP_URL = 'https://3d.mechatronicstore.cl/api/upload-to-drive.php';

export async function uploadFileToDrive(filePath, originalName, mimeType) {
    console.log(`📤 Enviando archivo al Backend PHP Remoto: ${originalName}`);

    // 1. Leer archivo y convertir a Base64
    const fileBuffer = fs.readFileSync(filePath);
    const base64Data = fileBuffer.toString('base64');

    // 2. Preparar payload conforme espera upload-to-drive.php
    // IMPORTANTE: El backend PHP espera { fileName, base64, mimeType }
    const payload = JSON.stringify({
        fileName: originalName,
        mimeType: mimeType,
        base64: base64Data
    });

    // 3. Enviar Request
    return new Promise((resolve, reject) => {
        const req = https.request(REMOTE_PHP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const response = JSON.parse(body);

                        if (response.success || response.webViewLink || response.link) {
                            const link = response.link || response.url || response.webViewLink;
                            console.log('✅ PHP Remoto respondió éxito. Link:', link);

                            resolve({
                                id: response.fileId || response.id,
                                webViewLink: link,
                                name: originalName
                            });
                        } else {
                            // Si PHP devuelve {success: false, error...}
                            reject(new Error('PHP Error: ' + (response.error || JSON.stringify(response))));
                        }
                    } catch (e) {
                        // A veces el PHP devuelve HTML de error si falla catastróficamente
                        reject(new Error('Respuesta inválida del PHP (posible error 500/404): ' + body.substring(0, 100)));
                    }
                } else {
                    reject(new Error(`PHP HTTP Error ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(payload);
        req.end();
    });
}
