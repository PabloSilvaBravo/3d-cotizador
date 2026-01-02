// src/services/driveService.js
// API de Google Drive via dashboard.mechatronicstore.cl

const API_URL = "https://dashboard.mechatronicstore.cl/api/3d/upload-to-drive.php";

/**
 * Convierte un File/Blob a Base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Sube un archivo a Google Drive
 * @param {File|Blob} file - Archivo a subir
 * @param {string} fileName - Nombre del archivo (opcional)
 * @returns {Promise<string>} URL pública del archivo en Drive
 */
export async function uploadToDrive(file, fileName = null) {
    console.log("Subiendo archivo a Drive...", API_URL);

    try {
        const base64Data = await fileToBase64(file);

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Bianca",
                "X-User-Agent": "Bianca" // Fallback para firewalls si el navegador bloquea el estándar
            },
            body: JSON.stringify({
                fileName: fileName || file.name || "archivo_" + new Date().getTime(),
                base64: base64Data,
                mimeType: file.type || "application/octet-stream"
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Error al subir archivo");
        }

        console.log("Archivo subido a Drive:", data.url);
        return data.url;
    } catch (error) {
        console.error("Error subiendo a Drive:", error);
        throw error;
    }
}

export default { uploadToDrive };
