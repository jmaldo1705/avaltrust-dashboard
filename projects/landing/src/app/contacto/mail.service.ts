import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Correo {
  para: readonly string[];
  asunto: string;
  cuerpoHtml: string;
  turnstileToken: string | null;
}

/**
 * Envio de correos del sitio publico.
 *
 * Usa /api/mail/send-simple, el endpoint que el backend deja abierto sin
 * autenticacion pero detras de la validacion de Turnstile: sin un token
 * valido responde 403 y no envia nada.
 */
@Injectable({ providedIn: 'root' })
export class MailService {
  private readonly http = inject(HttpClient);

  enviar(correo: Correo): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/api/mail/send-simple`, {
      to: correo.para,
      cc: [],
      bcc: [],
      subject: correo.asunto,
      htmlBody: correo.cuerpoHtml,
      turnstileToken: correo.turnstileToken,
    });
  }
}

/** Escapa lo que el visitante escribio antes de meterlo en el HTML del correo. */
export function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Arma el correo con la identidad de AvalTrust y las filas que reciba. */
export function plantillaCorreo(opciones: {
  titulo: string;
  introduccion: string;
  filas: readonly (readonly [string, string])[];
  bloques?: readonly (readonly [string, string])[];
}): string {
  const filas = opciones.filas
    .map(
      ([etiqueta, valor]) =>
        `<tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;width:40%">${escapar(etiqueta)}</td>
          <td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600">${escapar(valor)}</td>
        </tr>`,
    )
    .join('');

  const bloques = (opciones.bloques ?? [])
    .map(
      ([titulo, contenido]) =>
        `<tr><td style="padding:8px 30px 20px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:12px;border-left:4px solid #3b82f6">
            <tr><td style="padding:20px">
              <h3 style="margin:0 0 12px;color:#0f172a;font-size:16px">${escapar(titulo)}</h3>
              <p style="margin:0;color:#334155;font-size:15px;line-height:1.7;white-space:pre-wrap">${escapar(contenido)}</p>
            </td></tr>
          </table>
        </td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden">
        <tr><td style="background:#06213b;padding:28px 30px">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700">AvalTrust</p>
          <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px">${escapar(opciones.titulo)}</p>
        </td></tr>
        <tr><td style="padding:24px 30px 8px">
          <p style="margin:0 0 16px;color:#334155;font-size:15px">${escapar(opciones.introduccion)}</p>
          <table width="100%" cellpadding="0" cellspacing="0">${filas}</table>
        </td></tr>
        ${bloques}
        <tr><td style="background:#06213b;padding:20px 30px;text-align:center">
          <p style="margin:0;color:rgba(255,255,255,.7);font-size:12px">Este mensaje fue enviado desde avaltrust.co</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
