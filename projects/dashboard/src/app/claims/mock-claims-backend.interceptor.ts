import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, defer, from } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';

// In-memory store for mock claims
interface ClaimEntity {
  id: number;
  obligacion: string;
  fechaSolicitud: string;
  valorCapital: number;
  intereses: number;
  otrosConceptos: number;
  aval: string;
  direccion: string;
  codigoDepartamento: string;
  codigoCiudad: string;
  email: string;
  celular: string;
  convenioNit: string;
  nitEmpresa: string;
  creadoPor?: string;
  modificadoPor?: string;
  createdAt: string;
  updatedAt: string;
}

let CLAIMS_DB: ClaimEntity[] = [];
let NEXT_ID = 1;

const NETWORK_DELAY_MS = 300; // small artificial delay for realism

function ok<T>(body: T, status = 200) {
  return of(new HttpResponse<T>({ status, body })).pipe(delay(NETWORK_DELAY_MS));
}

function error(status: number, message: string, extra?: any) {
  return throwError(() => new HttpErrorResponse({
    status,
    statusText: message,
    error: { success: false, message, ...(extra || {}) }
  }));
}

function isClaimsUrl(url: string) {
  return url.includes('/api/claims');
}

function extractId(url: string): number | null {
  const match = url.match(/\/api\/claims\/(\d+)/);
  return match ? Number(match[1]) : null;
}

export function mockClaimsBackendInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  if (!isClaimsUrl(req.url)) {
    return next(req);
  }

  // Normalize path (ignore host), handle only /api/claims routes
  const url = req.url;
  const method = req.method.toUpperCase();

  // Routing
  if (method === 'GET' && /\/api\/claims(\/\d+)?$/.test(url)) {
    const id = extractId(url);
    if (id != null) {
      const entity = CLAIMS_DB.find(c => c.id === id);
      if (!entity) return error(404, 'Siniestro no encontrado');
      return ok({ success: true, message: 'OK', data: entity });
    }
    return ok({ success: true, message: 'OK', data: CLAIMS_DB.slice() });
  }

  if (method === 'POST' && /\/api\/claims\/?$/.test(url)) {
    const payload = req.body || {};

    // Basic validation
    const required = ['obligacion','fechaSolicitud','valorCapital','intereses','aval','direccion','codigoDepartamento','codigoCiudad','email','celular','convenioNit','nitEmpresa'];
    const errors: string[] = [];
    for (const key of required) {
      const value = payload[key];
      if (value === undefined || value === null || value === '') {
        errors.push(`El campo ${key} es obligatorio`);
      }
    }
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      errors.push('Email inválido');
    }
    if (payload.celular && !/^\d{10}$/.test(String(payload.celular))) {
      errors.push('El celular debe tener 10 dígitos');
    }
    if (payload.valorCapital != null && Number(payload.valorCapital) <= 0) {
      errors.push('El valorCapital debe ser mayor a 0');
    }
    if (payload.intereses != null && Number(payload.intereses) < 0) {
      errors.push('Los intereses no pueden ser negativos');
    }
    if (payload.otrosConceptos != null && Number(payload.otrosConceptos) < 0) {
      errors.push('Otros conceptos no pueden ser negativos');
    }

    if (errors.length > 0) {
      return ok({ success: false, message: 'Validación fallida', errors }, 400);
    }

    const now = new Date().toISOString();
    const entity: ClaimEntity = {
      id: NEXT_ID++,
      obligacion: String(payload.obligacion),
      fechaSolicitud: String(payload.fechaSolicitud),
      valorCapital: Number(payload.valorCapital),
      intereses: Number(payload.intereses),
      otrosConceptos: Number(payload.otrosConceptos || 0),
      aval: String(payload.aval),
      direccion: String(payload.direccion),
      codigoDepartamento: String(payload.codigoDepartamento),
      codigoCiudad: String(payload.codigoCiudad),
      email: String(payload.email),
      celular: String(payload.celular),
      convenioNit: String(payload.convenioNit),
      nitEmpresa: String(payload.nitEmpresa),
      creadoPor: payload.creadoPor || 'sistema',
      modificadoPor: payload.modificadoPor || 'sistema',
      createdAt: now,
      updatedAt: now
    };

    CLAIMS_DB.push(entity);

    return ok({ success: true, message: 'Siniestro creado', data: entity }, 201);
  }

  if (method === 'PUT' && /\/api\/claims\/(\d+)$/.test(url)) {
    const id = extractId(url);
    if (id == null) return error(400, 'ID inválido');
    const idx = CLAIMS_DB.findIndex(c => c.id === id);
    if (idx === -1) return error(404, 'Siniestro no encontrado');

    const payload = req.body || {};
    const updated = { ...CLAIMS_DB[idx], ...payload, id, updatedAt: new Date().toISOString() } as ClaimEntity;
    CLAIMS_DB[idx] = updated;

    return ok({ success: true, message: 'Siniestro actualizado', data: updated });
  }

  if (method === 'DELETE' && /\/api\/claims\/(\d+)$/.test(url)) {
    const id = extractId(url);
    if (id == null) return error(400, 'ID inválido');
    const idx = CLAIMS_DB.findIndex(c => c.id === id);
    if (idx === -1) return error(404, 'Siniestro no encontrado');
    CLAIMS_DB.splice(idx, 1);
    return ok({ success: true, message: 'Siniestro eliminado' });
  }

  if (method === 'POST' && /\/api\/claims\/upload$/.test(url)) {
    const body: any = req.body;
    if (!(body instanceof FormData)) {
      return ok({ success: false, message: 'Formato inválido. Se esperaba FormData con archivo.', processedRecords: 0, errors: ['FormData no recibido'] }, 400);
    }

    const file = body.get('file') as File | null;
    if (!file) {
      return ok({ success: false, message: 'No se encontró el archivo en la solicitud', processedRecords: 0, errors: ['Archivo requerido'] }, 400);
    }

    if (file.size > 10 * 1024 * 1024) {
      return ok({ success: false, message: 'El archivo es demasiado grande. Máximo 10MB.', processedRecords: 0, errors: ['Archivo demasiado grande'] }, 400);
    }

    // Simulación de procesamiento: calculamos un número estimado de registros según el tamaño del archivo
    const estimatedRecords = Math.max(1, Math.min(5000, Math.floor(file.size / 2048))); // ~1 registro por 2KB

    return ok({ success: true, message: 'Archivo procesado correctamente', processedRecords: estimatedRecords, errors: [] }, 200);
  }

  if (method === 'GET' && /\/api\/claims\/template$/.test(url)) {
    // Devolver 404 para que el componente use la generación local (fallback ya implementado)
    return error(404, 'Plantilla no disponible en el backend (usando generación local)');
  }

  // If none of the above matched, pass through
  return next(req);
}
