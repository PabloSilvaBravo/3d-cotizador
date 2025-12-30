
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// RUTAS
const ROOT_DIR = path.resolve(__dirname, '..');
const SECRET_PATH = path.join(ROOT_DIR, 'src', 'components', 'paquete_drive', 'api', 'client_secret.json');
const TOKEN_PATH = path.join(ROOT_DIR, 'drive_token.json');

// ID Carpeta Destino (Hardcoded según solicitud del usuario)
const DRIVE_FOLDER_ID = '16w8o5wnUondpBZ0MW8jQeGiGroA2WQAW';

// Helper para leer JSON seguro
function readJson(filePath) {
    if (!fs.existsSync(filePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        console.error(`Error leyendo JSON ${filePath}:`, e);
        return null;
    }
}

// 1. Obtener Credenciales
function getCredentials() {
    const data = readJson(SECRET_PATH);
    if (!data || !data.web) {
        throw new Error('No se encontró client_secret.json o es inválido en ' + SECRET_PATH);
    }
    return data.web;
}

// 2. Obtener / Refrescar Token
async function getAccessToken() {
    const creds = getCredentials();
    let tokenData = readJson(TOKEN_PATH);

    if (!tokenData) {
        throw new Error('No existe drive_token.json. Debes ejecutar el script de autorización primero.');
    }

    // Verificar expiración (con margen de 60s)
    const now = Math.floor(Date.now() / 1000);
    if (tokenData.expires_at && now < (tokenData.expires_at - 60)) {
        return tokenData.access_token;
    }

    console.log('🔄 Token expirado. Refrescando...');

    // Refrescar
    const postData = JSON.stringify({
        client_id: creds.client_id,
        client_secret: creds.client_secret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token'
    });

    return new Promise((resolve, reject) => {
        const req = https.request('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const response = JSON.parse(body);
                if (response.error) {
                    return reject(new Error('Error refrescando token: ' + JSON.stringify(response)));
                }

                // Guardar nuevo token
                // Mantener refresh_token antiguo si no viene uno nuevo
                const newTokenData = {
                    access_token: response.access_token,
                    refresh_token: response.refresh_token || tokenData.refresh_token,
                    expires_in: response.expires_in,
                    expires_at: Math.floor(Date.now() / 1000) + response.expires_in,
                    scope: response.scope,
                    token_type: response.token_type
                };

                fs.writeFileSync(TOKEN_PATH, JSON.stringify(newTokenData, null, 2));
                console.log('✅ Token refrescado exitosamente.');
                resolve(newTokenData.access_token);
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

// 3. Subir Archivo (Multipart)
export async function uploadFileToDrive(filePath, originalName, mimeType) {
    const accessToken = await getAccessToken();

    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    console.log(`📤 Iniciando subida a Drive: ${originalName} (${fileSize} bytes)`);

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
        name: originalName,
        parents: [DRIVE_FOLDER_ID]
    };

    // Construir multipart body (Header y Metadata)
    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + mimeType + '\r\n' +
        'Content-Transfer-Encoding: binary\r\n' +
        '\r\n';

    // Nota: En Node.js puro con https.request y stream de archivo,
    // es mejor enviar los chunks. Pero para simplificar y dado que tenemos 'multipart',
    // podemos enviar todo si cabe en memoria, O hacer streaming complejo.
    // Dado el límite de 100MB, streaming es mejor, pero más difícil de codear a mano sin 'form-data'.
    // Usaré un enfoque híbrido: Escribir header -> Pipe archivo -> Escribir footer.

    return new Promise((resolve, reject) => {
        const req = https.request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const fileData = JSON.parse(body);
                    console.log('✅ Subida completada. ID:', fileData.id);
                    // Hacer público el archivo para que ventas pueda verlo sin pedir acceso
                    makeFilePublic(fileData.id, accessToken).then(() => {
                        resolve(fileData);
                    }).catch(err => {
                        console.warn('⚠️ No se pudo hacer público el archivo:', err.message);
                        resolve(fileData); // Retornar igual, aunque sea privado
                    });
                } else {
                    console.error('❌ Error Drive API:', body);
                    reject(new Error(`Drive API Error (${res.statusCode}): ${body}`));
                }
            });
        });

        req.on('error', (e) => reject(e));

        // Enviar Multipart
        req.write(multipartRequestBody);

        const fileStream = fs.createReadStream(filePath);
        fileStream.on('error', err => reject(err));

        fileStream.pipe(req, { end: false });

        fileStream.on('end', () => {
            req.write(close_delim);
            req.end();
        });
    });
}

// Hacer archivo Público (Reader)
async function makeFilePublic(fileId, accessToken) {
    const postData = JSON.stringify({
        role: 'reader',
        type: 'anyone'
    });

    return new Promise((resolve, reject) => {
        const req = https.request(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve();
            } else {
                reject(new Error('Status ' + res.statusCode));
            }
        });
        req.write(postData);
        req.end();
    });
}
