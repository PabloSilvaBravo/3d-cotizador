
import fs from 'fs';
import path from 'path';
import https from 'https';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Rutas
const SECRET_PATH = path.join(ROOT_DIR, 'src', 'components', 'paquete_drive', 'api', 'client_secret.json');
const TOKEN_PATH = path.join(ROOT_DIR, 'drive_token.json');

// Helper leer JSON
function readJson(filePath) {
    if (!fs.existsSync(filePath)) throw new Error('No encontrado: ' + filePath);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function main() {
    console.log("🔓 --- AUTORIZACIÓN MANUAL GOOGLE DRIVE (NODE.JS) ---");

    // 1. Cargar Secretos
    let creds;
    try {
        creds = readJson(SECRET_PATH).web;
        console.log("✅ Credenciales cargadas.");
    } catch (e) {
        console.error("❌ Error cargando client_secret.json:", e.message);
        process.exit(1);
    }

    const SCOPES = [
        'https://www.googleapis.com/auth/drive.file'
    ];
    // Usamos el redirect URI registrado en el JSON. 
    // Si hay varios, usamos el primero que parece ser de producción o el que el usuario haya configurado.
    const REDIRECT_URI = creds.redirect_uris[0];
    console.log(`ℹ️  Usando Redirect URI: ${REDIRECT_URI}`);

    // 2. Generar URL
    const authUrl = `${creds.auth_uri}?response_type=code&client_id=${creds.client_id}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}&access_type=offline&prompt=consent`;

    console.log("\n👇 1. VISITA ESTA URL EN TU NAVEGADOR:");
    console.log("-------------------------------------------------------");
    console.log(authUrl);
    console.log("-------------------------------------------------------");
    console.log("\n👇 2. Autores y espera a ser redirigido.");
    console.log("      (Puede que la página de destino de error 404, no importa).");
    console.log("\n👇 3. COPIA EL CÓDIGO de la barra de direcciones.");
    console.log("      Busca donde dice '?code=4/0A...' y copia todo el código hasta el '&' (si lo hay).");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('\n🔑 PEGA EL CÓDIGO AQUÍ: ', async (code) => {
        const authCode = decodeURIComponent(code.trim());
        rl.close();

        if (!authCode) {
            console.log("❌ Código vacío.");
            return;
        }

        console.log("\n🔄 Canjeando código por tokens...");

        try {
            const tokens = await exchangeCode(authCode, creds.client_id, creds.client_secret, REDIRECT_URI);

            // Tokens contiene access_token, refresh_token, etc.
            // Calcular fecha expiración absoluta
            tokens.expires_at = Math.floor(Date.now() / 1000) + tokens.expires_in;

            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
            console.log(`\n✅ ¡LISTO! Token guardado en: ${TOKEN_PATH}`);
            console.log("   Ahora el servidor puede subir archivos a Drive.");

        } catch (err) {
            console.error("\n❌ Error canjeando token:", err.message);
        }
    });
}

function exchangeCode(code, clientId, clientSecret, redirectUri) {
    const postData = JSON.stringify({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
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
                    reject(new Error(response.error_description || response.error));
                } else {
                    resolve(response);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

main();
