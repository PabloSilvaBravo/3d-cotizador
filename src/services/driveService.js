// src/services/driveService.js
// API de Google Drive via dashboard.mechatronicstore.cl

// Detectar si estamos en desarrollo (localhost)
const IS_DEV = import.meta.env.DEV;

// En desarrollo usamos el proxy de Vite (/api-dashboard) para evitar CORS
// En producción usamos la URL directa
const BASE_URL = IS_DEV ? "/api-dashboard" : "https://dashboard.mechatronicstore.cl";
const API_URL = `${BASE_URL}/api/3d/upload-to-drive.php`;

// ID de la carpeta de Google Drive donde se guardan los archivos
// Puedes cambiarlo aquí sin tocar el backend
const DRIVE_FOLDER_ID = "16w8o5wnUondpBZ0MW8jQeGiGroA2WQAW";

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
 * @param {string} folderId - ID carpeta Drive (opcional, usa DRIVE_FOLDER_ID por defecto)
 * @returns {Promise<string>} URL pública del archivo en Drive
 */
export async function uploadToDrive(file, fileName = null, folderId = null) {
    console.log("Subiendo archivo a Drive...");

    try {
        const base64Data = await fileToBase64(file);

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Bianca",      // Mantenido para bypass firewall
                "X-User-Agent": "Bianca"     // Mantenido para bypass firewall
            },
            body: JSON.stringify({
                fileName: fileName || file.name || "archivo_" + new Date().getTime(),
                base64: base64Data,
                mimeType: file.type || "application/octet-stream",
                folderId: folderId || DRIVE_FOLDER_ID
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
