
import { uploadFileToDrive } from '../backend/driveManager.js';
import fs from 'fs';

const dummyPath = './test_drive_upload.txt';

async function runTest() {
    console.log("🚀 --- TEST DE CONEXIÓN GOOGLE DRIVE ---");

    // 1. Crear archivo temporal
    fs.writeFileSync(dummyPath, `Prueba de subida MechatronicStore B2B - ${new Date().toISOString()}`);
    console.log("📄 Archivo temporal creado.");

    try {
        // 2. Intentar subir
        console.log("📤 Intentando subir a Drive...");
        const result = await uploadFileToDrive(dummyPath, 'Test_Conexion_' + Date.now() + '.txt', 'text/plain');

        console.log("\n✅ ¡PRUEBA EXITOSA!");
        console.log("-----------------------------------------");
        console.log("📂 Archivo subido correctamente.");
        console.log("🔗 Link:", result.webViewLink);
        console.log("🆔 ID:", result.id);
        console.log("-----------------------------------------");

    } catch (error) {
        console.error("\n❌ LA PRUEBA FALLÓ:");
        console.error("Error:", error.message);

        if (error.message.includes('drive_token.json') || error.message.includes('No existe')) {
            console.log("\n⚠️  CAUSA PROBABLE: No has autorizado la aplicación aún.");
            console.log("👉 EJECUTA: node scripts/auth_drive_manual.js");
            console.log("   Sigue las instrucciones en pantalla para obtener el token.");
        }
    } finally {
        // 3. Limpieza
        if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
    }
}

runTest();
