
import fs from 'fs';
import path from 'path';
import https from 'https';
import readline from 'readline';
import querystring from 'querystring';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Rutas EXACTAS de la estructura paquete_drive
const API_DIR = path.join(ROOT_DIR, 'src', 'components', 'paquete_drive', 'api');
const SECRET_PATH = path.join(API_DIR, 'client_secret.json');
const TOKEN_PATH = path.join(API_DIR, 'drive_token.json');

// Leer JSON
function readJson(filePath) {
    if (!fs.existsSync(filePath)) throw new Error('No encontrado: ' + filePath);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function main() {
    console.log("🔓 --- CONFIGURACIÓN DRIVE (REPLICA EXACTA DE SETUP-DRIVE.PHP) ---");

    // 1. Cargar Credenciales
    let creds;
    try {
        creds = readJson(SECRET_PATH).web;
    } catch (e) {
        console.error("❌ Error cargando client_secret.json:", e.message);
        process.exit(1);
    }

    // URL Oficial permitida por Google (del JSON)
    const REDIRECT_URI = creds.redirect_uris[0];
    console.log(`ℹ️  Redirect URI Restaurada: ${REDIRECT_URI}`);

    // Generar URL (igual que PHP líneas 18-25)
    const params = querystring.stringify({
        client_id: creds.client_id,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/drive.file',
        access_type: 'offline',
        prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    const CODE_FILE = path.join(ROOT_DIR, 'auth_code.txt');

    console.log("\n👇 1. VISITA ESTA URL Y AUTORIZA (Usa Ctrl+Click o copiala):");
    console.log("-------------------------------------------------------");
    console.log(authUrl);
    console.log("-------------------------------------------------------");

    console.log("\n👇 2. PROCESO DE AUTORIZACIÓN:");
    console.log("   a) Ve al link de arriba y autoriza.");
    console.log("   b) Te redirigirá a una página (posiblemente con error).");
    console.log("   c) COPIA TODA LA URL DE LA BARRA DE DIRECCIONES.");
    console.log("   d) Pégala en el archivo:", CODE_FILE);
    console.log("      (Puede ser la URL entera o solo el código, yo lo detectaré).");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("\n⌨️  Presiona ENTER cuando hayas guardado la URL/Código en el archivo...");

    rl.question('', async () => {
        rl.close();

        if (!fs.existsSync(CODE_FILE)) {
            console.log("❌ No encontré el archivo auth_code.txt");
            return;
        }

        let rawCode = fs.readFileSync(CODE_FILE, 'utf8').trim();
        if (rawCode.length < 10) {
            console.log("❌ El archivo auth_code.txt parece vacío o tiene un código muy corto.");
            return;
        }

        // Limpieza agresiva de código
        let authCode = rawCode;
        if (authCode.includes('code=')) {
            authCode = authCode.split('code=')[1];
        }
        if (authCode.includes('&')) {
            authCode = authCode.split('&')[0];
        }
        authCode = decodeURIComponent(authCode); // Decodificar %2F a /
        authCode = authCode.replace(/\s/g, ''); // Quitar espacios

        console.log(`\n📄 Código leído del archivo: ${authCode.substring(0, 10)}...${authCode.substring(authCode.length - 10)}`);
        console.log(`ℹ️  Usando Redirect URI para canje: ${REDIRECT_URI}`);
        console.log("\n🔄 Solicitando token a Google...");

        // Intercambio
        const postData = querystring.stringify({
            code: authCode,
            client_id: creds.client_id,
            client_secret: creds.client_secret,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
        });

        try {
            const token = await doPost(postData);

            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
            console.log(`\n✅ ¡ÉXITO TOTAL! Token guardado en: ${TOKEN_PATH}`);
            console.log("\n📂 Borrando archivo temporal auth_code.txt...");
            try { fs.unlinkSync(CODE_FILE); } catch (e) { }

        } catch (err) {
            console.error("\n❌ Error Google API:", err.message);
            console.log("💡 Pista: Si dice 'redirect_uri_mismatch', es que el link de origen no coincide con el de canje.");
            console.log("💡 Pista: Si dice 'invalid_grant' o 'Bad Request', el código expiró, ya se usó, o está mal copiado.");
        }
    });
}

function doPost(postData) {
    return new Promise((resolve, reject) => {
        const req = https.request('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const response = JSON.parse(body);
                if (res.statusCode >= 200 && res.statusCode < 300 && !response.error) {
                    resolve(response);
                } else {
                    reject(new Error(response.error_description || JSON.stringify(response)));
                }
            });
        });
        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

main();
