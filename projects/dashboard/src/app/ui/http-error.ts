/** Tope para leer un cuerpo de error: un JSON de error del backend ocupa poco. */
const MAX_BODY_BYTES = 64 * 1024;

/**
 * Devuelve el `message` que el backend envia en el cuerpo de un error HTTP,
 * o null si no hay uno utilizable.
 *
 * Con `responseType: 'blob'` (descargas de Excel y PDF) el JSON del error
 * llega dentro de un Blob, asi que se lee como texto antes de interpretarlo.
 * Un cuerpo que no es JSON (una pagina HTML de un proxy, por ejemplo) no se
 * muestra nunca.
 */
export async function readHttpErrorMessage(err: unknown): Promise<string | null> {
  const body = err !== null && typeof err === 'object' && 'error' in err ? err.error : undefined;
  if (isBlob(body)) {
    if (body.size === 0 || body.size > MAX_BODY_BYTES) return null;
    try {
      return messageOf(parseJson(await body.text()));
    } catch {
      return null;
    }
  }
  if (typeof body === 'string') return messageOf(parseJson(body));
  return messageOf(body);
}

function isBlob(value: unknown): value is Blob {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as Blob).text === 'function' &&
    typeof (value as Blob).size === 'number'
  );
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function messageOf(body: unknown): string | null {
  if (body === null || typeof body !== 'object') return null;
  const message = (body as { message?: unknown }).message;
  return typeof message === 'string' && message.trim() ? message : null;
}
