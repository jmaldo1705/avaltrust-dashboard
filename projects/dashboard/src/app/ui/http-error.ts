/** Tope para leer un cuerpo de error: un JSON de error del backend ocupa poco. */
const MAX_BODY_BYTES = 64 * 1024;

/**
 * Devuelve el `message` que el backend envia en el cuerpo de un error HTTP,
 * o null si no hay uno utilizable.
 *
 * Con `responseType: 'blob'` (descargas de Excel y PDF) el JSON del error
 * llega dentro de un Blob, y con `'arraybuffer'` en bytes, asi que se lee como
 * texto antes de interpretarlo. Un cuerpo que no es JSON (una pagina HTML de
 * un proxy, por ejemplo) no se muestra nunca, y tampoco el texto de un error
 * de red o de JavaScript (el TypeError de fetch, un DOMException): eso no lo
 * escribio el backend.
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
  if (isArrayBuffer(body) || ArrayBuffer.isView(body)) {
    if (body.byteLength === 0 || body.byteLength > MAX_BODY_BYTES) return null;
    try {
      return messageOf(parseJson(new TextDecoder().decode(body)));
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

/** Por la etiqueta y no con instanceof: vale tambien para un ArrayBuffer de otro realm. */
function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return Object.prototype.toString.call(value) === '[object ArrayBuffer]';
}

/** Un Error (TypeError de red), un DOMException (al abortar) o un evento no son el JSON del backend. */
function isRuntimeError(value: object): boolean {
  return (
    value instanceof Error ||
    (typeof DOMException !== 'undefined' && value instanceof DOMException) ||
    (typeof Event !== 'undefined' && value instanceof Event)
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
  if (isRuntimeError(body)) return null;
  const message = (body as { message?: unknown }).message;
  return typeof message === 'string' && message.trim() ? message : null;
}
