
const API_BASE = `http://${window.location.hostname}:3001`;

export async function uploadToDrive(file) {
    const formData = new FormData();
    formData.append('file', file);

    console.log("📤 Subiendo archivo a Drive...");

    try {
        const response = await fetch(`${API_BASE}/api/upload-drive`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al subir arcivo');
        }

        console.log("✅ Archivo subido a Drive:", data.driveUrl);
        return data.driveUrl;
    } catch (error) {
        console.error("❌ Error subiendo a Drive:", error);
        throw error; // Propagar para manejar en UI
    }
}
