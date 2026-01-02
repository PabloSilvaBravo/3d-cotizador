# Guía Completa: Envío de Correos desde Empresas

> **Proyecto:** 3d.mechatronicstore.cl (Cotizador 3D)
> **Audiencia:** Bianca y futuros desarrolladores
> **Última actualización:** 2025-12-11

---

## Índice

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Arquitectura](#arquitectura)
3. [Configuración Inicial](#configuración-inicial)
4. [Uso Básico](#uso-básico)
5. [Ejemplos Completos](#ejemplos-completos)
6. [Manejo de Errores](#manejo-de-errores)
7. [Casos de Uso Comunes](#casos-de-uso-comunes)
8. [Troubleshooting](#troubleshooting)
9. [Referencia API](#referencia-api)

---

## Resumen del Sistema

El proyecto **Empresas** utiliza una API centralizada de correos alojada en el Dashboard. Esta arquitectura permite:

- ✅ Enviar correos desde cualquier frontend (React, Vue, etc.)
- ✅ No necesitar configurar SMTP en cada proyecto
- ✅ Usar Gmail con OAuth 2.0 (más seguro que contraseñas)
- ✅ Renovación automática de tokens
- ✅ CORS ya configurado para 3d.mechatronicstore.cl

**Correo de envío:** `mechatronicstore.cl@gmail.com`
**Nombre mostrado:** "MechatronicStore Empresas"

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    EMPRESAS (React)                         │
│               3d.mechatronicstore.cl                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ fetch() POST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD (PHP)                          │
│            dashboard.mechatronicstore.cl                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              /api/email/send.php                     │   │
│  │  - Valida parámetros                                │   │
│  │  - Obtiene access_token (renueva si expiró)         │   │
│  │  - Construye mensaje RFC 2822                       │   │
│  │  - Envía via Gmail API                              │   │
│  └─────────────────────────┬───────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GMAIL API                                │
│              gmail.googleapis.com                           │
│                                                             │
│  POST /gmail/v1/users/me/messages/send                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuración Inicial

### Para Desarrollo Local

No se requiere configuración adicional. El CORS ya está habilitado para:

- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (Create React App)

### Para Producción

El dominio `https://3d.mechatronicstore.cl` está autorizado en CORS.

Si necesitas agregar otro dominio, contacta a Pablo para actualizar `/api/email/config.php`.

---

## Uso Básico

### Función Helper Recomendada

Crea un archivo `src/services/email.js` (o `.ts` para TypeScript):

```javascript
// src/services/email.js

const EMAIL_API_URL = 'https://dashboard.mechatronicstore.cl/api/email/send.php';

/**
 * Envía un correo electrónico
 * @param {Object} options - Opciones del correo
 * @param {string} options.to - Email destinatario (requerido)
 * @param {string} options.subject - Asunto del correo (requerido)
 * @param {string} options.body - Contenido HTML del correo (requerido)
 * @param {string} [options.cc] - Copia (opcional)
 * @param {string} [options.bcc] - Copia oculta (opcional)
 * @param {string} [options.replyTo] - Responder a (opcional)
 * @returns {Promise<{success: boolean, message: string, messageId?: string, error?: string}>}
 */
export async function enviarCorreo({ to, subject, body, cc, bcc, replyTo }) {
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

/**
 * Verifica el estado de la API de correos
 * @returns {Promise<Object>} Estado de la autorización OAuth
 */
export async function verificarEstadoEmail() {
  try {
    const response = await fetch(
      'https://dashboard.mechatronicstore.cl/api/email/status.php'
    );
    return await response.json();
  } catch (error) {
    return { error: 'No se pudo conectar con la API' };
  }
}
```

### Versión TypeScript

```typescript
// src/services/email.ts

const EMAIL_API_URL = 'https://dashboard.mechatronicstore.cl/api/email/send.php';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
}

interface EmailResponse {
  success: boolean;
  message?: string;
  messageId?: string;
  error?: string;
}

export async function enviarCorreo(options: EmailOptions): Promise<EmailResponse> {
  try {
    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    const data: EmailResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al enviar correo');
    }

    return data;
  } catch (error) {
    console.error('Error enviando correo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
```

---

## Ejemplos Completos

### 1. Enviar Cotización Simple

```javascript
import { enviarCorreo } from './services/email';

async function enviarCotizacion(cliente, productos, total) {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #251a3d;">Cotización MechatronicStore</h1>

      <p>Estimado/a <strong>${cliente.nombre}</strong>,</p>

      <p>Adjuntamos la cotización solicitada:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #251a3d; color: white;">
            <th style="padding: 10px; text-align: left;">Producto</th>
            <th style="padding: 10px; text-align: right;">Cantidad</th>
            <th style="padding: 10px; text-align: right;">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${productos.map(p => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px;">${p.nombre}</td>
              <td style="padding: 10px; text-align: right;">${p.cantidad}</td>
              <td style="padding: 10px; text-align: right;">$${p.precio.toLocaleString('es-CL')}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="font-weight: bold; background: #f5f5f5;">
            <td colspan="2" style="padding: 10px;">TOTAL</td>
            <td style="padding: 10px; text-align: right;">$${total.toLocaleString('es-CL')}</td>
          </tr>
        </tfoot>
      </table>

      <p>Esta cotización tiene validez de 7 días.</p>

      <p>Saludos cordiales,<br>
      <strong>MechatronicStore</strong></p>
    </div>
  `;

  const resultado = await enviarCorreo({
    to: cliente.email,
    subject: `Cotización #${Date.now()} - MechatronicStore`,
    body: htmlBody,
    cc: 'mechatronicstore.cl@gmail.com', // Copia para archivo
    replyTo: 'ventas@mechatronicstore.cl', // Respuestas van a ventas
  });

  if (resultado.success) {
    console.log('Cotización enviada, ID:', resultado.messageId);
    return true;
  } else {
    console.error('Error:', resultado.error);
    return false;
  }
}
```

### 2. Componente React: Formulario de Contacto

```jsx
// src/components/FormularioContacto.jsx
import { useState } from 'react';
import { enviarCorreo } from '../services/email';

export function FormularioContacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    empresa: '',
    mensaje: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setResultado(null);

    const htmlBody = `
      <h2>Nuevo mensaje de contacto - Empresas</h2>
      <p><strong>Nombre:</strong> ${formData.nombre}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <p><strong>Empresa:</strong> ${formData.empresa}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${formData.mensaje.replace(/\n/g, '<br>')}</p>
    `;

    const res = await enviarCorreo({
      to: 'mechatronicstore.cl@gmail.com',
      subject: `[Empresas] Contacto de ${formData.nombre} - ${formData.empresa}`,
      body: htmlBody,
      replyTo: formData.email,
    });

    setEnviando(false);
    setResultado(res);

    if (res.success) {
      setFormData({ nombre: '', email: '', empresa: '', mensaje: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nombre"
        value={formData.nombre}
        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />
      <input
        type="text"
        placeholder="Empresa"
        value={formData.empresa}
        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
        required
      />
      <textarea
        placeholder="Mensaje"
        value={formData.mensaje}
        onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
        required
      />

      <button type="submit" disabled={enviando}>
        {enviando ? 'Enviando...' : 'Enviar Mensaje'}
      </button>

      {resultado && (
        <div className={resultado.success ? 'success' : 'error'}>
          {resultado.success
            ? '¡Mensaje enviado correctamente!'
            : `Error: ${resultado.error}`}
        </div>
      )}
    </form>
  );
}
```

### 3. Hook Personalizado para Emails

```javascript
// src/hooks/useEmail.js
import { useState, useCallback } from 'react';
import { enviarCorreo } from '../services/email';

export function useEmail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);

  const send = useCallback(async (options) => {
    setLoading(true);
    setError(null);

    const result = await enviarCorreo(options);

    setLoading(false);

    if (result.success) {
      setLastMessageId(result.messageId);
      return true;
    } else {
      setError(result.error);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setLastMessageId(null);
  }, []);

  return {
    send,
    loading,
    error,
    lastMessageId,
    reset,
  };
}

// Uso:
// const { send, loading, error } = useEmail();
// await send({ to: '...', subject: '...', body: '...' });
```

---

## Manejo de Errores

### Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `"Campo requerido: to"` | Falta el destinatario | Asegúrate de enviar `to` en el body |
| `"Email de destinatario inválido"` | Email mal formateado | Valida el email antes de enviar |
| `"JSON inválido"` | Body malformado | Usa `JSON.stringify()` correctamente |
| `"No hay tokens guardados"` | OAuth no autorizado | Pablo debe re-autorizar (ver abajo) |
| `"Error renovando token"` | Token expirado sin refresh | Pablo debe re-autorizar |
| `CORS error` | Dominio no autorizado | Contacta a Pablo para agregar dominio |

### Validación en Frontend

```javascript
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

async function enviarConValidacion(options) {
  // Validar campos requeridos
  if (!options.to || !options.subject || !options.body) {
    return { success: false, error: 'Faltan campos requeridos' };
  }

  // Validar formato de email
  if (!validarEmail(options.to)) {
    return { success: false, error: 'Email de destinatario inválido' };
  }

  // Validar longitud del asunto
  if (options.subject.length > 200) {
    return { success: false, error: 'Asunto demasiado largo (máx 200 caracteres)' };
  }

  return await enviarCorreo(options);
}
```

---

## Casos de Uso Comunes

### Cotización con PDF (futuro)

> **Nota:** Actualmente la API no soporta adjuntos. Si se necesita, contactar a Pablo para implementar.

### Notificación de Pedido

```javascript
async function notificarPedido(pedido) {
  const productos = pedido.items.map(item => `
    <tr>
      <td>${item.sku}</td>
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>$${item.precio.toLocaleString('es-CL')}</td>
    </tr>
  `).join('');

  await enviarCorreo({
    to: pedido.cliente.email,
    subject: `Pedido #${pedido.id} recibido - MechatronicStore`,
    body: `
      <h1>¡Gracias por tu pedido!</h1>
      <p>Hemos recibido tu pedido #${pedido.id}</p>
      <table>${productos}</table>
      <p><strong>Total: $${pedido.total.toLocaleString('es-CL')}</strong></p>
    `,
    bcc: 'mechatronicstore.cl@gmail.com', // Copia oculta para nosotros
  });
}
```

### Correo de Seguimiento

```javascript
async function enviarSeguimiento(cliente, cotizacionId) {
  await enviarCorreo({
    to: cliente.email,
    subject: `Seguimiento cotización #${cotizacionId}`,
    body: `
      <p>Hola ${cliente.nombre},</p>
      <p>Queremos saber si tienes alguna consulta sobre la cotización enviada.</p>
      <p>Estamos a tu disposición.</p>
      <p>Saludos,<br>MechatronicStore</p>
    `,
    replyTo: 'ventas@mechatronicstore.cl',
  });
}
```

---

## Troubleshooting

### El correo no llega

1. **Revisar spam/promociones** del destinatario
2. **Verificar email correcto** (sin espacios, bien escrito)
3. **Verificar estado API:**
   ```javascript
   const status = await verificarEstadoEmail();
   console.log(status);
   // Debe mostrar: { authorized: true, token_expired: false, ... }
   ```

### Error de CORS

Si ves errores de CORS en la consola:

1. Verifica que estás usando `https://` (no `http://`)
2. Verifica que tu dominio está en la lista permitida
3. Para desarrollo local, usa `localhost:5173` o `localhost:3000`

### Token expirado

Si el API devuelve errores de token, contacta a Pablo para re-autorizar:

1. Pablo visita: https://dashboard.mechatronicstore.cl/api/email/oauth-authorize.php
2. Inicia sesión con `mechatronicstore.cl@gmail.com`
3. Autoriza los permisos

---

## Referencia API

### Endpoint Principal

```
POST https://dashboard.mechatronicstore.cl/api/email/send.php
```

### Headers

```
Content-Type: application/json
```

### Body (JSON)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `to` | string | ✅ | Email del destinatario |
| `subject` | string | ✅ | Asunto del correo |
| `body` | string | ✅ | Contenido HTML del correo |
| `cc` | string | ❌ | Email para copia |
| `bcc` | string | ❌ | Email para copia oculta |
| `replyTo` | string | ❌ | Email para respuestas |

### Respuesta Exitosa (200)

```json
{
  "success": true,
  "message": "Correo enviado exitosamente",
  "messageId": "19b0f15bcac1ea0f"
}
```

### Respuesta Error (400/500)

```json
{
  "success": false,
  "error": "Descripción del error"
}
```

### Verificar Estado

```
GET https://dashboard.mechatronicstore.cl/api/email/status.php
```

Respuesta:
```json
{
  "configured": true,
  "authorized": true,
  "has_access_token": true,
  "has_refresh_token": true,
  "token_expired": false,
  "token_valid_for": "3542 segundos"
}
```

---

## Contacto

Para problemas con la API de correos, contactar a:

- **Pablo Silva** - Administrador del Dashboard
- **Email:** mechatronicstore.cl@gmail.com

---

*Documentación creada: 2025-12-11*
