# Guía de Integración: Subida a Google Drive (PHP Nativo)

Esta guía explica cómo integrar la funcionalidad de subida de archivos a Google Drive en cualquier proyecto PHP, utilizando la API REST pura (sin depender de `composer` ni `google/apiclient`).

## 1. Archivos Necesarios

Para integrar esto en otro proyecto, necesitas copiar los siguientes 3 archivos a una carpeta accesible vía web (ej. `/api/`):

1.  `upload-to-drive.php`: El script principal que recibe el archivo y lo sube.
2.  `setup-drive.php`: Script de única ejecución para autorizar la cuenta y generar el token.
3.  `client_secret.json`: Credenciales de tu proyecto en Google Cloud.

## 2. Obtener Credenciales (client_secret.json)

Si aún no tienes el archivo `client_secret.json`, sigue estos pasos:

1.  Ve a la [Google Cloud Console](https://console.cloud.google.com/).
2.  Crea un nuevo proyecto o selecciona uno existente.
3.  Ve a **APIs y servicios > Biblioteca** y habilita la **Google Drive API**.
4.  Ve a **APIs y servicios > Pantalla de consentimiento de OAuth**:
    *   Tipo: Externo (o Interno si tienes Google Workspace).
    *   Rellena los datos básicos (nombre app, email).
    *   **Imporante**: Agrega tu usuario de Google (gmail) en "Usuarios de prueba" si la app está en modo "Prueba".
5.  Ve a **APIs y servicios > Credenciales**:
    *   Crear credenciales > ID de cliente de OAuth.
    *   Tipo de aplicación: **Aplicación web**.
    *   **URIs de redireccionamiento autorizados**: Agrega la URL exacta donde alojarás el archivo `setup-drive.php`.
        *   Ejemplo Local: `http://localhost:5173/api/setup-drive.php`
        *   Ejemplo Prod: `https://tu-dominio.com/api/setup-drive.php`
    *   Descarga el JSON y renómbralo a `client_secret.json`.

## 3. Instalación y Configuración

1.  Coloca `upload-to-drive.php`, `setup-drive.php` y `client_secret.json` en la misma carpeta en tu servidor.
2.  Asegúrate de que la carpeta tenga permisos de escritura (el script necesita crear `drive_token.json`).
3.  Abre `setup-drive.php` en tu navegador.
4.  Haz clic en el enlace de autorización, inicia sesión con tu cuenta de Google y acepta los permisos.
5.  Si todo sale bien, verás un mensaje de éxito y se creará el archivo `drive_token.json` automáticamente.
    *   *Nota: Este token se auto-renueva; no necesitas volver a ejecutar el setup a menos que borres el archivo.*

## 4. Uso (Integración Frontend)

Para subir un archivo desde tu frontend (JS, React, Vue, etc.), haz una petición `POST` al endpoint `upload-to-drive.php`.

### Payload (JSON)

El cuerpo de la petición debe ser un JSON con:

```json
{
  "fileName": "nombre_archivo.pdf",
  "mimeType": "application/pdf",
  "base64": "data:application/pdf;base64,JVBERi0xLjQK..."
}
```

*Nota: El campo `base64` puede venir con o sin el prefijo `data:image/...;base64,`. El script lo limpia automáticamente.*

### Ejemplo JavaScript (Fetch)

```javascript
const uploadToDrive = async (file) => {
  // 1. Convertir File a Base64
  const toBase64 = file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
  });

  const base64 = await toBase64(file);

  // 2. Enviar al servidor
  const response = await fetch('/api/upload-to-drive.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      base64: base64
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Archivo subido:', result.url);
    return result.url; // URL pública del archivo
  } else {
    throw new Error(result.error);
  }
};
```

## 5. Personalización

*   **Carpeta de Destino**: Por defecto, el script sube a una carpeta específica definida en `upload-to-drive.php` (variable `$metadata['parents']`). Cambia ese ID por el de tu carpeta en Drive.
*   **Permisos**: El script actual hace el archivo **público para leer** (`role=reader`, `type=anyone`). Si quieres que sea privado, elimina o comenta la sección "6. Hacer público" en el código PHP.
