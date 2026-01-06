
const EMAIL_API_URL = 'https://dashboard.mechatronicstore.cl/api/email/send.php';

/**
 * Envía un correo electrónico a través de la API centralizada del Dashboard
 * @param {Object} options - Opciones del correo
 * @param {string} options.to - Email destinatario (requerido)
 * @param {string} options.subject - Asunto del correo (requerido)
 * @param {string} options.body - Contenido HTML del correo (requerido)
 * @param {string} [options.cc] - Copia (opcional)
 * @param {string} [options.bcc] - Copia oculta (opcional)
 * @param {string} [options.replyTo] - Responder a (opcional)
 * @param {Array} [options.attachments] - Array de adjuntos [{fileName, base64, mimeType}]
 * @returns {Promise<{success: boolean, message: string, messageId?: string, error?: string}>}
 */
export async function enviarCorreo({ to, subject, body, cc, bcc, replyTo, attachments }) {
    try {
        // Usamos 'no-cors' para enviar la petición sin esperar confirmación legible (Bypass CORS)
        // Esto enviará los datos pero la respuesta será "opaca" (no podemos leer el JSON de respuesta)
        await fetch(EMAIL_API_URL, {
            method: 'POST',
            mode: 'no-cors',
            // Sin Content-Type explícito para ser Simple Request
            body: JSON.stringify({
                to,
                subject,
                body,
                ...(cc && { cc }),
                ...(bcc && { bcc }),
                ...(replyTo && { replyTo }),
                ...(attachments && attachments.length > 0 && { attachments }),
            }),
        });

        // Al usar no-cors, no podemos leer response.ok ni response.json().
        // Asumimos éxito si no hubo error de red.
        console.log('Correo enviado en modo no-cors (respuesta opaca)');
        return { success: true, message: 'Correo enviado (sin confirmación de servidor)' };

    } catch (error) {
        console.error('Error enviando correo:', error);
        return {
            success: false,
            error: error.message || 'Error de conexión',
        };
    }
}

