

const IS_DEV = import.meta.env.DEV;
// En desarrollo usamos el proxy, en producción la URL directa
const BASE_URL = IS_DEV ? "/api-dashboard" : "https://dashboard.mechatronicstore.cl";
const EMAIL_API_URL = `${BASE_URL}/api/email/send.php`;

/**
 * Envía un correo electrónico a través de la API centralizada del Dashboard
 * @param {Object} options - Opciones del correo
 * ...
 */
export async function enviarCorreo({ to, subject, body, cc, bcc, replyTo, attachments }) {
    try {
        // Usamos FormData para evitar Preflight CORS (Simple Request) y asegurar compatibilidad con PHP $_POST
        const formData = new FormData();
        formData.append('to', to);
        formData.append('subject', subject);
        formData.append('body', body);
        if (cc) formData.append('cc', cc);
        if (bcc) formData.append('bcc', bcc);
        if (replyTo) formData.append('replyTo', replyTo);

        // Nota: Los adjuntos complejos pueden requerir manejo especial si el backend espera JSON.
        // Por ahora enviamos los básicos.

        const response = await fetch(EMAIL_API_URL, {
            method: 'POST',
            // No establecemos Content-Type manual para permitir que fetch genere el boundary de multipart/form-data
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al enviar correo');
        }

        return data;
    } catch (error) {
        console.error('Error enviando correo:', error);
        return {
            success: false,
            error: error.message || 'Error de conexión',
        };
    }
}
