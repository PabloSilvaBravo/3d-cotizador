
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
        const response = await fetch(EMAIL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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

