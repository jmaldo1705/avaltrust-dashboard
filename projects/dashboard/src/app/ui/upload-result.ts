import { ToastService } from '../services/toast.service';

/** Resultado de un guardado manual o de una carga de archivo (portfolio y claims). */
export interface UploadResult {
  success: boolean;
  message: string;
  records?: number;
  errors?: unknown;
}

/**
 * Muestra el resultado de un guardado o de una carga: el mensaje general va
 * al snackbar (exito o error) y la lista de errores por fila se queda en la
 * pagina. Devuelve lo que debe mostrar la tarjeta en linea: el resultado si
 * fallo con una lista de errores, o null si no hay nada que listar.
 */
export function announceUploadResult<T extends UploadResult>(toast: ToastService, result: T): T | null {
  if (result.success) {
    toast.success(result.message);
    return null;
  }
  toast.error(result.message);
  return Array.isArray(result.errors) && result.errors.length > 0 ? result : null;
}
