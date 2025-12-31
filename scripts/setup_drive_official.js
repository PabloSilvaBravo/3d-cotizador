
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Rutas 
const API_DIR = path.join(ROOT_DIR, 'src', 'components', 'paquete_drive', 'api');
const SECRET_PATH = path.join(API_DIR, 'client_secret.json');
const TOKEN_PATH = path.join(API_DIR, 'drive_token.json');
const CODE_FILE = path.join(ROOT_DIR, 'auth_code.txt');

async function main() {
    console.log("🔓 --- SETUP DRIVE (LIBRERÍA OFICIAL GOOGLEAPIS) ---");

    // 1. Cargar credenciales
    if (!fs.existsSync(SECRET_PATH)) {
        console.error("❌ No existe:", SECRET_PATH);
        return;
    }
    const content = fs.readFileSync(SECRET_PATH);
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;

    // 2. Crear Cliente OAuth2
    // Usamos la primera redirect URI registrada
    const redirectUri = key.redirect_uris[0];
    console.log(`ℹ️  Usando Redirect URI: ${redirectUri}`);

    const oAuth2Client = new google.auth.OAuth2(
        key.client_id,
        key.client_secret,
        redirectUri
    );

    // 3. Generar URL de Auth
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file'],
        prompt: 'consent' // Para forzar refresh_token
    });

    console.log("\n👇 1. VISITA ESTA URL Y AUTORIZA:");
    console.log("-----------------------------------");
    console.log(authUrl);
    console.log("-----------------------------------");

    console.log("\n👇 2. COPIA LA URL FINAL COMPLETA (con el ?code=...) Y PÉGALA EN:");
    console.log(`      ${CODE_FILE}`);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("\n⌨️  Presiona ENTER cuando hayas guardado la URL en el archivo...");

    rl.question('', async () => {
        rl.close();

        if (!fs.existsSync(CODE_FILE)) {
            console.error("❌ No encuentro auth_code.txt");
            return;
        }

        let code = fs.readFileSync(CODE_FILE, 'utf8').trim();

        // Limpieza de código o extracción de URL
        if (code.includes('code=')) {
            try {
                const urlObj = new URL(code);
                code = urlObj.searchParams.get('code');
            } catch (e) {
                // Si no es URL válida, quizas es partial string
                code = code.split('code=')[1].split('&')[0];
            }
        }
        code = decodeURIComponent(code);

        console.log(`\n🔄 Canjeando código (${code.substring(0, 10)}...)...`);

        try {
            const { tokens } = await oAuth2Client.getToken(code);

            // Guardar token
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
            console.log(`\n✅ ¡ÉXITO! Token guardado en: ${TOKEN_PATH}`);

            // Limpiar
            try { fs.unlinkSync(CODE_FILE); } catch (e) { }

        } catch (error) {
            console.error('\n❌ Error recuperando access token:', error.message);
            if (error.response) {
                console.error('   Detalles:', error.response.data);
            }
        }
    });
}

main();
